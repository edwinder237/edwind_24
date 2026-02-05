/**
 * Internal API - Usage Statistics (Owner only)
 *
 * GET /api/internal/usage/stats
 * Query parameters:
 *   - startDate: ISO date string (default: 30 days ago)
 *   - endDate: ISO date string (default: now)
 *   - provider: Filter by provider (gemini, maps, resend, r2)
 *   - organizationId: Filter by organization
 */

import prisma from '../../../../lib/prisma';
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

    // Only owners can access internal usage stats
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Parse query parameters
    const { startDate, endDate, provider, organizationId } = req.query;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateFilter = {
      createdAt: {
        gte: startDate ? new Date(startDate) : thirtyDaysAgo,
        lte: endDate ? new Date(endDate) : now
      }
    };

    const where = { ...dateFilter };
    if (provider) where.provider = provider;
    if (organizationId) where.organizationId = organizationId;

    // Global where (without org filter) for calculating proportional shares
    const globalWhere = { ...dateFilter };
    if (provider) globalWhere.provider = provider;

    // Run queries in parallel for performance
    const [totalCalls, callsByProvider, topOrganizations, topUsers, dailyTrend, totalCost, globalTotals] = await Promise.all([
      // Total calls count
      prisma.usage_logs.count({ where }),

      // Calls grouped by provider
      prisma.usage_logs.groupBy({
        by: ['provider'],
        where,
        _count: { id: true },
        _sum: { estimatedCostUsd: true }
      }),

      // Top organizations by usage (with org names, user counts, and subscription status)
      prisma.usage_logs
        .groupBy({
          by: ['organizationId'],
          where: { ...where, organizationId: { not: null } },
          _count: { id: true },
          _sum: { estimatedCostUsd: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
        .then(async (orgs) => {
          // Fetch organization names, user counts, and subscription status
          const orgIds = orgs.map((o) => o.organizationId).filter(Boolean);
          const organizations = await prisma.organizations.findMany({
            where: { id: { in: orgIds } },
            select: {
              id: true,
              title: true,
              _count: {
                select: { organization_memberships: true }
              },
              subscription: {
                select: {
                  status: true,
                  planId: true,
                  plan: {
                    select: { name: true }
                  }
                }
              }
            }
          });
          const orgMap = new Map(organizations.map((o) => [o.id, {
            title: o.title,
            userCount: o._count.organization_memberships,
            subscription: o.subscription ? {
              status: o.subscription.status,
              planId: o.subscription.planId,
              planName: o.subscription.plan?.name
            } : null
          }]));

          return orgs.map((o) => ({
            organizationId: o.organizationId,
            organizationName: orgMap.get(o.organizationId)?.title || 'Unknown',
            userCount: orgMap.get(o.organizationId)?.userCount || 0,
            subscription: orgMap.get(o.organizationId)?.subscription || null,
            count: o._count.id,
            cost: o._sum?.estimatedCostUsd || 0
          }));
        }),

      // Top users by usage (with user names and organizations)
      prisma.usage_logs
        .groupBy({
          by: ['userId'],
          where: { ...where, userId: { not: null } },
          _count: { id: true },
          _sum: { estimatedCostUsd: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
        .then(async (users) => {
          // Fetch user names and organizations from User table
          const userIds = users.map((u) => u.userId).filter(Boolean);
          const userRecords = await prisma.user.findMany({
            where: { workos_user_id: { in: userIds } },
            select: {
              workos_user_id: true,
              firstName: true,
              lastName: true,
              email: true,
              sub_organization: {
                select: {
                  title: true,
                  organization: {
                    select: { title: true }
                  }
                }
              }
            }
          });
          const userMap = new Map(
            userRecords.map((u) => [
              u.workos_user_id,
              {
                name: `${u.firstName} ${u.lastName}`.trim() || u.email,
                email: u.email,
                subOrgName: u.sub_organization?.title || null,
                orgName: u.sub_organization?.organization?.title || null
              }
            ])
          );

          return users.map((u) => ({
            userId: u.userId,
            userName: userMap.get(u.userId)?.name || u.userId,
            userEmail: userMap.get(u.userId)?.email || null,
            organizationName: userMap.get(u.userId)?.orgName || null,
            subOrganizationName: userMap.get(u.userId)?.subOrgName || null,
            count: u._count.id,
            cost: u._sum?.estimatedCostUsd || 0
          }));
        }),

      // Daily trend (last 30 days)
      (async () => {
        try {
          const baseQuery = `
            SELECT
              DATE("createdAt") as date,
              provider,
              COUNT(*)::int as count,
              COALESCE(SUM("estimatedCostUsd"), 0)::float as cost
            FROM usage_logs
            WHERE "createdAt" >= $1
              AND "createdAt" <= $2
              ${provider ? 'AND provider = $3' : ''}
            GROUP BY DATE("createdAt"), provider
            ORDER BY date DESC
          `;
          const params = provider
            ? [dateFilter.createdAt.gte, dateFilter.createdAt.lte, provider]
            : [dateFilter.createdAt.gte, dateFilter.createdAt.lte];
          return await prisma.$queryRawUnsafe(baseQuery, ...params);
        } catch {
          return [];
        }
      })(),

      // Total estimated cost and token usage
      prisma.usage_logs.aggregate({
        where,
        _sum: {
          estimatedCostUsd: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true
        }
      }),

      // Global totals (without org filter) for calculating proportional shares
      organizationId ? prisma.usage_logs.groupBy({
        by: ['organizationId'],
        where: { ...globalWhere, organizationId: { not: null } },
        _count: { id: true },
        _sum: { estimatedCostUsd: true }
      }).then(orgs => {
        const total = orgs.reduce((sum, o) => sum + o._count.id, 0);
        const selected = orgs.find(o => o.organizationId === organizationId);
        return {
          totalCalls: total,
          selectedOrgCalls: selected?._count.id || 0,
          allOrgs: orgs.map(o => ({
            organizationId: o.organizationId,
            count: o._count.id,
            cost: o._sum?.estimatedCostUsd || 0
          }))
        };
      }) : null
    ]);

    // Find top provider
    const topProvider = callsByProvider.reduce(
      (max, curr) => (curr._count.id > (max?._count?.id || 0) ? curr : max),
      null
    );

    // Find top organization
    const topOrg = topOrganizations[0] || null;

    return res.status(200).json({
      summary: {
        totalCalls,
        totalCost: totalCost._sum?.estimatedCostUsd || 0,
        topProvider: topProvider?.provider || null,
        topOrganization: topOrg?.organizationName || null,
        // Token usage stats (from Gemini API responses)
        totalInputTokens: totalCost._sum?.inputTokens || 0,
        totalOutputTokens: totalCost._sum?.outputTokens || 0,
        totalTokens: totalCost._sum?.totalTokens || 0,
        dateRange: {
          start: dateFilter.createdAt.gte.toISOString(),
          end: dateFilter.createdAt.lte.toISOString()
        }
      },
      byProvider: callsByProvider.map((p) => ({
        provider: p.provider,
        count: p._count.id,
        cost: p._sum?.estimatedCostUsd || 0
      })),
      topOrganizations,
      topUsers,
      dailyTrend,
      // Include global totals when filtering by org (for proportional share calculation)
      globalTotals: globalTotals || null
    });
  } catch (error) {
    console.error('[Usage Stats] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage statistics',
      details: error.message
    });
  }
}
