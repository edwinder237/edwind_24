/**
 * ============================================
 * BILLING PORTAL BUTTON COMPONENT
 * ============================================
 *
 * Button that opens Stripe Customer Portal for billing management.
 */

import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { CreditCardOutlined, Settings } from '@mui/icons-material';

/**
 * BillingPortalButton - Opens Stripe Customer Portal
 *
 * @param {Object} props
 * @param {string} props.variant - MUI Button variant
 * @param {string} props.color - MUI Button color
 * @param {string} props.size - MUI Button size
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onError - Callback on error
 * @param {boolean} props.disabled - Disable the button
 * @param {Object} props.sx - Additional styles
 */
export default function BillingPortalButton({
  variant = 'outlined',
  color = 'primary',
  size = 'medium',
  children,
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
      const response = await fetch('/api/subscriptions/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
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
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Settings />}
      sx={sx}
      {...rest}
    >
      {loading ? 'Opening...' : children || 'Manage Billing'}
    </Button>
  );
}
