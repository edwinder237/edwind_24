import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Alert,
  Button,
  List,
  ListItem,
  Divider
} from '@mui/material';

// Skeleton that mirrors the SettingsSidebar layout
const SidebarSkeleton = () => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
    {/* Header */}
    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="text" width="70%" height={24} />
      <Skeleton variant="text" width="90%" height={16} sx={{ mt: 0.5 }} />
    </Box>
    {/* Category list items */}
    <List sx={{ p: 1 }}>
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <ListItem sx={{ py: 1.2, px: 1.5, gap: 1.5 }}>
            <Skeleton variant="rounded" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={18} />
              <Skeleton variant="text" width="80%" height={14} />
            </Box>
          </ListItem>
          {i < 3 && <Divider sx={{ mx: 1.5 }} />}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

// Skeleton that mirrors the SettingsContent layout
const ContentSkeleton = () => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
    {/* Header */}
    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="text" width="40%" height={26} />
      <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.5 }} />
    </Box>
    {/* Content - form fields */}
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Title field */}
        <Box>
          <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5 }} />
          <Skeleton variant="rounded" width="100%" height={40} />
        </Box>
        {/* Description field */}
        <Box>
          <Skeleton variant="text" width={100} height={16} sx={{ mb: 0.5 }} />
          <Skeleton variant="rounded" width="100%" height={80} />
        </Box>
        {/* Two-column row */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Skeleton variant="text" width={70} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="text" width={90} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
        </Grid>
        {/* Another field */}
        <Box>
          <Skeleton variant="text" width={120} height={16} sx={{ mb: 0.5 }} />
          <Skeleton variant="rounded" width="100%" height={40} />
        </Box>
        {/* Chip-like row */}
        <Box>
          <Skeleton variant="text" width={60} height={16} sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" width={70} height={32} sx={{ borderRadius: 4 }} />
          </Stack>
        </Box>
      </Stack>
    </Box>
  </Paper>
);

export const LoadingSpinner = React.memo(() => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ flex: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <SidebarSkeleton />
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <ContentSkeleton />
        </Grid>
      </Grid>
    </Box>
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
