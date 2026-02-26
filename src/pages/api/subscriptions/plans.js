/**
 * ============================================
 * GET /api/subscriptions/plans
 * ============================================
 *
 * Returns all available subscription plans for display.
 * Prices are fetched directly from Stripe for accuracy.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope';
import prisma from '../../../lib/prisma';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Fetch all active subscription plans from database
  const dbPlans = await prisma.subscription_plans.findMany({
    where: {
      isActive: true,
      isPublic: true
    },
    orderBy: {
      displayOrder: 'asc'
    },
    select: {
      id: true,
      planId: true,
      name: true,
      description: true,
      stripePriceId: true,
      stripeAnnualPriceId: true,
      features: true,
      resourceLimits: true,
      highlightText: true,
      displayOrder: true
    }
  });

  // Fetch actual prices from Stripe (source of truth)
  const plans = await Promise.all(
    dbPlans.map(async (plan) => {
      let monthlyPrice = null;
      let annualPrice = null;
      let currency = 'USD';

      // Fetch monthly price from Stripe
      if (plan.stripePriceId) {
        try {
          const stripePrice = await stripe.prices.retrieve(plan.stripePriceId);
          monthlyPrice = stripePrice.unit_amount / 100;
          currency = stripePrice.currency.toUpperCase();
        } catch (err) {
          console.error(`Failed to fetch Stripe monthly price for ${plan.planId}:`, err.message);
        }
      }

      // Fetch annual price from Stripe
      if (plan.stripeAnnualPriceId) {
        try {
          const stripePrice = await stripe.prices.retrieve(plan.stripeAnnualPriceId);
          annualPrice = stripePrice.unit_amount / 100;
        } catch (err) {
          console.error(`Failed to fetch Stripe annual price for ${plan.planId}:`, err.message);
        }
      }

      return {
        id: plan.id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        // Pricing from Stripe
        price: monthlyPrice || 0, // Default display price (monthly)
        monthlyPrice,
        annualPrice,
        currency,
        billingInterval: 'monthly', // Default interval for display
        // App config from DB
        features: plan.features,
        resourceLimits: plan.resourceLimits,
        highlightText: plan.highlightText
      };
    })
  );

  return res.status(200).json({ plans });
}

export default withAdminScope(handler);
