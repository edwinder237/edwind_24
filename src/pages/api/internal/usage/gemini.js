/**
 * Internal API - Gemini AI Usage Analytics
 * GET /api/internal/usage/gemini
 *
 * Returns Gemini AI usage metrics for the dashboard:
 * - Token usage (input/output)
 * - Request counts
 * - Estimated costs
 * - Usage trends
 */

import prisma from '../../../../lib/prisma';

// Gemini 2.5 Flash Lite Pricing (as of 2024)
// Input: $0.075 per 1M tokens
// Output: $0.30 per 1M tokens
const GEMINI_PRICING = {
  inputPerMillion: 0.075,
  outputPerMillion: 0.30,
  model: 'gemini-2.5-flash-lite'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication (owner only)
    const userId = req.cookies.workos_user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const membership = await prisma.organization_memberships.findFirst({
      where: { userId },
      select: { workos_role: true }
    });

    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRequests,
      requestsThisMonth,
      requestsLastMonth,
      successfulRequests,
      failedRequests,
      tokenUsageAllTime,
      tokenUsageThisMonth,
      byAction,
      topOrganizations,
      topUsers,
      dailyTrend
    ] = await Promise.all([
      // Total Gemini requests (all time)
      prisma.usage_logs.count({
        where: { provider: 'gemini' }
      }),

      // Requests this month
      prisma.usage_logs.count({
        where: {
          provider: 'gemini',
          createdAt: { gte: thisMonthStart }
        }
      }),

      // Requests last month (for comparison)
      prisma.usage_logs.count({
        where: {
          provider: 'gemini',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        }
      }),

      // Successful requests
      prisma.usage_logs.count({
        where: {
          provider: 'gemini',
          success: true
        }
      }),

      // Failed requests
      prisma.usage_logs.count({
        where: {
          provider: 'gemini',
          success: false
        }
      }),

      // Token usage (all time)
      prisma.usage_logs.aggregate({
        where: {
          provider: 'gemini',
          success: true
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCostUsd: true,
          durationMs: true
        },
        _avg: {
          durationMs: true
        }
      }),

      // Token usage (this month)
      prisma.usage_logs.aggregate({
        where: {
          provider: 'gemini',
          success: true,
          createdAt: { gte: thisMonthStart }
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCostUsd: true
        }
      }),

      // Usage by action type
      prisma.usage_logs.groupBy({
        by: ['action'],
        where: {
          provider: 'gemini',
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCostUsd: true
        }
      }),

      // Top organizations by Gemini usage
      prisma.usage_logs.groupBy({
        by: ['organizationId'],
        where: {
          provider: 'gemini',
          organizationId: { not: null },
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: {
          totalTokens: true,
          estimatedCostUsd: true
        },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // Top users by Gemini usage
      prisma.usage_logs.groupBy({
        by: ['userId'],
        where: {
          provider: 'gemini',
          userId: { not: null },
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: {
          totalTokens: true,
          estimatedCostUsd: true
        },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // Daily trend (last 30 days)
      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(*)::int as count,
          COALESCE(SUM("inputTokens"), 0)::int as "inputTokens",
          COALESCE(SUM("outputTokens"), 0)::int as "outputTokens",
          COALESCE(SUM("totalTokens"), 0)::int as "totalTokens",
          COALESCE(SUM("estimatedCostUsd"), 0)::float as cost
        FROM usage_logs
        WHERE provider = 'gemini'
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `.catch(() => [])
    ]);

    // Fetch organization names for top orgs
    const orgIds = topOrganizations.map(o => o.organizationId).filter(Boolean);
    const organizations = orgIds.length > 0 ? await prisma.organizations.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, title: true }
    }) : [];
    const orgMap = new Map(organizations.map(o => [o.id, o.title]));

    // Fetch user names for top users
    const userIds = topUsers.map(u => u.userId).filter(Boolean);
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { workos_user_id: { in: userIds } },
      select: { workos_user_id: true, firstName: true, lastName: true, email: true }
    }) : [];
    const userMap = new Map(users.map(u => [
      u.workos_user_id,
      `${u.firstName} ${u.lastName}`.trim() || u.email
    ]));

    // Calculate costs
    const allTimeInputTokens = tokenUsageAllTime._sum?.inputTokens || 0;
    const allTimeOutputTokens = tokenUsageAllTime._sum?.outputTokens || 0;
    const monthInputTokens = tokenUsageThisMonth._sum?.inputTokens || 0;
    const monthOutputTokens = tokenUsageThisMonth._sum?.outputTokens || 0;

    // Calculate estimated costs using pricing
    const allTimeCost = tokenUsageAllTime._sum?.estimatedCostUsd ||
      ((allTimeInputTokens / 1000000) * GEMINI_PRICING.inputPerMillion) +
      ((allTimeOutputTokens / 1000000) * GEMINI_PRICING.outputPerMillion);

    const monthCost = tokenUsageThisMonth._sum?.estimatedCostUsd ||
      ((monthInputTokens / 1000000) * GEMINI_PRICING.inputPerMillion) +
      ((monthOutputTokens / 1000000) * GEMINI_PRICING.outputPerMillion);

    // Success rate
    const successRate = totalRequests > 0
      ? ((successfulRequests / totalRequests) * 100).toFixed(1)
      : 100;

    // Month-over-month growth
    const momGrowth = requestsLastMonth > 0
      ? (((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100).toFixed(1)
      : requestsThisMonth > 0 ? 100 : 0;

    // Check if Gemini is configured
    const configured = !!process.env.GOOGLE_GEMINI_API_KEY;

    return res.status(200).json({
      configured,
      model: GEMINI_PRICING.model,
      metrics: {
        totalRequests,
        requestsThisMonth,
        requestsLastMonth,
        successfulRequests,
        failedRequests,
        successRate: parseFloat(successRate),
        momGrowth: parseFloat(momGrowth)
      },
      tokens: {
        allTime: {
          input: allTimeInputTokens,
          output: allTimeOutputTokens,
          total: tokenUsageAllTime._sum?.totalTokens || 0
        },
        thisMonth: {
          input: monthInputTokens,
          output: monthOutputTokens,
          total: tokenUsageThisMonth._sum?.totalTokens || 0
        }
      },
      costs: {
        allTime: Math.round(allTimeCost * 10000) / 10000,
        thisMonth: Math.round(monthCost * 10000) / 10000
      },
      performance: {
        avgDurationMs: Math.round(tokenUsageAllTime._avg?.durationMs || 0),
        totalDurationMs: tokenUsageAllTime._sum?.durationMs || 0
      },
      byAction: byAction.map(item => ({
        action: item.action,
        count: item._count.id,
        tokens: item._sum?.totalTokens || 0,
        cost: item._sum?.estimatedCostUsd || 0
      })),
      topOrganizations: topOrganizations.map(o => ({
        organizationId: o.organizationId,
        organizationName: orgMap.get(o.organizationId) || 'Unknown',
        count: o._count.id,
        tokens: o._sum?.totalTokens || 0,
        cost: o._sum?.estimatedCostUsd || 0
      })),
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        userName: userMap.get(u.userId) || u.userId,
        count: u._count.id,
        tokens: u._sum?.totalTokens || 0,
        cost: u._sum?.estimatedCostUsd || 0
      })),
      dailyTrend,
      pricing: GEMINI_PRICING
    });

  } catch (error) {
    console.error('[Gemini Usage] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Gemini usage data' });
  }
}
