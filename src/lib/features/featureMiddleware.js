/**
 * ============================================
 * FEATURE ACCESS MIDDLEWARE
 * ============================================
 *
 * Middleware for protecting API routes with feature access control.
 * Integrates with existing auth middleware.
 */

import { WorkOS } from '@workos-inc/node';
import { getClaimsFromRequest } from '../auth/claimsManager';
import { getOrgSubscription } from './subscriptionService';
import { canAccessFeature, hasResourceCapacity, RESOURCES } from './featureAccess';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Middleware wrapper to require a feature
 * Use this to protect entire API routes
 *
 * @param {string} featureKey - Feature key to check
 * @returns {Function} Middleware wrapper
 *
 * @example
 * export default requireFeature('bulk_participant_import')(async (req, res) => {
 *   // Feature guaranteed to be available
 *   // Process bulk import...
 * });
 */
export function requireFeature(featureKey) {
  return function (handler) {
    return async function (req, res) {
      try {
        // Get user claims
        const claims = await getClaimsFromRequest(req, workos);

        if (!claims) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        // Get organization ID from claims
        const organizationId = claims.organizations[0]?.workos_org_id;

        if (!organizationId) {
          return res.status(403).json({
            error: 'No organization',
            message: 'User is not associated with an organization'
          });
        }

        // Get organization's local ID
        const prisma = (await import('../../../lib/prisma')).default;
        const org = await prisma.organizations.findUnique({
          where: { workos_org_id: organizationId },
          select: { id: true }
        });

        if (!org) {
          return res.status(404).json({
            error: 'Organization not found',
            message: 'Organization not found in database'
          });
        }

        // Get subscription
        const subscription = await getOrgSubscription(org.id);

        if (!subscription) {
          return res.status(403).json({
            error: 'No subscription',
            message: 'No active subscription found',
            upgradeUrl: '/upgrade'
          });
        }

        // Check feature access
        const accessCheck = canAccessFeature({
          subscription,
          userClaims: claims,
          featureKey,
          organizationId: org.id
        });

        if (!accessCheck.canAccess) {
          return res.status(403).json({
            error: 'Feature not available',
            message: accessCheck.message,
            reason: accessCheck.reason,
            requiredPlan: accessCheck.requiredPlan,
            currentPlan: subscription.planId,
            upgradeUrl: '/upgrade'
          });
        }

        // Attach subscription and claims to request for use in handler
        req.subscription = subscription;
        req.userClaims = claims;
        req.organizationId = org.id;

        // Call the actual handler
        return await handler(req, res);
      } catch (error) {
        console.error('Error in requireFeature middleware:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to check feature access'
        });
      }
    };
  };
}

/**
 * Check feature access in a handler (non-blocking)
 * Use this for manual checks within handlers
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} featureKey - Feature key to check
 * @returns {Promise<Object>} Access check result
 *
 * @example
 * const access = await checkFeatureAccess(req, res, 'advanced_analytics');
 * if (!access.canAccess) {
 *   return res.status(403).json({ error: access.message });
 * }
 */
export async function checkFeatureAccess(req, res, featureKey) {
  try {
    // Get user claims
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims) {
      return {
        canAccess: false,
        reason: 'not_authenticated',
        message: 'Authentication required'
      };
    }

    // Get organization
    const organizationId = claims.organizations[0]?.workos_org_id;
    if (!organizationId) {
      return {
        canAccess: false,
        reason: 'no_organization',
        message: 'User not associated with an organization'
      };
    }

    const prisma = (await import('../../../lib/prisma')).default;
    const org = await prisma.organizations.findUnique({
      where: { workos_org_id: organizationId },
      select: { id: true }
    });

    if (!org) {
      return {
        canAccess: false,
        reason: 'organization_not_found',
        message: 'Organization not found'
      };
    }

    // Get subscription
    const subscription = await getOrgSubscription(org.id);

    if (!subscription) {
      return {
        canAccess: false,
        reason: 'no_subscription',
        message: 'No active subscription found'
      };
    }

    // Check access
    return canAccessFeature({
      subscription,
      userClaims: claims,
      featureKey,
      organizationId: org.id
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      canAccess: false,
      reason: 'error',
      message: 'Failed to check feature access'
    };
  }
}

/**
 * Middleware to check resource capacity before creation
 * Use this before creating new resources
 *
 * @param {string} resource - Resource type (from RESOURCES)
 * @param {number} amount - Amount to create (default: 1)
 * @returns {Function} Middleware wrapper
 *
 * @example
 * export default requireResourceCapacity(RESOURCES.PROJECTS, 1)(async (req, res) => {
 *   // Guaranteed to have capacity
 *   // Create project...
 * });
 */
export function requireResourceCapacity(resource, amount = 1) {
  return function (handler) {
    return async function (req, res) {
      try {
        // Get user claims
        const claims = await getClaimsFromRequest(req, workos);

        if (!claims) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        // Get organization
        const organizationId = claims.organizations[0]?.workos_org_id;
        if (!organizationId) {
          return res.status(403).json({
            error: 'No organization',
            message: 'User not associated with an organization'
          });
        }

        const prisma = (await import('../../../lib/prisma')).default;
        const org = await prisma.organizations.findUnique({
          where: { workos_org_id: organizationId },
          select: { id: true }
        });

        if (!org) {
          return res.status(404).json({
            error: 'Organization not found'
          });
        }

        // Get subscription
        const subscription = await getOrgSubscription(org.id);

        if (!subscription) {
          return res.status(403).json({
            error: 'No subscription',
            message: 'No active subscription found'
          });
        }

        // Get current usage
        const { getResourceUsage } = await import('./subscriptionService');
        const usage = await getResourceUsage(org.id);
        const currentUsage = usage[resource] || 0;

        // Check capacity
        const capacityCheck = hasResourceCapacity({
          subscription,
          resource,
          currentUsage,
          requestedAmount: amount
        });

        if (!capacityCheck.hasCapacity) {
          return res.status(403).json({
            error: 'Resource limit exceeded',
            message: `You have reached your ${resource} limit`,
            current: capacityCheck.current,
            limit: capacityCheck.limit,
            available: capacityCheck.available,
            upgradeUrl: '/upgrade'
          });
        }

        // Attach to request
        req.subscription = subscription;
        req.userClaims = claims;
        req.organizationId = org.id;
        req.resourceUsage = usage;

        // Call handler
        return await handler(req, res);
      } catch (error) {
        console.error('Error in requireResourceCapacity middleware:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to check resource capacity'
        });
      }
    };
  };
}

/**
 * Check resource capacity in a handler (non-blocking)
 *
 * @param {Object} req - Request object
 * @param {string} resource - Resource type
 * @param {number} amount - Amount requested
 * @returns {Promise<Object>} Capacity check result
 *
 * @example
 * const capacity = await checkResourceCapacity(req, RESOURCES.PROJECTS, 1);
 * if (!capacity.hasCapacity) {
 *   return res.status(403).json({
 *     error: 'Project limit reached',
 *     limit: capacity.limit
 *   });
 * }
 */
export async function checkResourceCapacity(req, resource, amount = 1) {
  try {
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims) {
      return {
        hasCapacity: false,
        reason: 'not_authenticated'
      };
    }

    const organizationId = claims.organizations[0]?.workos_org_id;
    const prisma = (await import('../../../lib/prisma')).default;
    const org = await prisma.organizations.findUnique({
      where: { workos_org_id: organizationId },
      select: { id: true }
    });

    if (!org) {
      return {
        hasCapacity: false,
        reason: 'organization_not_found'
      };
    }

    const subscription = await getOrgSubscription(org.id);
    const { getResourceUsage } = await import('./subscriptionService');
    const usage = await getResourceUsage(org.id);
    const currentUsage = usage[resource] || 0;

    return hasResourceCapacity({
      subscription,
      resource,
      currentUsage,
      requestedAmount: amount
    });
  } catch (error) {
    console.error('Error checking resource capacity:', error);
    return {
      hasCapacity: false,
      reason: 'error'
    };
  }
}

/**
 * Get subscription for current request
 * Helper to get subscription in handlers
 *
 * @param {Object} req - Request object
 * @returns {Promise<Object|null>} Subscription object
 */
export async function getRequestSubscription(req) {
  try {
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims) {
      return null;
    }

    const organizationId = claims.organizations[0]?.workos_org_id;
    const prisma = (await import('../../../lib/prisma')).default;
    const org = await prisma.organizations.findUnique({
      where: { workos_org_id: organizationId },
      select: { id: true }
    });

    if (!org) {
      return null;
    }

    return await getOrgSubscription(org.id);
  } catch (error) {
    console.error('Error getting request subscription:', error);
    return null;
  }
}

/**
 * Combined middleware for auth + feature + resource check
 * Most comprehensive protection
 *
 * @param {string} featureKey - Required feature
 * @param {string} resource - Resource to check (optional)
 * @param {number} amount - Amount to create (default: 1)
 * @returns {Function} Middleware wrapper
 *
 * @example
 * export default requireFeatureAndResource('bulk_participant_import', RESOURCES.PARTICIPANTS, 10)(
 *   async (req, res) => {
 *     // Feature available AND has capacity for 10 participants
 *   }
 * );
 */
export function requireFeatureAndResource(featureKey, resource = null, amount = 1) {
  return function (handler) {
    return async function (req, res) {
      // First check feature access
      const featureMiddleware = requireFeature(featureKey);
      const featureHandler = featureMiddleware(async (req, res) => {
        // Then check resource capacity if specified
        if (resource) {
          const resourceMiddleware = requireResourceCapacity(resource, amount);
          const resourceHandler = resourceMiddleware(handler);
          return await resourceHandler(req, res);
        } else {
          // No resource check needed
          return await handler(req, res);
        }
      });

      return await featureHandler(req, res);
    };
  };
}

export default {
  requireFeature,
  checkFeatureAccess,
  requireResourceCapacity,
  checkResourceCapacity,
  getRequestSubscription,
  requireFeatureAndResource
};
