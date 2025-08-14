import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button
} from '@mui/material';

export const LoadingSpinner = React.memo(() => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 400 
    }}
  >
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>
      Loading project settings...
    </Typography>
  </Box>
));

LoadingSpinner.displayName = 'LoadingSpinner';

export const ErrorAlert = React.memo(({ error, onRetry }) => (
  <Alert severity="error" sx={{ mb: 3 }}>
    {error}
    <Button 
      size="small" 
      onClick={onRetry}
      sx={{ ml: 2 }}
    >
      Retry
    </Button>
  </Alert>
));

ErrorAlert.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired
};

ErrorAlert.displayName = 'ErrorAlert';