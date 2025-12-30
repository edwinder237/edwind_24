/**
 * ============================================
 * GET /api/subscriptions/plans
 * ============================================
 *
 * Returns all available subscription plans for display
 * in the upgrade dialog.
 */

import { WorkOS } from '@workos-inc/node';
import { getClaimsFromRequest } from '../../../lib/auth/claimsManager';
import { PrismaClient } from '@prisma/client';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user claims from JWT (authentication check)
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch all active subscription plans
    const plans = await prisma.subscription_plans.findMany({
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
        price: true,
        currency: true,
        billingInterval: true,
        trialDays: true,
        features: true,
        resourceLimits: true,
        highlightText: true,
        displayOrder: true
      }
    });

    // Return formatted plans
    return res.status(200).json({
      plans: plans.map(plan => ({
        id: plan.id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        trialDays: plan.trialDays,
        features: plan.features,
        resourceLimits: plan.resourceLimits,
        highlightText: plan.highlightText
      }))
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription plans',
      message: error.message
    });
  }
}
