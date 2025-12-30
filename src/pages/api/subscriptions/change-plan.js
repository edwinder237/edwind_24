/**
 * ============================================
 * POST /api/subscriptions/change-plan
 * ============================================
 *
 * Changes the organization's subscription plan.
 * Creates audit history entry for the change.
 */

import { WorkOS } from '@workos-inc/node';
import { getClaimsFromRequest } from '../../../lib/auth/claimsManager';
import { getOrgSubscription, updateSubscription } from '../../../lib/features/subscriptionService';
import { PrismaClient } from '@prisma/client';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user claims from JWT
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - No organization found' });
    }

    // Get the first organization
    const firstOrg = claims.organizations[0];

    // Check if user has admin role
    const hasAdminRole = firstOrg.role === 'Admin' || firstOrg.role === 'Organization Admin';
    if (!hasAdminRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only organization administrators can change subscription plans'
      });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'planId is required'
      });
    }

    // Get the organization from database
    const organization = await prisma.organizations.findUnique({
      where: { workos_org_id: firstOrg.workos_org_id },
      select: {
        id: true,
        title: true,
        workos_org_id: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verify the target plan exists
    const targetPlan = await prisma.subscription_plans.findUnique({
      where: { planId }
    });

    if (!targetPlan) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan '${planId}' does not exist`
      });
    }

    if (!targetPlan.isActive || !targetPlan.isPublic) {
      return res.status(400).json({
        error: 'Plan unavailable',
        message: 'This subscription plan is not currently available'
      });
    }

    // Get current subscription
    const currentSubscription = await getOrgSubscription(organization.id);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'Organization does not have an active subscription'
      });
    }

    // Check if already on this plan
    if (currentSubscription.planId === planId) {
      return res.status(400).json({
        error: 'Same plan',
        message: 'Organization is already on this plan'
      });
    }

    // Calculate new period end (30 days from now)
    const newPeriodEnd = new Date();
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

    // Update the subscription
    const updatedSubscription = await updateSubscription(organization.id, {
      planId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: newPeriodEnd,
      updatedBy: claims.user || claims.email || 'user'
    });

    // Create history entry
    await prisma.subscription_history.create({
      data: {
        subscriptionId: updatedSubscription.id,
        eventType: 'plan_changed',
        fromPlanId: currentSubscription.planId,
        toPlanId: planId,
        fromStatus: currentSubscription.status,
        toStatus: updatedSubscription.status,
        reason: `Plan changed from ${currentSubscription.plan.name} to ${targetPlan.name}`,
        changedBy: claims.user || claims.email || 'user',
        changedByRole: claims.role || 'unknown'
      }
    });

    // Return updated subscription
    const refreshedSubscription = await getOrgSubscription(organization.id, true);

    return res.status(200).json({
      success: true,
      message: `Successfully changed plan to ${targetPlan.name}`,
      subscription: {
        id: refreshedSubscription.id,
        organizationId: refreshedSubscription.organizationId,
        planId: refreshedSubscription.planId,
        status: refreshedSubscription.status,
        currentPeriodStart: refreshedSubscription.currentPeriodStart,
        currentPeriodEnd: refreshedSubscription.currentPeriodEnd,
        plan: {
          name: refreshedSubscription.plan.name,
          description: refreshedSubscription.plan.description,
          price: refreshedSubscription.plan.price,
          currency: refreshedSubscription.plan.currency,
          billingInterval: refreshedSubscription.plan.billingInterval,
          features: refreshedSubscription.plan.features,
          resourceLimits: refreshedSubscription.plan.resourceLimits
        }
      }
    });

  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return res.status(500).json({
      error: 'Failed to change subscription plan',
      message: error.message
    });
  }
}
