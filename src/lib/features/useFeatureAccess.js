/**
 * ============================================
 * REACT HOOKS FOR FEATURE ACCESS
 * ============================================
 *
 * Client-side hooks for checking feature access in React components.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

/**
 * Hook to check if a feature is available
 *
 * @param {string} featureKey - Feature key to check
 * @returns {Object} { canAccess, loading, error, reason, requiredPlan, upgradeUrl }
 *
 * @example
 * function BulkImportButton() {
 *   const { canAccess, loading, requiredPlan } = useFeatureAccess('bulk_participant_import');
 *
 *   if (loading) return <Skeleton />;
 *   if (!canAccess) return <UpgradePrompt plan={requiredPlan} />;
 *
 *   return <Button onClick={handleBulkImport}>Import CSV</Button>;
 * }
 */
export function useFeatureAccess(featureKey) {
  const [state, setState] = useState({
    canAccess: false,
    loading: true,
    error: null,
    reason: null,
    requiredPlan: null,
    upgradeUrl: '/upgrade'
  });

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const response = await axios.post('/api/features/check-access', {
          featureKey
        });

        if (mounted) {
          setState({
            canAccess: response.data.canAccess,
            loading: false,
            error: null,
            reason: response.data.reason,
            requiredPlan: response.data.requiredPlan,
            upgradeUrl: response.data.upgradeUrl || '/upgrade'
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            canAccess: false,
            loading: false,
            error: error.response?.data?.message || 'Failed to check feature access',
            reason: 'error',
            requiredPlan: null,
            upgradeUrl: '/upgrade'
          });
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [featureKey]);

  return state;
}

/**
 * Hook to check resource limits
 *
 * @param {string} resource - Resource type (projects, participants, etc.)
 * @returns {Object} { current, limit, available, percentUsed, canCreate, loading }
 *
 * @example
 * function CreateProjectButton() {
 *   const { canCreate, current, limit, loading } = useResourceLimit('projects');
 *
 *   if (loading) return <Skeleton />;
 *
 *   return (
 *     <Box>
 *       <Button disabled={!canCreate}>Create Project</Button>
 *       <Typography variant="caption">{current} / {limit} projects used</Typography>
 *     </Box>
 *   );
 * }
 */
export function useResourceLimit(resource) {
  const [state, setState] = useState({
    current: 0,
    limit: 0,
    available: 0,
    percentUsed: 0,
    canCreate: false,
    isUnlimited: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    async function checkLimit() {
      try {
        const response = await axios.get('/api/features/resource-usage');

        if (mounted && response.data.resources[resource]) {
          const resourceData = response.data.resources[resource];

          setState({
            current: resourceData.current,
            limit: resourceData.limit,
            available: resourceData.available,
            percentUsed: resourceData.percentUsed,
            canCreate: resourceData.available > 0 || resourceData.limit === -1,
            isUnlimited: resourceData.limit === -1,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            ...state,
            loading: false,
            error: error.response?.data?.message || 'Failed to check resource limit'
          });
        }
      }
    }

    checkLimit();

    return () => {
      mounted = false;
    };
  }, [resource]);

  return state;
}

/**
 * Hook to get all available features for current user
 *
 * @returns {Object} { features, loading, error }
 *
 * @example
 * function FeatureList() {
 *   const { features, loading } = useAvailableFeatures();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return features.map(feature => (
 *     <FeatureBadge key={feature.key} feature={feature} />
 *   ));
 * }
 */
export function useAvailableFeatures() {
  const [state, setState] = useState({
    features: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    async function loadFeatures() {
      try {
        const response = await axios.get('/api/features/available');

        if (mounted) {
          setState({
            features: response.data.features,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            features: [],
            loading: false,
            error: error.response?.data?.message || 'Failed to load features'
          });
        }
      }
    }

    loadFeatures();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Hook to get current subscription info
 *
 * @returns {Object} { subscription, loading, error }
 *
 * @example
 * function SubscriptionBadge() {
 *   const { subscription, loading } = useSubscription();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return (
 *     <Chip
 *       label={subscription.plan.name}
 *       color={subscription.status === 'active' ? 'success' : 'default'}
 *     />
 *   );
 * }
 */
export function useSubscription() {
  const [state, setState] = useState({
    subscription: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      try {
        const response = await axios.get('/api/subscriptions');

        if (mounted) {
          setState({
            subscription: response.data.subscription,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            subscription: null,
            loading: false,
            error: error.response?.data?.message || 'Failed to load subscription'
          });
        }
      }
    }

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Hook to get resource usage summary
 *
 * @returns {Object} { resources, loading, error }
 *
 * @example
 * function UsageDashboard() {
 *   const { resources, loading } = useResourceUsage();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return Object.entries(resources).map(([resource, data]) => (
 *     <UsageMeter
 *       key={resource}
 *       resource={resource}
 *       current={data.current}
 *       limit={data.limit}
 *       percentUsed={data.percentUsed}
 *     />
 *   ));
 * }
 */
export function useResourceUsage() {
  const [state, setState] = useState({
    resources: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    async function loadUsage() {
      try {
        const response = await axios.get('/api/features/resource-usage');

        if (mounted) {
          setState({
            resources: response.data.resources,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            resources: {},
            loading: false,
            error: error.response?.data?.message || 'Failed to load resource usage'
          });
        }
      }
    }

    loadUsage();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Higher-order component to wrap components with feature gates
 *
 * @param {string} featureKey - Required feature
 * @param {React.Component} FallbackComponent - Component to show if no access
 * @returns {Function} HOC wrapper
 *
 * @example
 * const BulkImportPage = withFeatureAccess('bulk_participant_import', UpgradePrompt)(
 *   function BulkImport() {
 *     return <div>Bulk import functionality...</div>;
 *   }
 * );
 */
export function withFeatureAccess(featureKey, FallbackComponent = null) {
  return function (Component) {
    return function FeatureGatedComponent(props) {
      const { canAccess, loading, requiredPlan } = useFeatureAccess(featureKey);

      if (loading) {
        return <div>Loading...</div>;
      }

      if (!canAccess) {
        if (FallbackComponent) {
          return <FallbackComponent requiredPlan={requiredPlan} featureKey={featureKey} />;
        }
        return (
          <div>
            <h3>Feature Not Available</h3>
            <p>This feature requires {requiredPlan} plan.</p>
            <a href="/upgrade">Upgrade Now</a>
          </div>
        );
      }

      return <Component {...props} />;
    };
  };
}

/**
 * Hook for feature-based conditional rendering
 *
 * @param {string} featureKey - Feature to check
 * @returns {Object} { show: boolean, loading: boolean }
 *
 * @example
 * function NavMenu() {
 *   const bulkImport = useFeatureFlag('bulk_participant_import');
 *   const analytics = useFeatureFlag('advanced_analytics');
 *
 *   return (
 *     <Menu>
 *       <MenuItem>Dashboard</MenuItem>
 *       {bulkImport.show && <MenuItem>Bulk Import</MenuItem>}
 *       {analytics.show && <MenuItem>Analytics</MenuItem>}
 *     </Menu>
 *   );
 * }
 */
export function useFeatureFlag(featureKey) {
  const { canAccess, loading } = useFeatureAccess(featureKey);

  return useMemo(
    () => ({
      show: canAccess && !loading,
      loading
    }),
    [canAccess, loading]
  );
}

/**
 * Hook to check multiple features at once
 *
 * @param {Array<string>} featureKeys - Array of feature keys
 * @returns {Object} { [featureKey]: { canAccess, loading }, allLoaded }
 *
 * @example
 * function AdminPanel() {
 *   const features = useFeatureFlags(['api_access', 'audit_logs', 'custom_workflows']);
 *
 *   if (!features.allLoaded) return <Skeleton />;
 *
 *   return (
 *     <Box>
 *       {features.api_access.canAccess && <APISettings />}
 *       {features.audit_logs.canAccess && <AuditLogs />}
 *       {features.custom_workflows.canAccess && <WorkflowBuilder />}
 *     </Box>
 *   );
 * }
 */
export function useFeatureFlags(featureKeys) {
  const [results, setResults] = useState({});
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkFeatures() {
      const checks = await Promise.all(
        featureKeys.map(async (key) => {
          try {
            const response = await axios.post('/api/features/check-access', {
              featureKey: key
            });
            return {
              key,
              canAccess: response.data.canAccess,
              loading: false
            };
          } catch (error) {
            return {
              key,
              canAccess: false,
              loading: false
            };
          }
        })
      );

      if (mounted) {
        const resultsMap = {};
        checks.forEach(check => {
          resultsMap[check.key] = {
            canAccess: check.canAccess,
            loading: check.loading
          };
        });
        setResults(resultsMap);
        setAllLoaded(true);
      }
    }

    checkFeatures();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(featureKeys)]);

  return {
    ...results,
    allLoaded
  };
}

export default {
  useFeatureAccess,
  useResourceLimit,
  useAvailableFeatures,
  useSubscription,
  useResourceUsage,
  withFeatureAccess,
  useFeatureFlag,
  useFeatureFlags
};
