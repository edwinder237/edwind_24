/**
 * Internal API - Get all organizations (Owner only)
 * GET /api/internal/organizations
 */

import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    // Check authentication
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS and verify owner role
    const user = await workos.userManagement.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's organization membership
    const membership = await prisma.organization_memberships.findFirst({
      where: { userId: user.id },
      select: { workos_role: true }
    });

    // Only owners can access internal organizations
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Parse query params
    const {
      search,
      page = '1',
      limit = '25',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validate sort params - only allow DB-level sortable fields
    const dbSortableFields = ['title', 'status', 'createdAt'];
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const useDbSort = dbSortableFields.includes(sortBy);
    const clientSortField = !useDbSort ? sortBy : null;

    // Build where clause
    const where = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get organizations with related data
    const [organizations, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        include: {
          subscription: {
            include: {
              plan: true
            }
          },
          sub_organizations: {
            select: {
              id: true,
              title: true,
              _count: {
                select: {
                  projects: true,
                  users: true,
                  instructors: true,
                  courses: true
                }
              }
            }
          },
          _count: {
            select: {
              organization_memberships: true
            }
          }
        },
        orderBy: useDbSort ? { [sortBy]: validSortOrder } : { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.organizations.count({ where })
    ]);

    // Get last active dates from WorkOS for each org's members
    const orgLastActive = {};
    await Promise.all(
      organizations.map(async (org) => {
        try {
          const memberships = await prisma.organization_memberships.findMany({
            where: { organizationId: org.id },
            select: { userId: true }
          });

          if (memberships.length === 0) {
            orgLastActive[org.id] = null;
            return;
          }

          // Get WorkOS user IDs for these members
          const memberUsers = await prisma.user.findMany({
            where: { id: { in: memberships.map(m => m.userId) } },
            select: { workos_user_id: true }
          });

          const workosUserIds = memberUsers
            .map(u => u.workos_user_id)
            .filter(Boolean);

          if (workosUserIds.length === 0) {
            orgLastActive[org.id] = null;
            return;
          }

          // Check each user's lastActiveAt in WorkOS
          const lastActiveDates = await Promise.all(
            workosUserIds.map(async (wuid) => {
              try {
                const wUser = await workos.userManagement.getUser(wuid);
                return wUser.lastSignInAt || null;
              } catch {
                return null;
              }
            })
          );

          // Get the most recent date
          const validDates = lastActiveDates.filter(Boolean);
          if (validDates.length > 0) {
            orgLastActive[org.id] = validDates.sort((a, b) => new Date(b) - new Date(a))[0];
          } else {
            orgLastActive[org.id] = null;
          }
        } catch {
          orgLastActive[org.id] = null;
        }
      })
    );

    // Format response
    const formattedOrganizations = organizations.map(org => {
      // Aggregate sub-org stats
      const totalProjects = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.projects || 0), 0
      );
      const totalUsers = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.users || 0), 0
      );
      const totalInstructors = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.instructors || 0), 0
      );
      const totalCourses = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.courses || 0), 0
      );

      return {
        id: org.id,
        title: org.title,
        description: org.description,
        workosOrgId: org.workos_org_id,
        status: org.status,
        type: org.type,
        logoUrl: org.logo_url,
        createdAt: org.createdAt,
        lastActiveAt: orgLastActive[org.id] || null,
        subscription: org.subscription ? {
          planId: org.subscription.planId,
          planName: org.subscription.plan?.name,
          status: org.subscription.status
        } : null,
        stats: {
          subOrganizations: org.sub_organizations.length,
          members: org._count.organization_memberships,
          projects: totalProjects,
          users: totalUsers,
          instructors: totalInstructors,
          courses: totalCourses
        }
      };
    });

    // Client-side sort for computed fields
    if (clientSortField) {
      const sortAccessors = {
        plan: (o) => o.subscription?.planName || '',
        subOrganizations: (o) => o.stats?.subOrganizations || 0,
        members: (o) => o.stats?.members || 0,
        projects: (o) => o.stats?.projects || 0,
        courses: (o) => o.stats?.courses || 0,
        lastActiveAt: (o) => o.lastActiveAt ? new Date(o.lastActiveAt).getTime() : 0
      };
      const accessor = sortAccessors[clientSortField];
      if (accessor) {
        formattedOrganizations.sort((a, b) => {
          const aVal = accessor(a);
          const bVal = accessor(b);
          if (typeof aVal === 'string') {
            return validSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return validSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }
    }

    // Calculate aggregate stats
    const [totalOrgs, activeSubscriptions, deactivatedOrgs] = await Promise.all([
      prisma.organizations.count(),
      prisma.subscriptions.count({ where: { status: 'active' } }),
      prisma.organizations.count({ where: { status: 'inactive' } })
    ]);

    return res.status(200).json({
      organizations: formattedOrganizations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        totalOrganizations: totalOrgs,
        activeSubscriptions,
        deactivatedOrganizations: deactivatedOrgs
      }
    });

  }
});
