/**
 * ============================================
 * GET /api/subscriptions/plans
 * ============================================
 *
 * Returns all available subscription plans for display
 * in the upgrade dialog.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Organization context is validated by withAdminScope middleware
  // No need to use orgContext here, just confirming user is admin

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
}

export default withAdminScope(handler);
