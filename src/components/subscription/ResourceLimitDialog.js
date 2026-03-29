/**
 * ============================================
 * RESOURCE LIMIT DIALOG
 * ============================================
 *
 * Polished modal using MainCard (matches app styling) shown when a
 * 403 "Resource limit exceeded" or "Feature not available" error
 * is returned from an API route.
 *
 * Displays:
 *   - Human-readable resource name in the title
 *   - Current usage with visual progress bar
 *   - Role-appropriate CTA (admin → "Upgrade Plan", others → "Contact Admin")
 *
 * Typically used via the global <ResourceLimitProvider> which renders
 * this dialog automatically for all limit errors intercepted by axios.
 *
 * Can also be used directly:
 *   <ResourceLimitDialog open={!!error} onClose={...} limitError={error} />
 */

import {
  Modal,
  Button,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { WarningAmberRounded, ArrowUpward } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { isAdmin } from 'lib/auth/roleNormalization';
import { getResourceLabel, getResourceNoun } from 'lib/features/resourceDisplayNames';

export default function ResourceLimitDialog({ open, onClose, limitError }) {
  const { user } = useUser();

  if (!limitError) return null;

  const { current, limit, available, requiredPlan, currentPlan } = limitError;
  const isFeatureError = limitError.error === 'Feature not available';
  const resourceLabel = getResourceLabel(limitError);
  const resourceNoun = getResourceNoun(limitError);
  const usagePercent = limit > 0 ? Math.min((current / limit) * 100, 100) : 100;
  const canUpgrade = isAdmin(user?.role);

  // Build the dialog title
  const title = isFeatureError
    ? 'Feature Not Available'
    : resourceLabel
      ? `${resourceLabel} Limit Reached`
      : 'Plan Limit Reached';

  // Build the description message
  let description;
  if (isFeatureError) {
    const planName = requiredPlan
      ? requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)
      : 'a higher';
    description = `This feature requires the ${planName} plan or above.`;
  } else if (typeof current === 'number' && typeof limit === 'number') {
    description = `You've used all ${current} of your ${limit} available ${resourceNoun}.`;
  } else {
    description = `You've reached your plan limit for ${resourceNoun}.`;
  }

  const handleUpgrade = () => {
    onClose();
    // Full page navigation to destroy any open dialogs/modals underneath
    window.location.href = '/organization-settings?tab=billing';
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="resource-limit-title">
      <MainCard
        modal
        sx={{
          width: { xs: 'calc(100% - 50px)', sm: 400 }
        }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningAmberRounded color="warning" />
            <Typography id="resource-limit-title" variant="h5">
              {title}
            </Typography>
          </Stack>
        }
      >
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
          {description}
        </Typography>

        {/* Usage bar - only for resource limit errors with numeric data */}
        {!isFeatureError && typeof current === 'number' && typeof limit === 'number' && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Current usage
              </Typography>
              <Typography variant="subtitle2">
                {current} / {limit === -1 ? 'Unlimited' : limit}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={usagePercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: usagePercent >= 100 ? 'error.main' : 'warning.main'
                }
              }}
            />
            {typeof available === 'number' && available === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                No capacity remaining
              </Typography>
            )}
          </Box>
        )}

        {/* Plan info chip for feature errors */}
        {isFeatureError && currentPlan && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Current plan: ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`}
              size="small"
              variant="outlined"
              color="default"
            />
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          {canUpgrade
            ? 'Upgrade your plan to increase your limits and unlock more capacity.'
            : 'Please contact your organization administrator to upgrade the plan.'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose} color="inherit" size="small">
            Close
          </Button>
          {canUpgrade && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowUpward />}
              onClick={handleUpgrade}
            >
              Upgrade Plan
            </Button>
          )}
        </Stack>
      </MainCard>
    </Modal>
  );
}

/**
 * Helper: check if an API response is a resource limit error.
 * Returns the parsed error data if yes, null otherwise.
 *
 * Usage:
 *   const response = await fetch('/api/...');
 *   if (!response.ok) {
 *     const data = await response.json();
 *     const limitErr = isResourceLimitError(response.status, data);
 *     if (limitErr) { setLimitError(limitErr); return; }
 *     // handle other errors...
 *   }
 */
export function isResourceLimitError(status, data) {
  if (
    status === 403 &&
    data &&
    (data.error === 'Resource limit exceeded' ||
     data.error === 'Feature not available' ||
     data.reason === 'plan_upgrade_required')
  ) {
    return data;
  }
  return null;
}
