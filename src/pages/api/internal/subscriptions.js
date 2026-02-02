/**
 * Internal API - Get all subscriptions (Owner only)
 * GET /api/internal/subscriptions
 */

import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Only owners can access internal subscriptions
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Parse query params
    const {
      search,
      status,
      planId,
      page = '1',
      limit = '25'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (planId) {
      where.planId = planId;
    }

    // Get subscriptions with organization data
    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          plan: true,
          organization: {
            select: {
              id: true,
              title: true,
              workos_org_id: true,
              createdAt: true,
              sub_organizations: {
                select: {
                  id: true,
                  _count: {
                    select: {
                      projects: true,
                      users: true,
                      instructors: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.subscriptions.count({ where })
    ]);

    // Filter by search if provided (search on org title)
    let filteredSubscriptions = subscriptions;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubscriptions = subscriptions.filter(sub =>
        sub.organization?.title?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate aggregate stats
    const stats = await prisma.subscriptions.groupBy({
      by: ['status', 'planId'],
      _count: true
    });

    // Get plan distribution
    const planCounts = {};
    const statusCounts = {};

    stats.forEach(stat => {
      planCounts[stat.planId] = (planCounts[stat.planId] || 0) + stat._count;
      statusCounts[stat.status] = (statusCounts[stat.status] || 0) + stat._count;
    });

    // Format response with usage stats
    const formattedSubscriptions = filteredSubscriptions.map(sub => {
      // Calculate total usage from sub-orgs
      const totalProjects = sub.organization?.sub_organizations?.reduce(
        (acc, so) => acc + (so._count?.projects || 0), 0
      ) || 0;
      const totalUsers = sub.organization?.sub_organizations?.reduce(
        (acc, so) => acc + (so._count?.users || 0), 0
      ) || 0;
      const totalInstructors = sub.organization?.sub_organizations?.reduce(
        (acc, so) => acc + (so._count?.instructors || 0), 0
      ) || 0;

      return {
        id: sub.id,
        organizationId: sub.organizationId,
        organizationName: sub.organization?.title || 'Unknown',
        workosOrgId: sub.organization?.workos_org_id,
        planId: sub.planId,
        planName: sub.plan?.name || sub.planId,
        status: sub.status,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        usage: {
          projects: totalProjects,
          users: totalUsers,
          instructors: totalInstructors,
          subOrganizations: sub.organization?.sub_organizations?.length || 0
        }
      };
    });

    return res.status(200).json({
      subscriptions: formattedSubscriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        byPlan: planCounts,
        byStatus: statusCounts,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching internal subscriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}
