import { WorkOS } from '@workos-inc/node';
import { parse } from 'cookie';
import prisma from '../../../../lib/prisma';
import { getCurrentOrganization, getOrganizationContext } from '../../../../lib/session/organizationSession';

// Initialize WorkOS
let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from cookie
    const cookies = parse(req.headers.cookie || '');
    const workosUserId = cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get current user and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      include: {
        organization_memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user has admin role in any organization
    const adminMembership = currentUser.organization_memberships.find(
      membership => ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
    );

    if (!adminMembership) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get current organization from session cookie
    const currentOrgId = await getCurrentOrganization(req);

    if (!currentOrgId) {
      return res.status(400).json({ error: 'No organization selected. Please select an organization first.' });
    }

    // Get organization context with sub-organization IDs
    const orgContext = await getOrganizationContext(currentOrgId);

    if (!orgContext) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    // Verify admin has access to this organization
    const hasAccessToOrg = currentUser.organization_memberships.some(
      m => m.organizationId === currentOrgId && ADMIN_ROLES.includes(m.workos_role?.toLowerCase())
    );

    if (!hasAccessToOrg) {
      return res.status(403).json({ error: 'You do not have admin access to this organization' });
    }

    // Get query parameters
    const {
      search = '',
      page = '1',
      limit = '25',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      subOrgId,
      role
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause - SCOPED TO ORGANIZATION'S SUB-ORGANIZATIONS
    const where = {
      // Only show users belonging to sub-organizations within this organization
      sub_organizationId: {
        in: orgContext.subOrganizationIds
      }
    };

    // Search filter
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Sub-organization filter (must be within the allowed sub-orgs)
    if (subOrgId) {
      const requestedSubOrgId = parseInt(subOrgId, 10);
      // Verify the requested sub-org belongs to the current organization
      if (orgContext.subOrganizationIds.includes(requestedSubOrgId)) {
        where.sub_organizationId = requestedSubOrgId;
      }
    }

    // Get users with their organization memberships
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          sub_organization: {
            select: {
              id: true,
              title: true
            }
          },
          organization_memberships: {
            include: {
              organization: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    // Get WorkOS memberships for role information
    const workosInstance = getWorkOS();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        let workosRole = null;
        let workosStatus = null;

        // Try to get role from local cache first
        if (user.organization_memberships.length > 0) {
          const primaryMembership = user.organization_memberships[0];
          workosRole = primaryMembership.workos_role;
          workosStatus = primaryMembership.status;
        }

        // If no local cache, try to fetch from WorkOS
        if (!workosRole && user.workos_user_id) {
          try {
            const memberships = await workosInstance.userManagement.listOrganizationMemberships({
              userId: user.workos_user_id
            });
            if (memberships.data?.length > 0) {
              workosRole = memberships.data[0].role?.slug || 'member';
              workosStatus = memberships.data[0].status;
            }
          } catch (err) {
            console.warn(`Could not fetch WorkOS memberships for user ${user.id}:`, err.message);
          }
        }

        return {
          id: user.id,
          workos_user_id: user.workos_user_id,
          name: user.name,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          sub_organization: user.sub_organization,
          role: workosRole || 'member',
          workosStatus: workosStatus || 'active',
          organizations: user.organization_memberships.map(m => ({
            id: m.organization.id,
            title: m.organization.title,
            role: m.workos_role
          }))
        };
      })
    );

    // Filter by role if specified
    let filteredUsers = usersWithRoles;
    if (role) {
      filteredUsers = usersWithRoles.filter(
        user => user.role?.toLowerCase() === role.toLowerCase()
      );
    }

    return res.status(200).json({
      users: filteredUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
}
