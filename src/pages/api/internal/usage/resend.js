/**
 * Internal API - Resend Email Service Usage (Owner only)
 *
 * GET /api/internal/usage/resend
 * Fetches email statistics from internal usage_logs
 */

import prisma from '../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Resend pricing (USD)
const RESEND_PRICING = {
  perEmail: 0.001,        // $1 per 1000 emails (after free tier)
  freeEmails: 3000        // 3000 emails/month free on free plan
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

    // Check for Resend API key (just to show configured status)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return res.status(200).json({
        configured: false,
        message: 'Resend API key not configured. Add RESEND_API_KEY to your environment variables.',
        metrics: null
      });
    }

    // Get billing period (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get ALL-TIME email stats from usage_logs
    const emailStats = await prisma.usage_logs.aggregate({
      where: {
        provider: 'resend'
      },
      _count: { id: true },
      _sum: {
        inputSize: true,  // We store email count in inputSize
        estimatedCostUsd: true
      }
    });

    // Get current month stats
    const currentMonthStats = await prisma.usage_logs.aggregate({
      where: {
        provider: 'resend',
        createdAt: {
          gte: startOfMonth,
          lte: now
        }
      },
      _count: { id: true },
      _sum: {
        inputSize: true,
        estimatedCostUsd: true
      }
    });

    // Get email stats by action (all-time)
    const emailsByAction = await prisma.usage_logs.groupBy({
      by: ['action'],
      where: {
        provider: 'resend'
      },
      _count: { id: true },
      _sum: { inputSize: true }
    });

    // Get daily email trend (last 30 days for the chart)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrend = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::int as calls,
        COALESCE(SUM("inputSize"), 0)::int as emails,
        COALESCE(SUM("estimatedCostUsd"), 0)::float as cost
      FROM usage_logs
      WHERE provider = 'resend'
        AND "createdAt" >= ${thirtyDaysAgo}
        AND "createdAt" <= ${now}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    // Get success/failure stats (all-time)
    const successStats = await prisma.usage_logs.groupBy({
      by: ['success'],
      where: {
        provider: 'resend'
      },
      _count: { id: true },
      _sum: { inputSize: true }
    });

    // Calculate metrics from usage_logs
    const totalCalls = emailStats._count?.id || 0;
    const totalEmails = emailStats._sum?.inputSize || 0;
    const totalCost = emailStats._sum?.estimatedCostUsd || 0;

    // Current month stats
    const currentMonthCalls = currentMonthStats._count?.id || 0;
    const currentMonthEmails = currentMonthStats._sum?.inputSize || 0;

    // Calculate success rate from logs
    const successData = successStats.find(s => s.success === true);
    const failedData = successStats.find(s => s.success === false);
    const successCalls = successData?._count?.id || 0;
    const failedCalls = failedData?._count?.id || 0;
    const successEmails = successData?._sum?.inputSize || 0;
    const failedEmails = failedData?._sum?.inputSize || 0;

    const deliveryRate = totalEmails > 0
      ? ((successEmails / totalEmails) * 100)
      : (totalCalls > 0 ? (successCalls / totalCalls) * 100 : 100);

    // Calculate costs based on email count
    const freeLimit = parseInt(process.env.RESEND_FREE_LIMIT || '3000');
    const overage = Math.max(0, totalEmails - freeLimit);
    const overageCost = overage * RESEND_PRICING.perEmail;

    const metrics = {
      totalCalls,
      totalEmails,
      currentMonthCalls,
      currentMonthEmails,
      successRate: deliveryRate.toFixed(2),
      successCalls,
      failedCalls,
      delivered: successEmails,
      bounced: failedEmails,
      dataSource: 'usage_logs'
    };

    const costs = {
      emails: {
        sent: totalEmails,
        freeLimit,
        overage,
        pricePerEmail: RESEND_PRICING.perEmail,
        cost: overageCost
      },
      total: overageCost,
      estimated: totalEmails * RESEND_PRICING.perEmail
    };

    const byAction = emailsByAction.map(a => ({
      action: a.action,
      calls: a._count.id,
      emails: a._sum?.inputSize || 0
    }));

    return res.status(200).json({
      configured: true,
      metrics,
      costs,
      pricing: RESEND_PRICING,
      byAction,
      dailyTrend,
      billingPeriod: {
        start: startOfMonth.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error('[Resend Usage] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Resend usage',
      details: error.message
    });
  }
}
