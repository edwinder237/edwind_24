import PropTypes from 'prop-types';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import MuiChip from '@mui/material/Chip';

// project import
import getColors from 'utils/getColors';

// ==============================|| FEATURE BADGE - TIER CONFIG ||============================== //

const TIER_CONFIG = {
  pro: { label: 'Pro', color: 'warning' },
  enterprise: { label: 'Enterprise', color: 'info' }
};

// ==============================|| FEATURE BADGE - COLOR STYLE ||============================== //

function getTierStyle({ theme, tier, variant }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.pro;
  const colors = getColors(theme, config.color);
  const { main, contrastText, lighter } = colors;

  switch (variant) {
    case 'outlined':
      return {
        color: main,
        backgroundColor: 'transparent',
        border: `1px solid ${main}`
      };
    case 'filled':
    default:
      return {
        color: contrastText,
        backgroundColor: main
      };
  }
}

// ==============================|| FEATURE BADGE - SIZE STYLE ||============================== //

function getSizeStyle(size) {
  switch (size) {
    case 'medium':
      return {
        height: 24,
        fontSize: '0.75rem',
        fontWeight: 700
      };
    case 'small':
    default:
      return {
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 700
      };
  }
}

// ==============================|| STYLED - FEATURE BADGE ||============================== //

const BadgeStyle = styled(MuiChip, {
  shouldForwardProp: (prop) => prop !== 'tier' && prop !== 'variant'
})(({ theme, tier, size, variant }) => ({
  ...getSizeStyle(size),
  ...getTierStyle({ theme, tier, variant }),
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

// ==============================|| EXTENDED - FEATURE BADGE ||============================== //

export default function FeatureBadge({ tier = 'pro', size = 'small', variant = 'filled', ...others }) {
  const theme = useTheme();
  const config = TIER_CONFIG[tier] || TIER_CONFIG.pro;

  return (
    <BadgeStyle
      theme={theme}
      tier={tier}
      size={size}
      variant={variant}
      label={config.label}
      {...others}
    />
  );
}

FeatureBadge.propTypes = {
  tier: PropTypes.oneOf(['pro', 'enterprise']),
  size: PropTypes.oneOf(['small', 'medium']),
  variant: PropTypes.oneOf(['filled', 'outlined'])
};
