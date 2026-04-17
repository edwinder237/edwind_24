import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../../lib/api/createHandler';
import prisma from '../../../../lib/prisma';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default createHandler({
  scope: 'admin',
  GET: async (req, res) => {
    const { organizationId, subOrganizationIds } = req.orgContext;

    const {
      search = '',
      page = '1',
      limit = '25',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      subOrgId,
      role,
      appRole
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause - SCOPED TO ORGANIZATION'S SUB-ORGANIZATIONS
    const where = {
      sub_organizationId: {
        in: subOrganizationIds
      }
    };

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

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (subOrgId) {
      const requestedSubOrgId = parseInt(subOrgId, 10);
      if (subOrganizationIds.includes(requestedSubOrgId)) {
        where.sub_organizationId = requestedSubOrgId;
      }
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          sub_organization: {
            select: { id: true, title: true }
          },
          organization_memberships: {
            include: {
              organization: {
                select: { id: true, title: true }
              }
            }
          },
          role_assignments: {
            where: {
              organizationId,
              isActive: true
            },
            include: {
              role: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  description: true,
                  hierarchyLevel: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    const workosInstance = getWorkOS();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        let workosRole = null;
        let workosStatus = null;
        let lastActiveAt = null;

        if (user.organization_memberships.length > 0) {
          const primaryMembership = user.organization_memberships[0];
          workosRole = primaryMembership.workos_role;
          workosStatus = primaryMembership.status;
        }

        if (user.workos_user_id) {
          try {
            const workosUser = await workosInstance.userManagement.getUser(user.workos_user_id);
            lastActiveAt = workosUser.lastActiveAt || null;

            if (!workosRole) {
              const memberships = await workosInstance.userManagement.listOrganizationMemberships({
                userId: user.workos_user_id
              });
              if (memberships.data?.length > 0) {
                workosRole = memberships.data[0].role?.slug || 'member';
                workosStatus = memberships.data[0].status;
              }
            }
          } catch (err) {
          }
        }

        const appRoleAssignment = user.role_assignments?.[0];
        const userAppRole = appRoleAssignment?.role || null;

        return {
          id: user.id,
          workos_user_id: user.workos_user_id,
          name: user.name,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastActiveAt,
          sub_organization: user.sub_organization,
          role: workosRole || 'member',
          workosStatus: workosStatus || 'active',
          appRole: userAppRole,
          organizations: user.organization_memberships.map(m => ({
            id: m.organization.id,
            title: m.organization.title,
            role: m.workos_role
          }))
        };
      })
    );

    let filteredUsers = usersWithRoles;
    if (role) {
      filteredUsers = usersWithRoles.filter(
        user => user.role?.toLowerCase() === role.toLowerCase()
      );
    }

    if (appRole) {
      filteredUsers = filteredUsers.filter(
        user => user.appRole?.slug?.toLowerCase() === appRole.toLowerCase()
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
  }
});
