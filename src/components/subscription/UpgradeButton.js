/**
 * ============================================
 * UPGRADE BUTTON COMPONENT
 * ============================================
 *
 * Button that initiates Stripe Checkout for subscription upgrade.
 */

import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { CreditCardOutlined, ArrowUpward } from '@mui/icons-material';

/**
 * UpgradeButton - Initiates Stripe Checkout session
 *
 * @param {Object} props
 * @param {string} props.planId - Target plan ID (essential, professional, enterprise)
 * @param {string} props.interval - Billing interval (monthly, annual)
 * @param {string} props.variant - MUI Button variant (contained, outlined, text)
 * @param {string} props.color - MUI Button color
 * @param {string} props.size - MUI Button size
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onSuccess - Callback on success
 * @param {Function} props.onError - Callback on error
 * @param {boolean} props.disabled - Disable the button
 * @param {Object} props.sx - Additional styles
 */
export default function UpgradeButton({
  planId,
  interval = 'monthly',
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  children,
  onSuccess,
  onError,
  disabled = false,
  sx = {},
  ...rest
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          interval
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.action === 'use_billing_portal') {
          // Redirect to billing portal instead
          const portalResponse = await fetch('/api/subscriptions/billing-portal', {
            method: 'POST'
          });
          const portalData = await portalResponse.json();

          if (portalData.url) {
            window.location.href = portalData.url;
            return;
          }
        }

        throw new Error(data.message || data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        onSuccess?.();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={handleClick}
      disabled={loading || disabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowUpward />}
      sx={sx}
      {...rest}
    >
      {loading ? 'Processing...' : children || 'Upgrade'}
    </Button>
  );
}

/**
 * Compact upgrade button for use in headers/navbars
 */
export function UpgradeButtonCompact({ planId, interval, ...props }) {
  return (
    <UpgradeButton
      planId={planId}
      interval={interval}
      variant="outlined"
      size="small"
      {...props}
    >
      Upgrade
    </UpgradeButton>
  );
}
