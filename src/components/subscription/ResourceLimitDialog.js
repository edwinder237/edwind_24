/**
 * ============================================
 * RESOURCE LIMIT DIALOG
 * ============================================
 *
 * Reusable dialog shown when a 403 "Resource limit exceeded" error
 * is returned from an API route. Displays current usage, the limit,
 * and provides role-appropriate actions:
 *   - Level 0-1 (Admin/Owner): "Upgrade Now" button
 *   - Level 2+  (other roles): "Contact Administrator" message
 *
 * Usage:
 *   const [limitError, setLimitError] = useState(null);
 *
 *   // In your fetch error handler:
 *   if (response.status === 403) {
 *     const data = await response.json();
 *     if (data.error === 'Resource limit exceeded') {
 *       setLimitError(data);
 *       return;
 *     }
 *   }
 *
 *   <ResourceLimitDialog
 *     open={!!limitError}
 *     onClose={() => setLimitError(null)}
 *     limitError={limitError}
 *   />
 */

import { useRouter } from 'next/router';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Stack
} from '@mui/material';
import { WarningAmberRounded, ArrowUpward } from '@mui/icons-material';
import useUser from 'hooks/useUser';
import { isAdmin } from 'lib/auth/roleNormalization';

export default function ResourceLimitDialog({ open, onClose, limitError }) {
  const router = useRouter();
  const { user } = useUser();

  if (!limitError) return null;

  const { message, current, limit, available } = limitError;
  const usagePercent = limit > 0 ? Math.min((current / limit) * 100, 100) : 100;
  const canUpgrade = isAdmin(user?.role);

  const handleUpgrade = () => {
    onClose();
    router.push('/internal/subscriptions');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderTop: '4px solid', borderColor: 'warning.main' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <WarningAmberRounded color="warning" />
        <Typography variant="h5" component="span">
          Limit Reached
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
          {message || 'You have reached your plan limit for this resource.'}
        </Typography>

        {typeof current === 'number' && typeof limit === 'number' && (
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

        <Typography variant="body2" color="text.secondary">
          {canUpgrade
            ? 'Upgrade your subscription plan to increase your limits and unlock more capacity.'
            : 'Please contact your organization administrator to upgrade the subscription plan.'}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
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
            Upgrade Now
          </Button>
        )}
      </DialogActions>
    </Dialog>
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
     data.error === 'Feature not available')
  ) {
    return data;
  }
  return null;
}
