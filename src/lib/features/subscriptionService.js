/**
 * ============================================
 * SUBSCRIPTION SERVICE LAYER
 * ============================================
 *
 * Database service for managing subscriptions.
 * Handles all CRUD operations and caching.
 */

import prisma from '../prisma.js';
import { PLAN_IDS, hasResourceCapacity } from './featureAccess';
import { getStripe, getPlanFromPriceId } from '../stripe/stripeService.js';

// Simple in-memory cache for subscriptions (15 minute TTL)
const subscriptionCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Get organization's subscription (with caching)
 *
 * @param {string} organizationId - Organization ID
 * @param {boolean} forceRefresh - Skip cache and fetch fresh
 * @returns {Promise<Object|null>} Subscription object or null
 */
export async function getOrgSubscription(organizationId, forceRefresh = false) {
  // Check cache first
  if (!forceRefresh) {
    const cached = subscriptionCache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    let subscription = await prisma.subscriptions.findUnique({
      where: {organizationId},
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            title: true,
            workos_org_id: true
          }
        }
      }
    });

    // Auto-sync from Stripe: if we have a Stripe customer but no subscription ID,
    // the checkout.session.completed webhook was missed. Look up from Stripe directly.
    if (
      subscription &&
      subscription.stripeCustomerId &&
      !subscription.stripeSubscriptionId
    ) {
      try {
        const stripe = getStripe();

        // Look up active or trialing subscriptions for this customer
        let stripeSubscriptions = await stripe.subscriptions.list({
          customer: subscription.stripeCustomerId,
          status: 'active',
          limit: 1
        });

        if (stripeSubscriptions.data.length === 0) {
          stripeSubscriptions = await stripe.subscriptions.list({
            customer: subscription.stripeCustomerId,
            status: 'trialing',
            limit: 1
          });
        }

        if (stripeSubscriptions.data.length > 0) {
          const stripeSub = stripeSubscriptions.data[0];
          const priceId = stripeSub.items.data[0]?.price?.id;
          const plan = await getPlanFromPriceId(priceId);

          const updateData = {
            stripeSubscriptionId: stripeSub.id,
            stripeProductId: stripeSub.items.data[0]?.price?.product,
            stripePriceId: priceId,
            status: stripeSub.status,
            ...(plan && { planId: plan.planId }),
            ...(stripeSub.current_period_start && {
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000)
            }),
            ...(stripeSub.current_period_end && {
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
            }),
            ...(stripeSub.trial_start && { trialStart: new Date(stripeSub.trial_start * 1000) }),
            ...(stripeSub.trial_end && { trialEnd: new Date(stripeSub.trial_end * 1000) }),
            // Clear trialEnd if Stripe says no trial (trial already ended)
            ...(!stripeSub.trial_end && subscription.trialEnd && { trialEnd: null })
          };

          await prisma.subscriptions.update({
            where: { id: subscription.id },
            data: updateData
          });

          await prisma.subscription_history.create({
            data: {
              subscriptionId: subscription.id,
              eventType: 'synced',
              fromPlanId: subscription.planId,
              toPlanId: plan?.planId || subscription.planId,
              fromStatus: subscription.status,
              toStatus: stripeSub.status,
              reason: 'Auto-synced from Stripe (missed webhook recovery)'
            }
          });

          // Invalidate cache and re-fetch with fresh data
          subscriptionCache.delete(organizationId);
          return getOrgSubscription(organizationId, true);
        }
      } catch (syncError) {
        console.error(`⚠️ [AUTO-SYNC] Failed to sync from Stripe:`, syncError.message);
        // Continue with local data — don't block the request
      }
    }

    // Fallback: handle expired trials
    // Covers both Stripe-backed and non-Stripe trials when webhooks are missed.
    if (
      subscription &&
      subscription.status === 'trialing' &&
      subscription.trialEnd &&
      new Date(subscription.trialEnd) < new Date()
    ) {
      if (!subscription.stripeSubscriptionId) {
        // Non-Stripe trial (user skipped checkout): auto-downgrade to Essential

        await prisma.subscriptions.update({
          where: { id: subscription.id },
          data: {
            planId: 'essential',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        });

        await prisma.subscription_history.create({
          data: {
            subscriptionId: subscription.id,
            eventType: 'trial_ended',
            fromPlanId: subscription.planId,
            toPlanId: 'essential',
            fromStatus: 'trialing',
            toStatus: 'active',
            reason: 'Trial expired without payment — auto-downgraded to Essential'
          }
        });

        // Invalidate cache and re-fetch
        subscriptionCache.delete(organizationId);
        return getOrgSubscription(organizationId, true);
      } else {
        // Stripe-backed trial expired but webhook didn't update status yet.
        // Assume active (Stripe will charge the card on file).
        // If payment fails, the next webhook will set status to past_due.

        await prisma.subscriptions.update({
          where: { id: subscription.id },
          data: {
            status: 'active'
          }
        });

        await prisma.subscription_history.create({
          data: {
            subscriptionId: subscription.id,
            eventType: 'trial_ended',
            fromPlanId: subscription.planId,
            toPlanId: subscription.planId,
            fromStatus: 'trialing',
            toStatus: 'active',
            reason: 'Stripe trial expired — local status updated (webhook fallback)'
          }
        });

        // Invalidate cache and re-fetch
        subscriptionCache.delete(organizationId);
        return getOrgSubscription(organizationId, true);
      }
    }

    // Cache the result
    if (subscription) {
      subscriptionCache.set(organizationId, {
        data: subscription,
        timestamp: Date.now()
      });
    }

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Create a new subscription for an organization
 *
 * @param {Object} params - Parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.planId - Plan ID (essential/professional/enterprise)
 * @param {string} params.status - Subscription status
 * @param {Date} params.currentPeriodEnd - End of current billing period
 * @param {Object} params.stripeData - Stripe integration data (optional)
 * @param {string} params.createdBy - User ID creating the subscription
 * @returns {Promise<Object>} Created subscription
 */
export async function createSubscription({
  organizationId,
  planId = PLAN_IDS.ESSENTIAL,
  status = 'active',
  currentPeriodEnd = null,
  stripeData = {},
  createdBy = 'system'
}) {
  try {
    // Calculate default period end if not provided (30 days for monthly plans)
    const periodEnd = currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscriptions.create({
      data: {
        organizationId,
        planId,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        stripeProductId: stripeData.productId,
        stripePriceId: stripeData.priceId,
        createdBy,
        history: {
          create: {
            eventType: 'created',
            toPlanId: planId,
            toStatus: status,
            reason: 'Initial subscription creation',
            changedBy: createdBy,
            changedByRole: 'system'
          }
        }
      },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Invalidate cache
    subscriptionCache.delete(organizationId);

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Update an existing subscription
 *
 * @param {Object} params - Parameters
 * @param {number} params.subscriptionId - Subscription ID
 * @param {Object} params.updates - Fields to update
 * @param {string} params.updatedBy - User ID making the update
 * @param {string} params.reason - Reason for the change
 * @returns {Promise<Object>} Updated subscription
 */
export async function updateSubscription({
  subscriptionId,
  updates,
  updatedBy = 'system',
  reason = null
}) {
  try {
    // Get current subscription for history
    const currentSub = await prisma.subscriptions.findUnique({
      where: { id: subscriptionId }
    });

    if (!currentSub) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Determine event type based on what's changing
    let eventType = 'updated';
    if (updates.planId && updates.planId !== currentSub.planId) {
      eventType = 'plan_changed';
    } else if (updates.status === 'canceled') {
      eventType = 'canceled';
    } else if (updates.status === 'active' && currentSub.status === 'canceled') {
      eventType = 'reactivated';
    }

    const subscription = await prisma.subscriptions.update({
      where: { id: subscriptionId },
      data: {
        ...updates,
        updatedBy,
        history: {
          create: {
            eventType,
            fromPlanId: currentSub.planId,
            toPlanId: updates.planId || currentSub.planId,
            fromStatus: currentSub.status,
            toStatus: updates.status || currentSub.status,
            reason: reason || `Subscription ${eventType}`,
            changedBy: updatedBy,
            metadata: {
              previousValues: {
                planId: currentSub.planId,
                status: currentSub.status
              },
              newValues: updates
            }
          }
        }
      },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Invalidate cache
    subscriptionCache.delete(currentSub.organizationId);

    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 *
 * @param {Object} params - Parameters
 * @param {number} params.subscriptionId - Subscription ID
 * @param {Date} params.cancelAt - When to cancel (null = immediate)
 * @param {string} params.reason - Cancellation reason
 * @param {string} params.canceledBy - User ID canceling
 * @returns {Promise<Object>} Updated subscription
 */
export async function cancelSubscription({
  subscriptionId,
  cancelAt = null,
  reason = 'User requested cancellation',
  canceledBy = 'system'
}) {
  try {
    const updates = cancelAt
      ? {
          cancelAt,
          updatedBy: canceledBy
        }
      : {
          status: 'canceled',
          canceledAt: new Date(),
          updatedBy: canceledBy
        };

    return await updateSubscription({
      subscriptionId,
      updates,
      updatedBy: canceledBy,
      reason
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Upgrade/downgrade a subscription plan
 *
 * @param {Object} params - Parameters
 * @param {number} params.subscriptionId - Subscription ID
 * @param {string} params.newPlanId - New plan ID
 * @param {string} params.changedBy - User ID making the change
 * @param {string} params.reason - Reason for change
 * @returns {Promise<Object>} Updated subscription
 */
export async function changePlan({
  subscriptionId,
  newPlanId,
  changedBy,
  reason = null
}) {
  try {
    const currentSub = await prisma.subscriptions.findUnique({
      where: { id: subscriptionId }
    });

    const isUpgrade = ['essential', 'professional', 'enterprise'].indexOf(newPlanId) >
                      ['essential', 'professional', 'enterprise'].indexOf(currentSub.planId);

    const defaultReason = isUpgrade
      ? `Upgraded to ${newPlanId}`
      : `Downgraded to ${newPlanId}`;

    return await updateSubscription({
      subscriptionId,
      updates: {
        planId: newPlanId
      },
      updatedBy: changedBy,
      reason: reason || defaultReason
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
}

/**
 * Get subscription history
 *
 * @param {number} subscriptionId - Subscription ID
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} History records
 */
export async function getSubscriptionHistory(subscriptionId, limit = 50) {
  try {
    return await prisma.subscription_history.findMany({
      where: { subscriptionId },
      orderBy: { changedAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    throw error;
  }
}

/**
 * Get current resource usage for an organization
 *
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Current usage statistics
 */
export async function getResourceUsage(organizationId) {
  try {
    // Get org's sub-organizations
    const subOrgs = await prisma.sub_organizations.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const subOrgIds = subOrgs.map(so => so.id);

    // Start of current month for monthly usage counts
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run queries in parallel
    const [
      projectCount,
      instructorCount,
      courseCount,
      curriculumCount,
      customRoleCount,
      // Get projects created in the last 30 days
      recentProjects,
      // Monthly email count
      emailCount,
      // Total training recipients
      trainingRecipientCount,
      // Daily SmartPulse count
      smartPulseCount
    ] = await Promise.all([
      // Total projects
      prisma.projects.count({
        where: { sub_organizationId: { in: subOrgIds } }
      }),

      // Total instructors
      prisma.instructors.count({
        where: { sub_organizationId: { in: subOrgIds } }
      }),

      // Total courses
      prisma.courses.count({
        where: { sub_organizationId: { in: subOrgIds } }
      }),

      // Total curriculums (approximate - linked to projects)
      prisma.project_curriculums.count({
        where: {
          project: { sub_organizationId: { in: subOrgIds } }
        }
      }),

      // Custom participant roles (exclude system defaults)
      prisma.sub_organization_participant_role.count({
        where: {
          sub_organizationId: { in: subOrgIds },
          isSystemDefault: { not: true }
        }
      }),

      // Projects created in last 30 days
      prisma.projects.count({
        where: {
          sub_organizationId: { in: subOrgIds },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Emails sent this month (Resend provider, successful only)
      prisma.usage_logs.count({
        where: {
          organizationId,
          provider: 'resend',
          success: true,
          createdAt: { gte: monthStart }
        }
      }),

      // Total training recipients
      prisma.training_recipients.count({
        where: { sub_organizationId: { in: subOrgIds } }
      }),

      // SmartPulse calls today (Gemini provider, summarize action, successful only)
      prisma.usage_logs.count({
        where: {
          organizationId,
          provider: 'gemini',
          action: 'summarize_session_notes',
          success: true,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
        }
      })
    ]);

    // Get total participants across all projects
    const participants = await prisma.project_participants.findMany({
      where: {
        project: { sub_organizationId: { in: subOrgIds } }
      },
      distinct: ['participantId'],
      select: { participantId: true }
    });

    return {
      projects: projectCount,
      participants: participants.length,
      sub_organizations: subOrgIds.length,
      instructors: instructorCount,
      courses: courseCount,
      curriculums: curriculumCount,
      projects_per_month: recentProjects,
      custom_roles: customRoleCount,
      emails_per_month: emailCount,
      training_recipients: trainingRecipientCount,
      smart_pulse_per_day: smartPulseCount,
    };
  } catch (error) {
    console.error('Error getting resource usage:', error);
    throw error;
  }
}

/**
 * Check if organization can create a new resource
 *
 * @param {Object} params - Parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.resource - Resource type
 * @param {number} params.amount - Amount to create (default: 1)
 * @returns {Promise<Object>} { allowed: boolean, current: number, limit: number }
 */
export async function checkResourceLimit({ organizationId, resource, amount = 1 }) {
  try {
    const subscription = await getOrgSubscription(organizationId);
    const usage = await getResourceUsage(organizationId);

    // Import here to avoid circular dependency
    const { hasResourceCapacity, RESOURCES } = require('./featureAccess');

    const currentUsage = usage[resource] || 0;

    return hasResourceCapacity({
      subscription,
      resource: RESOURCES[resource.toUpperCase()],
      currentUsage,
      requestedAmount: amount
    });
  } catch (error) {
    console.error('Error checking resource limit:', error);
    throw error;
  }
}

/**
 * Enforce a resource limit for an organization.
 * Use this in routes that already have withOrgScope (avoids redundant auth).
 *
 * @param {string} organizationId - Organization ID
 * @param {string} resource - Resource type (from RESOURCES constant)
 * @param {number} amount - Amount being created (default: 1)
 * @returns {Promise<Object>} { allowed: true } or { allowed: false, status: 403, body: {...} }
 *
 * @example
 * const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.INSTRUCTORS);
 * if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
 */
export async function enforceResourceLimit(organizationId, resource, amount = 1) {
  const subscription = await getOrgSubscription(organizationId);
  if (!subscription) return { allowed: true };

  const usage = await getResourceUsage(organizationId);
  const check = hasResourceCapacity({
    subscription,
    resource,
    currentUsage: usage[resource] || 0,
    requestedAmount: amount
  });

  if (!check.hasCapacity) {
    return {
      allowed: false,
      status: 403,
      body: {
        error: 'Resource limit exceeded',
        resource,
        message: `You have reached your ${resource} limit`,
        current: check.current,
        limit: check.limit,
        available: check.available,
        upgradeUrl: '/upgrade'
      }
    };
  }

  return { allowed: true, subscription, usage };
}

/**
 * Set custom features for an organization
 *
 * @param {Object} params - Parameters
 * @param {number} params.subscriptionId - Subscription ID
 * @param {Array} params.features - Array of feature keys
 * @param {string} params.updatedBy - User ID making the change
 * @returns {Promise<Object>} Updated subscription
 */
export async function setCustomFeatures({ subscriptionId, features, updatedBy }) {
  return await updateSubscription({
    subscriptionId,
    updates: {
      customFeatures: features
    },
    updatedBy,
    reason: 'Updated custom features'
  });
}

/**
 * Set custom resource limits for an organization
 *
 * @param {Object} params - Parameters
 * @param {number} params.subscriptionId - Subscription ID
 * @param {Object} params.limits - Object with custom limits
 * @param {string} params.updatedBy - User ID making the change
 * @returns {Promise<Object>} Updated subscription
 */
export async function setCustomLimits({ subscriptionId, limits, updatedBy }) {
  return await updateSubscription({
    subscriptionId,
    updates: {
      customLimits: limits
    },
    updatedBy,
    reason: 'Updated custom resource limits'
  });
}

/**
 * Get all subscriptions (for admin use)
 *
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of subscriptions
 */
export async function getAllSubscriptions(filters = {}) {
  try {
    const where = {};

    if (filters.planId) {
      where.planId = filters.planId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.subscriptions.findMany({
      where,
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            title: true,
            workos_org_id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    throw error;
  }
}

/**
 * Clear subscription cache for an organization
 *
 * @param {string} organizationId - Organization ID
 */
export function invalidateSubscriptionCache(organizationId) {
  subscriptionCache.delete(organizationId);
}

/**
 * Clear all subscription caches
 */
export function clearAllSubscriptionCaches() {
  subscriptionCache.clear();
}

/**
 * Cleanup function for graceful shutdown
 */
export async function disconnectPrisma() {
}

// ============================================
// STRIPE INTEGRATION FUNCTIONS
// ============================================

/**
 * Get subscription by Stripe subscription ID
 *
 * @param {string} stripeSubscriptionId - Stripe subscription ID
 * @returns {Promise<Object|null>} Subscription object or null
 */
export async function getSubscriptionByStripeId(stripeSubscriptionId) {
  try {
    return await prisma.subscriptions.findFirst({
      where: { stripeSubscriptionId },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            title: true,
            workos_org_id: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscription by Stripe ID:', error);
    throw error;
  }
}

/**
 * Update Stripe data on a subscription
 *
 * @param {Object} params - Parameters
 * @param {string} params.organizationId - Organization ID
 * @param {Object} params.stripeData - Stripe data to update
 * @returns {Promise<Object>} Updated subscription
 */
export async function updateStripeData({ organizationId, stripeData }) {
  try {
    const subscription = await prisma.subscriptions.update({
      where: { organizationId },
      data: {
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        stripeProductId: stripeData.productId,
        stripePriceId: stripeData.priceId,
        ...(stripeData.status && { status: stripeData.status }),
        ...(stripeData.currentPeriodStart && { currentPeriodStart: stripeData.currentPeriodStart }),
        ...(stripeData.currentPeriodEnd && { currentPeriodEnd: stripeData.currentPeriodEnd })
      },
      include: {
        plan: true
      }
    });

    // Invalidate cache
    subscriptionCache.delete(organizationId);

    return subscription;
  } catch (error) {
    console.error('Error updating Stripe data:', error);
    throw error;
  }
}

/**
 * Handle payment failure - update subscription status
 *
 * @param {Object} params - Parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.reason - Failure reason
 * @returns {Promise<Object>} Updated subscription
 */
export async function handlePaymentFailure({ organizationId, reason }) {
  try {
    const currentSub = await prisma.subscriptions.findUnique({
      where: { organizationId }
    });

    if (!currentSub) {
      throw new Error(`Subscription not found for org ${organizationId}`);
    }

    const subscription = await prisma.subscriptions.update({
      where: { organizationId },
      data: {
        status: 'past_due',
        history: {
          create: {
            eventType: 'payment_failed',
            fromStatus: currentSub.status,
            toStatus: 'past_due',
            reason: reason || 'Payment failed',
            changedBy: 'system',
            changedByRole: 'stripe'
          }
        }
      }
    });

    // Invalidate cache
    subscriptionCache.delete(organizationId);

    return subscription;
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle payment success - reactivate subscription if past_due
 *
 * @param {Object} params - Parameters
 * @param {string} params.organizationId - Organization ID
 * @returns {Promise<Object>} Updated subscription
 */
export async function handlePaymentSuccess({ organizationId }) {
  try {
    const currentSub = await prisma.subscriptions.findUnique({
      where: { organizationId }
    });

    if (!currentSub) {
      throw new Error(`Subscription not found for org ${organizationId}`);
    }

    // Only update if status was past_due
    if (currentSub.status !== 'past_due') {
      return currentSub;
    }

    const subscription = await prisma.subscriptions.update({
      where: { organizationId },
      data: {
        status: 'active',
        history: {
          create: {
            eventType: 'payment_succeeded',
            fromStatus: currentSub.status,
            toStatus: 'active',
            reason: 'Payment successful - subscription reactivated',
            changedBy: 'system',
            changedByRole: 'stripe'
          }
        }
      }
    });

    // Invalidate cache
    subscriptionCache.delete(organizationId);

    return subscription;
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Check if subscription is in good standing (can access paid features)
 *
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} True if subscription is active
 */
export async function isSubscriptionActive(organizationId) {
  const subscription = await getOrgSubscription(organizationId);

  if (!subscription) {
    return false;
  }

  // Active statuses
  const activeStatuses = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
}

export default {
  getOrgSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  changePlan,
  getSubscriptionHistory,
  getResourceUsage,
  checkResourceLimit,
  setCustomFeatures,
  setCustomLimits,
  getAllSubscriptions,
  invalidateSubscriptionCache,
  clearAllSubscriptionCaches,
  disconnectPrisma,
  // Stripe integration
  getSubscriptionByStripeId,
  updateStripeData,
  handlePaymentFailure,
  handlePaymentSuccess,
  isSubscriptionActive
};
