/**
 * Internal API - Stripe Subscription Analytics
 * GET /api/internal/usage/stripe
 *
 * Returns subscription metrics for the dashboard:
 * - Total subscribers by status
 * - MRR/ARR estimates (from Stripe API)
 * - Plan distribution
 * - Recent activity
 */

import prisma from '../../../../lib/prisma';
import { getStripe } from '../../../../lib/stripe/stripeService';

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

    // Get subscription counts by status from database
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      pastDueSubscriptions,
      subscriptionsByPlan,
      recentSubscriptions,
      plans
    ] = await Promise.all([
      // Total subscriptions
      prisma.subscriptions.count(),

      // Active subscriptions
      prisma.subscriptions.count({
        where: { status: 'active' }
      }),

      // Trialing subscriptions
      prisma.subscriptions.count({
        where: { status: 'trialing' }
      }),

      // Canceled subscriptions
      prisma.subscriptions.count({
        where: { status: { in: ['canceled', 'cancelled'] } }
      }),

      // Past due subscriptions
      prisma.subscriptions.count({
        where: { status: 'past_due' }
      }),

      // Subscriptions grouped by plan
      prisma.subscriptions.groupBy({
        by: ['planId'],
        where: { status: { in: ['active', 'trialing'] } },
        _count: { id: true }
      }),

      // Recent subscriptions (last 30 days)
      prisma.subscriptions.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          organization: {
            select: { title: true }
          },
          plan: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Get all plans for mapping
      prisma.subscription_plans.findMany({
        select: {
          planId: true,
          name: true,
          stripePriceId: true,
          stripeAnnualPriceId: true
        }
      })
    ]);

    // Create plan map
    const planMap = new Map(plans.map(p => [p.planId, p]));

    // Calculate plan distribution (counts only - prices come from Stripe)
    const planDistribution = subscriptionsByPlan.map(sub => {
      const plan = planMap.get(sub.planId);
      return {
        planId: sub.planId,
        planName: plan?.name || sub.planId,
        count: sub._count.id
      };
    }).sort((a, b) => b.count - a.count);

    // Get new subscriptions this month
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await prisma.subscriptions.count({
      where: {
        createdAt: { gte: thisMonthStart },
        status: { in: ['active', 'trialing'] }
      }
    });

    // Get churned this month
    const churnedThisMonth = await prisma.subscriptions.count({
      where: {
        updatedAt: { gte: thisMonthStart },
        status: { in: ['canceled', 'cancelled'] }
      }
    });

    // Try to get Stripe data (if API key is configured)
    let stripeBalance = null;
    let stripeRevenue = null;
    let stripeConfigured = false;

    if (process.env.STRIPE_SECRET_KEY) {
      stripeConfigured = true;
      try {
        const stripe = getStripe();

        // Get Stripe balance
        const balance = await stripe.balance.retrieve();
        stripeBalance = {
          available: balance.available.reduce((sum, b) => sum + b.amount, 0) / 100,
          pending: balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100,
          currency: balance.available[0]?.currency || 'usd'
        };

        // Get active Stripe subscriptions for MRR calculation
        const stripeSubscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.items.data.price']
        });

        // Calculate MRR from Stripe subscriptions
        let totalMRR = 0;
        let monthlyCount = 0;
        let annualCount = 0;

        for (const sub of stripeSubscriptions.data) {
          for (const item of sub.items.data) {
            const price = item.price;
            if (price && price.unit_amount) {
              const amount = price.unit_amount / 100; // Convert cents to dollars
              if (price.recurring?.interval === 'month') {
                totalMRR += amount;
                monthlyCount++;
              } else if (price.recurring?.interval === 'year') {
                totalMRR += amount / 12; // Convert annual to monthly
                annualCount++;
              }
            }
          }
        }

        stripeRevenue = {
          mrr: Math.round(totalMRR * 100) / 100, // Round to 2 decimals
          arr: Math.round(totalMRR * 12 * 100) / 100,
          monthlySubscriptions: monthlyCount,
          annualSubscriptions: annualCount
        };
      } catch (error) {
        console.warn('[Stripe Usage] Failed to fetch Stripe data:', error.message);
      }
    }

    // Format recent subscriptions
    const formattedRecent = recentSubscriptions.map(sub => ({
      id: sub.id,
      organizationName: sub.organization?.title || 'Unknown',
      planName: sub.plan?.name || sub.planId,
      status: sub.status,
      createdAt: sub.createdAt
    }));

    return res.status(200).json({
      configured: stripeConfigured,
      metrics: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        canceled: canceledSubscriptions,
        pastDue: pastDueSubscriptions,
        conversionRate: totalSubscriptions > 0
          ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(1)
          : 0
      },
      revenue: stripeRevenue || {
        mrr: 0,
        arr: 0,
        monthlySubscriptions: 0,
        annualSubscriptions: 0,
        note: 'Connect Stripe to see revenue data'
      },
      growth: {
        newThisMonth,
        churnedThisMonth,
        netGrowth: newThisMonth - churnedThisMonth
      },
      planDistribution,
      recentSubscriptions: formattedRecent,
      stripeBalance,
      plans: plans.map(p => ({
        planId: p.planId,
        name: p.name,
        hasMonthlyPrice: !!p.stripePriceId,
        hasAnnualPrice: !!p.stripeAnnualPriceId
      }))
    });

  } catch (error) {
    console.error('[Stripe Usage] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Stripe analytics' });
  }
}
