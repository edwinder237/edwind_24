import { useMemo } from 'react';
import useUser from 'hooks/useUser';
import { FEATURES, PLAN_DEFINITIONS, TOGGLEABLE_FEATURE_KEYS, FEATURE_CONFIG_MARKER } from 'lib/features/featureAccess';

const TIER_ORDER = { essential: 0, professional: 1, enterprise: 2 };

/**
 * Client-side feature access hook.
 * Uses the FEATURES catalog (single source of truth) and user subscription data.
 *
 * Plan-level gating is enforced for ALL roles. Only L0 (owner) bypasses plan checks.
 *
 * @param {string} featureKey - Feature key from FEATURES catalog
 * @returns {{ canAccess: boolean, requiredPlan: string|null, requiredPlanName: string|null, currentPlan: string|null, isLoading: boolean, reason: string }}
 */
export default function useFeatureAccess(featureKey) {
  const { user, isLoading } = useUser();

  return useMemo(() => {
    if (isLoading || !user) {
      return { canAccess: false, requiredPlan: null, requiredPlanName: null, currentPlan: null, isLoading: true, reason: 'loading' };
    }

    const feature = FEATURES[featureKey];
    if (!feature) {
      return { canAccess: false, requiredPlan: null, requiredPlanName: null, currentPlan: null, isLoading: false, reason: 'feature_not_found' };
    }

    const currentPlan = user.subscription?.planId || 'essential';
    const userRole = (user.role || '').toLowerCase().trim();

    // Only L0 (owner) bypasses plan-level feature checks
    if (userRole === 'owner') {
      return { canAccess: true, requiredPlan: null, requiredPlanName: null, currentPlan, isLoading: false, reason: 'owner_bypass' };
    }

    // Plan check — DB plan features (admin-managed) take priority over code catalog
    const requiredPlan = feature.plans
      .filter(p => TIER_ORDER[p] !== undefined)
      .sort((a, b) => TIER_ORDER[a] - TIER_ORDER[b])[0];

    // DB plan features are authoritative when the config marker is present (admin saved).
    // Otherwise fall back to code catalog for toggleable features (handles stale DB seed data).
    const dbPlanFeatures = user.subscription?.planFeatures;
    let hasPlanAccess;
    if (Array.isArray(dbPlanFeatures) && dbPlanFeatures.length > 0) {
      const featuresConfigured = dbPlanFeatures.includes(FEATURE_CONFIG_MARKER);
      if (featuresConfigured || !TOGGLEABLE_FEATURE_KEYS.includes(featureKey)) {
        hasPlanAccess = dbPlanFeatures.includes(featureKey);
      } else {
        hasPlanAccess = feature.plans.includes(currentPlan);
      }
    } else {
      hasPlanAccess = feature.plans.includes(currentPlan);
    }

    if (!hasPlanAccess) {
      return {
        canAccess: false,
        requiredPlan,
        requiredPlanName: PLAN_DEFINITIONS[requiredPlan]?.name || requiredPlan,
        currentPlan,
        isLoading: false,
        reason: 'plan_upgrade_required'
      };
    }

    // Permission check
    if (feature.permissions && feature.permissions.length > 0) {
      const userPermissions = user.permissions || [];
      const hasPermission = feature.permissions.some(perm => {
        const [resource] = perm.split(':');
        return userPermissions.some(up => {
          if (up === perm) return true;
          if (up === '*:*') return true;
          const [uResource, uAction] = up.split(':');
          if (uResource === resource && uAction === '*') return true;
          return false;
        });
      });

      if (!hasPermission) {
        return { canAccess: false, requiredPlan: null, requiredPlanName: null, currentPlan, isLoading: false, reason: 'insufficient_permissions' };
      }
    }

    return { canAccess: true, requiredPlan: null, requiredPlanName: null, currentPlan, isLoading: false, reason: 'authorized' };
  }, [user, isLoading, featureKey]);
}
