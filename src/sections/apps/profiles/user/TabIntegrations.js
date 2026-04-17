import { useRef, useState } from 'react';

// material-ui
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

// icons
import {
  GoogleOutlined,
  WindowsOutlined,
  SyncOutlined,
  LinkOutlined,
  DisconnectOutlined,
  CalendarOutlined,
  DownOutlined,
} from '@ant-design/icons';

// project import
import useCalendarIntegrations from 'hooks/useCalendarIntegrations';

const PROVIDERS = [
  {
    key: 'google',
    name: 'Google Calendar',
    icon: GoogleOutlined,
    color: '#4285F4',
    description: 'Sync your EDBAHN training events to Google Calendar',
  },
  {
    key: 'microsoft',
    name: 'Microsoft Outlook',
    icon: WindowsOutlined,
    color: '#0078D4',
    description: 'Sync your EDBAHN training events to Microsoft Outlook Calendar',
  },
];

// ==============================|| USER PROFILE - INTEGRATIONS TAB ||============================== //

const ProviderContent = ({ provider, integration, syncing, syncMenuRef, syncMenuOpen, setSyncMenuOpen, handleSyncNow, connect, setDisconnectDialog }) => {
  const isConnected = !!integration;
  const Icon = provider.icon;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          {/* Left: Icon + Info */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${provider.color}15`,
                flexShrink: 0,
              }}
            >
              <Icon style={{ fontSize: 24, color: provider.color }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {provider.name}
                </Typography>
                <Chip
                  label={isConnected ? 'Connected' : 'Not Connected'}
                  size="small"
                  color={isConnected ? 'success' : 'default'}
                  variant={isConnected ? 'filled' : 'outlined'}
                  sx={{ height: 22 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>
                {isConnected
                  ? integration.providerEmail || 'Connected'
                  : provider.description}
              </Typography>
              {isConnected && integration.lastSyncAt && (
                <Typography variant="caption" color="text.secondary">
                  Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Right: Actions */}
          <Stack direction="row" spacing={1} flexShrink={0}>
            {isConnected ? (
              <>
                <ButtonGroup variant="outlined" size="small" ref={syncMenuRef}>
                  <Button
                    startIcon={syncing ? <CircularProgress size={14} /> : <SyncOutlined />}
                    onClick={() => handleSyncNow('future')}
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSyncMenuOpen((prev) => !prev)}
                    disabled={syncing}
                    sx={{ px: 0.5, minWidth: 'auto' }}
                  >
                    <DownOutlined style={{ fontSize: 12 }} />
                  </Button>
                </ButtonGroup>
                <Popper open={syncMenuOpen} anchorEl={syncMenuRef.current} transition disablePortal sx={{ zIndex: 1 }}>
                  {({ TransitionProps, placement }) => (
                    <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
                      <Paper>
                        <ClickAwayListener onClickAway={() => setSyncMenuOpen(false)}>
                          <MenuList dense>
                            <MenuItem onClick={() => handleSyncNow('future')}>
                              Upcoming events only
                            </MenuItem>
                            <MenuItem onClick={() => handleSyncNow('all')}>
                              All events
                            </MenuItem>
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DisconnectOutlined />}
                  onClick={() => setDisconnectDialog(integration)}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<LinkOutlined />}
                onClick={() => connect(provider.key)}
                sx={{
                  bgcolor: provider.color,
                  '&:hover': { bgcolor: provider.color, opacity: 0.9 },
                }}
              >
                Connect
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Error for this integration */}
        {isConnected && integration.lastSyncError && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Last sync error: {integration.lastSyncError}
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const TabIntegrations = () => {
  const { integrations, loading, error, syncing, connect, disconnect, syncNow, getIntegration } =
    useCalendarIntegrations();
  const [disconnectDialog, setDisconnectDialog] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const syncMenuRef = useRef(null);

  const handleDisconnect = async () => {
    if (!disconnectDialog) return;
    const success = await disconnect(disconnectDialog.id);
    if (success) {
      setDisconnectDialog(null);
    }
  };

  const handleSyncNow = async (scope = 'future') => {
    setSyncMenuOpen(false);
    setSyncResult(null);
    const result = await syncNow(undefined, scope);
    if (result) {
      setSyncResult(result);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
    setSyncMenuOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <CalendarOutlined style={{ fontSize: 24 }} />
        <Box>
          <Typography variant="h5">Calendar Integrations</Typography>
          <Typography variant="body2" color="text.secondary">
            Connect your external calendars to automatically sync training events
          </Typography>
        </Box>
      </Stack>

      {/* Error Banner */}
      {error && (
        <Alert severity="error" onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Sync Result Banner */}
      {syncResult && (
        <Alert severity={syncResult.errors > 0 ? 'warning' : 'success'}>
          {syncResult.message}
        </Alert>
      )}

      {/* Vendor Tabs */}
      <Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="calendar provider tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            return (
              <Tab
                key={provider.key}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon style={{ fontSize: 18, color: provider.color }} />
                    <span>{provider.name}</span>
                  </Stack>
                }
              />
            );
          })}
        </Tabs>

        {PROVIDERS.map((provider, index) => (
          tabValue === index && (
            <Box key={provider.key} sx={{ pt: 2 }}>
              <ProviderContent
                provider={provider}
                integration={getIntegration(provider.key)}
                syncing={syncing}
                syncMenuRef={syncMenuRef}
                syncMenuOpen={syncMenuOpen}
                setSyncMenuOpen={setSyncMenuOpen}
                handleSyncNow={handleSyncNow}
                connect={connect}
                setDisconnectDialog={setDisconnectDialog}
              />
            </Box>
          )
        ))}
      </Box>

      {/* Info */}
      <Typography variant="body2" color="text.secondary">
        Events created, updated, or deleted in your EDBAHN projects will automatically sync to your
        connected calendars. This is a one-way sync — changes made directly in Google Calendar or
        Outlook will not sync back to EDBAHN.
      </Typography>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectDialog} onClose={() => setDisconnectDialog(null)}>
        <DialogTitle>Disconnect Calendar?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will stop syncing events to your{' '}
            {disconnectDialog?.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}.
            Events already synced will remain in your external calendar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialog(null)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default TabIntegrations;
