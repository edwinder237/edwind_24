/**
 * Internal API - Google Maps API Usage (Owner only)
 *
 * GET /api/internal/usage/maps
 * Fetches Maps usage statistics from internal usage_logs
 */

import prisma from '../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Google Maps pricing (USD)
const MAPS_PRICING = {
  autocomplete: 0.00283,      // $2.83 per 1000 requests
  placeDetails: 0.017,        // $17 per 1000 requests (Basic)
  mapLoad: 0.007              // $7 per 1000 Dynamic Map loads
};

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

    // Check for Google Maps API key (just to show configured status)
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!mapsApiKey) {
      return res.status(200).json({
        configured: false,
        message: 'Google Maps API key not configured. Add GOOGLE_MAPS_API_KEY to your environment variables.',
        metrics: null
      });
    }

    // Get billing period (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get ALL-TIME maps stats from usage_logs
    const mapsStats = await prisma.usage_logs.aggregate({
      where: {
        provider: 'maps'
      },
      _count: { id: true },
      _sum: {
        estimatedCostUsd: true
      }
    });

    // Get current month stats
    const currentMonthStats = await prisma.usage_logs.aggregate({
      where: {
        provider: 'maps',
        createdAt: {
          gte: startOfMonth,
          lte: now
        }
      },
      _count: { id: true },
      _sum: {
        estimatedCostUsd: true
      }
    });

    // Get stats by action (autocomplete vs place_details)
    const statsByAction = await prisma.usage_logs.groupBy({
      by: ['action'],
      where: {
        provider: 'maps'
      },
      _count: { id: true },
      _sum: { estimatedCostUsd: true }
    });

    // Get daily trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrend = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        action,
        COUNT(*)::int as calls,
        COALESCE(SUM("estimatedCostUsd"), 0)::float as cost
      FROM usage_logs
      WHERE provider = 'maps'
        AND "createdAt" >= ${thirtyDaysAgo}
        AND "createdAt" <= ${now}
      GROUP BY DATE("createdAt"), action
      ORDER BY date DESC
      LIMIT 60
    `;

    // Get success/failure stats
    const successStats = await prisma.usage_logs.groupBy({
      by: ['success'],
      where: {
        provider: 'maps'
      },
      _count: { id: true }
    });

    // Calculate metrics
    const totalCalls = mapsStats._count?.id || 0;
    const totalCost = mapsStats._sum?.estimatedCostUsd || 0;
    const currentMonthCalls = currentMonthStats._count?.id || 0;
    const currentMonthCost = currentMonthStats._sum?.estimatedCostUsd || 0;

    // Calculate success rate
    const successData = successStats.find(s => s.success === true);
    const failedData = successStats.find(s => s.success === false);
    const successCalls = successData?._count?.id || 0;
    const failedCalls = failedData?._count?.id || 0;
    const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(2) : '100.00';

    // Parse stats by action
    const autocompleteStats = statsByAction.find(a => a.action === 'autocomplete');
    const placeDetailsStats = statsByAction.find(a => a.action === 'place_details');
    const mapLoadStats = statsByAction.find(a => a.action === 'map_load');

    const metrics = {
      totalCalls,
      totalCost,
      currentMonthCalls,
      currentMonthCost,
      successRate,
      successCalls,
      failedCalls,
      autocomplete: {
        calls: autocompleteStats?._count?.id || 0,
        cost: autocompleteStats?._sum?.estimatedCostUsd || 0
      },
      placeDetails: {
        calls: placeDetailsStats?._count?.id || 0,
        cost: placeDetailsStats?._sum?.estimatedCostUsd || 0
      },
      mapLoad: {
        calls: mapLoadStats?._count?.id || 0,
        cost: mapLoadStats?._sum?.estimatedCostUsd || 0
      },
      dataSource: 'usage_logs'
    };

    const byAction = statsByAction.map(a => ({
      action: a.action,
      calls: a._count.id,
      cost: a._sum?.estimatedCostUsd || 0
    }));

    return res.status(200).json({
      configured: true,
      metrics,
      pricing: MAPS_PRICING,
      byAction,
      dailyTrend,
      billingPeriod: {
        start: startOfMonth.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error('[Maps Usage] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Maps usage',
      details: error.message
    });
  }
}
