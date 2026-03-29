import { Box, Typography, Button, CircularProgress, Chip } from '@mui/material';
import { LockOutlined } from '@ant-design/icons';
import { ArrowUpward } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import Page from 'components/Page';
import useFeatureAccess from 'hooks/useFeatureAccess';
import { isAdmin } from 'lib/auth/roleNormalization';
import useUser from 'hooks/useUser';

/**
 * FeatureGate - Declarative guard component for plan-gated features.
 *
 * Usage:
 *   <FeatureGate featureKey="timeline" pageTitle="Projects Timeline">
 *     <YourPageContent />
 *   </FeatureGate>
 *
 * @param {string} featureKey - Feature key from FEATURES catalog
 * @param {string} pageTitle - Page title for fallback screens
 * @param {React.ReactNode} children - Content to render when access is granted
 * @param {React.ReactNode} fallback - Optional custom fallback (overrides default UI)
 */
export default function FeatureGate({ featureKey, pageTitle = 'Upgrade Required', children, fallback }) {
  const { canAccess, requiredPlanName, currentPlan, isLoading, reason } = useFeatureAccess(featureKey);
  const { user } = useUser();

  if (isLoading) {
    return (
      <Page title={pageTitle}>
        <MainCard>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </MainCard>
      </Page>
    );
  }

  if (canAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  const canUpgrade = isAdmin(user?.role);

  if (reason === 'plan_upgrade_required') {
    return (
      <Page title="Upgrade Required">
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LockOutlined style={{ fontSize: '4rem', color: '#faad14', marginBottom: 16 }} />
            <Typography variant="h4" gutterBottom>
              {requiredPlanName || 'Professional'} Plan Required
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 1 }}>
              This feature is available on the {requiredPlanName || 'Professional'} plan and above.
            </Typography>
            {currentPlan && (
              <Chip
                label={`Current plan: ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            )}
            <Box sx={{ mt: 2 }}>
              {canUpgrade ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowUpward />}
                  onClick={() => { window.location.href = '/organization-settings?tab=billing'; }}
                >
                  Upgrade Plan
                </Button>
              ) : (
                <Typography color="textSecondary">
                  Contact your administrator to upgrade your organization&apos;s subscription.
                </Typography>
              )}
            </Box>
          </Box>
        </MainCard>
      </Page>
    );
  }

  // Permission denied
  return (
    <Page title="Access Denied">
      <MainCard>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LockOutlined style={{ fontSize: '4rem', color: '#8c8c8c', marginBottom: 16 }} />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography color="textSecondary">
            You don&apos;t have permission to access this feature.
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Please contact your administrator if you believe this is an error.
          </Typography>
        </Box>
      </MainCard>
    </Page>
  );
}
