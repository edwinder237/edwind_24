import { useRef, useState, useEffect } from 'react';

// next
import { useRouter } from 'next/router';


// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  ButtonBase,
  capitalize,
  CardContent,
  ClickAwayListener,
  Collapse,
  Grid,
  Paper,
  Popper,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Divider,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// project import
import useUser from 'hooks/useUser';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import useConfig from 'hooks/useConfig';
import { useDispatch } from 'store';
import { refreshUser } from 'store/reducers/user';

// assets
import { LogoutOutlined, UserOutlined, WalletOutlined, QuestionCircleOutlined, CommentOutlined, SettingOutlined, EditOutlined, CheckCircleOutlined, ApartmentOutlined, BugOutlined, GlobalOutlined } from '@ant-design/icons';

// Language options
const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }
];

// Helper function to check if user has admin role
const isAdmin = (role) => {
  if (!role || typeof role !== 'string') return false;
  const normalizedRole = role.toLowerCase().trim();
  const adminRoles = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];
  return adminRoles.includes(normalizedRole);
};

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

const Profile = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useUser();
  const router = useRouter();
  const { mode, onChangeMode, i18n, onChangeLocalization } = useConfig();

  // Check if user has admin role
  const hasAdminAccess = isAdmin(user?.role);

  // Organization selector state
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);

  // Debug dialog state
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [claimsData, setClaimsData] = useState(null);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Feedback dialog state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleLogout = () => {
    // Redirect to logout endpoint
    window.location.href = '/api/auth/logout';
  };

  // Fetch organizations when dialog opens
  useEffect(() => {
    if (orgDialogOpen) {
      fetchOrganizations();
    }
  }, [orgDialogOpen]);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await fetch('/api/organization/list-parent-organizations');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleOpenOrgDialog = (e) => {
    e.stopPropagation();
    setOrgDialogOpen(true);
  };

  const handleCloseOrgDialog = () => {
    setOrgDialogOpen(false);
  };

  // Debug dialog handlers
  const fetchClaimsData = async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch('/api/auth/debug-claims');
      const data = await res.json();
      setClaimsData(data);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleOpenDebugDialog = () => {
    setDebugDialogOpen(true);
    setOpen(false); // Close the profile dropdown
    fetchClaimsData();
  };

  const handleCloseDebugDialog = () => {
    setDebugDialogOpen(false);
  };

  const handleRefreshWorkOS = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await dispatch(refreshUser()).unwrap();
      await fetchClaimsData();
      setSnackbar({
        open: true,
        message: 'Successfully synced with WorkOS',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setSnackbar({
        open: true,
        message: error.error || 'Failed to sync with WorkOS',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Feedback handlers
  const handleOpenFeedback = () => {
    setFeedbackDialogOpen(true);
    setOpen(false); // Close profile dropdown
  };

  const handleCloseFeedback = () => {
    setFeedbackDialogOpen(false);
    setFeedbackType('');
    setFeedbackMessage('');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackType || !feedbackMessage.trim()) {
      setSnackbar({ open: true, message: 'Please select a type and enter a message', severity: 'error' });
      return;
    }

    if (feedbackMessage.trim().length < 10) {
      setSnackbar({ open: true, message: 'Message must be at least 10 characters', severity: 'error' });
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackMessage.trim(),
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'unknown@unknown.com',
          organizationName: user?.organizationName || 'N/A'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
        handleCloseFeedback();
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to submit feedback', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({ open: true, message: 'Failed to submit feedback', severity: 'error' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSwitchOrganization = async (orgId) => {
    const currentOrg = organizations.find(o => o.isCurrent);
    if (orgId === currentOrg?.id || switchingOrg) {
      return;
    }

    setSwitchingOrg(true);
    try {
      const response = await fetch('/api/organization/switch-parent-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId })
      });

      const data = await response.json();

      if (data.success) {
        setOrgDialogOpen(false);
        // Force hard reload to refresh all data
        window.location.href = window.location.href;
      } else {
        console.error('Failed to switch organization:', data.error);
        setSwitchingOrg(false);
      }
    } catch (err) {
      console.error('Error switching organization:', err);
      setSwitchingOrg(false);
    }
  };

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  const handleViewProfile = () => {
    router.push('/apps/profiles/user/personal');
    setOpen(false);
  };

  const handleOrganizationSettings = () => {
    router.push('/organization-settings');
    setOpen(false);
  };

  const handleThemeToggle = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    onChangeMode(newMode);
  };

  const iconBackColorOpen = theme.palette.mode === 'dark' ? 'grey.200' : 'grey.300';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0.25,
          bgcolor: open ? iconBackColorOpen : 'transparent',
          borderRadius: 1,
          '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'secondary.light' : 'secondary.lighter' },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2
          }
        }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        {user && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 0.25, px: 0.75 }}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText
              }}
            >
              {getInitials(user.name)}
            </Avatar>
            <Stack spacing={0}>
              <Typography variant="subtitle1">{capitalize(user.name)}</Typography>
              {user?.subOrganizationName && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                  {user.subOrganizationName}
                </Typography>
              )}
            </Stack>
          </Stack>
        )}
      </ButtonBase>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: 290,
                minWidth: 240,
                maxWidth: 290,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 250
                }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
                    <Stack spacing={0.5}>
                      {user?.organizationName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {user.organizationName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={handleOpenOrgDialog}
                            sx={{
                              p: 0.25,
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            <EditOutlined style={{ fontSize: '0.75rem', color: '#666' }} />
                          </IconButton>
                        </Box>
                      )}
                      {user?.subOrganizationName && (
                        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          {user.subOrganizationName}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                          label={user?.role || 'User'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            bgcolor: 'primary.lighter',
                            color: 'primary.dark'
                          }}
                        />
                        {user?.subscription?.planName && (
                          <Chip
                            label={user.subscription.planName}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.75rem',
                              bgcolor: user.subscription.planId === 'essential' ? '#e0e0e0' : '#e3f2fd',
                              color: user.subscription.planId === 'essential' ? '#666' : '#1565c0'
                            }}
                          />
                        )}
                      </Box>
                      {user?.email && (
                        <Typography variant="caption" color="textSecondary">
                          {user.email}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>

                  <Divider />

                  {/* Dark Mode Toggle */}
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        Dark Mode
                      </Typography>
                      <Switch
                        checked={mode === 'dark'}
                        onChange={handleThemeToggle}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Box>

                  {/* Language Switch */}
                  <Box sx={{ px: 2.5, py: 1.5, pt: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GlobalOutlined style={{ fontSize: 14, color: theme.palette.text.secondary }} />
                        <Typography variant="body2">
                          Language
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {languages.map((lang) => (
                          <Button
                            key={lang.code}
                            size="small"
                            variant={(i18n || 'en') === lang.code ? 'contained' : 'outlined'}
                            onClick={() => onChangeLocalization(lang.code)}
                            sx={{
                              minWidth: 'auto',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              textTransform: 'none'
                            }}
                          >
                            {lang.flag}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Menu Items */}
                  <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
                    <ListItemButton selected={selectedIndex === 0} onClick={handleViewProfile}>
                      <ListItemIcon>
                        <UserOutlined />
                      </ListItemIcon>
                      <ListItemText primary="View Profile" />
                    </ListItemButton>
                    {hasAdminAccess && (
                      <ListItemButton selected={selectedIndex === 1} onClick={handleOrganizationSettings}>
                        <ListItemIcon>
                          <SettingOutlined />
                        </ListItemIcon>
                        <ListItemText primary="Account Settings" />
                      </ListItemButton>
                    )}
                    <ListItemButton selected={selectedIndex === 2} onClick={handleOpenFeedback}>
                      <ListItemIcon>
                        <CommentOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Feedback & Support" />
                    </ListItemButton>
                    {hasAdminAccess && (
                      <ListItemButton selected={selectedIndex === 5} onClick={handleOpenDebugDialog}>
                        <ListItemIcon>
                          <BugOutlined />
                        </ListItemIcon>
                        <ListItemText primary="User Debug" />
                      </ListItemButton>
                    )}

                    <Divider sx={{ my: 0.5 }} />

                    <ListItemButton selected={selectedIndex === 6} onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>

      {/* Organization Selector Dialog */}
      <Dialog
        open={orgDialogOpen}
        onClose={handleCloseOrgDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Switch Organization
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {loadingOrgs ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : organizations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No organizations available
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {organizations.map((org) => (
                <ListItemButton
                  key={org.id}
                  selected={org.isCurrent}
                  onClick={() => handleSwitchOrganization(org.id)}
                  disabled={switchingOrg}
                  sx={{
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      '&:hover': { bgcolor: 'primary.lighter' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {org.isCurrent ? (
                      <CheckCircleOutlined style={{ color: theme.palette.primary.main }} />
                    ) : (
                      <ApartmentOutlined style={{ color: theme.palette.text.secondary }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: org.isCurrent ? 600 : 400, color: org.isCurrent ? 'primary.dark' : 'text.primary' }}>
                        {org.title}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        <Chip
                          label={org.role}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: org.isCurrent ? 'primary.main' : 'action.selected',
                            color: org.isCurrent ? 'primary.contrastText' : 'text.primary'
                          }}
                        />
                        {org.subOrganizationCount > 0 && (
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: org.isCurrent ? 'primary.dark' : 'text.secondary' }}>
                            {org.subOrganizationCount} sub-org{org.subOrganizationCount !== 1 ? 's' : ''}
                          </Typography>
                        )}
                        {org.isCurrent && (
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                            Current
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {switchingOrg && (
            <Box sx={{ p: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 1, borderTop: 1, borderColor: 'divider' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="textSecondary">
                Switching organization...
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* User Debug Dialog */}
      <Dialog
        open={debugDialogOpen}
        onClose={handleCloseDebugDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#fff3e0', border: '2px solid #ff9800' }
        }}
      >
        <DialogTitle sx={{ pb: 1, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            🔐 WorkOS Debug Info (TEMPORARY)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefreshWorkOS}
              disabled={refreshing}
              sx={{
                textTransform: 'none',
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  borderColor: '#f57c00',
                  bgcolor: 'rgba(255, 152, 0, 0.04)'
                }
              }}
            >
              {refreshing ? 'Syncing...' : 'Refresh with WorkOS'}
            </Button>
            <IconButton size="small" onClick={() => setDebugExpanded(!debugExpanded)}>
              {debugExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ bgcolor: '#fff3e0' }}>
          {loadingClaims ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : !claimsData || !claimsData.authenticated ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                No claims data available
              </Typography>
            </Box>
          ) : (
            <Collapse in={debugExpanded}>
              {/* User Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>User:</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>Email: {claimsData.user?.email}</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>User ID: {claimsData.user?.userId}</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>WorkOS User ID: {claimsData.user?.workosUserId}</Typography>
                {claimsData.user?.role && (
                  <Typography variant="body2" sx={{ color: '#000' }}>Role: {claimsData.user?.role}</Typography>
                )}
                {claimsData.user?.organizationName && (
                  <Typography variant="body2" sx={{ color: '#000' }}>Organization: {claimsData.user?.organizationName}</Typography>
                )}
                {claimsData.user?.subOrganizationName && (
                  <Typography variant="body2" sx={{ color: '#000' }}>Sub-Organization: {claimsData.user?.subOrganizationName}</Typography>
                )}
              </Box>

              {/* JWT Permissions */}
              {claimsData.jwtPermissions && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                    🔑 WorkOS Permissions (from JWT Token):
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    Role: {claimsData.jwtPermissions.roleSlug} ({claimsData.jwtPermissions.permissionCount} permissions)
                  </Typography>
                  {claimsData.jwtPermissions.permissions && claimsData.jwtPermissions.permissions.length > 0 ? (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {claimsData.jwtPermissions.permissions.map((perm, i) => (
                        <Chip
                          key={i}
                          label={perm}
                          size="small"
                          color="success"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      No permissions found in WorkOS role
                    </Typography>
                  )}
                </Box>
              )}

              {/* Cache Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>Cache:</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>
                  Type: {claimsData.cacheType}
                  {claimsData.cacheConnected ? ' ✅' : ' ❌'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>
                  Expires in: {claimsData.claimsInfo?.expiresInMinutes} minutes
                </Typography>
              </Box>

              {/* Organizations */}
              {claimsData.organizations && claimsData.organizations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                    Organizations ({claimsData.organizations.length}):
                  </Typography>
                  {claimsData.organizations.map((org, index) => (
                    <Paper key={index} sx={{ p: 1.5, mb: 1.5, bgcolor: '#f5f5f5' }}>
                      {/* Organization Header with Role */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                            {org.orgTitle || 'Unknown Organization'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                            ID: {org.orgId?.slice(0, 8)}...
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={org.role}
                            color="primary"
                            size="medium"
                            sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                          />
                          <Chip
                            label={org.status}
                            color={org.status === 'active' ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 0.5 }}
                          />
                        </Box>
                      </Box>

                      {/* Access Summary */}
                      <Box sx={{
                        mt: 1.5,
                        p: 1,
                        bgcolor: org.subOrgCount > 0 ? '#e8f5e9' : '#ffebee',
                        borderRadius: 1,
                        border: org.subOrgCount > 0 ? '1px solid #4caf50' : '1px solid #f44336'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000', mb: 0.5 }}>
                          Access as {org.role}:
                        </Typography>
                        {org.subOrganizations && org.subOrganizations.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {org.subOrganizations.map((subOrg, i) => (
                              <Chip
                                key={i}
                                label={typeof subOrg === 'object' ? subOrg.title : subOrg}
                                size="small"
                                color="success"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 500, fontSize: '0.8rem' }}>
                            ⚠️ No sub-organizations assigned - user cannot access any data in this organization
                          </Typography>
                        )}
                      </Box>

                      {/* Permissions */}
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000', fontSize: '0.75rem' }}>
                          Permissions ({org.permissionCount}):
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {org.permissions.map((perm, i) => (
                            <Chip
                              key={i}
                              label={perm}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', color: '#000', borderColor: '#999' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Summary */}
              {claimsData.summary && (
                <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>Summary:</Typography>
                  <Typography variant="body2" sx={{ color: '#000' }}>Total Organizations: {claimsData.summary.totalOrganizations}</Typography>
                  <Typography variant="body2" sx={{ color: '#000' }}>Total Unique Permissions (Local): {claimsData.summary.totalPermissions}</Typography>
                  {claimsData.summary.jwtPermissionCount !== undefined && (
                    <Typography variant="body2" sx={{ color: '#000' }}>JWT Permissions: {claimsData.summary.jwtPermissionCount}</Typography>
                  )}
                  <Typography variant="body2" sx={{ color: '#000' }}>Total Sub-Organizations: {claimsData.summary.totalSubOrganizations}</Typography>
                  <Typography variant="body2" sx={{ color: '#000' }}>Roles: {claimsData.summary.roles.join(', ')}</Typography>
                </Box>
              )}
            </Collapse>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={handleCloseFeedback}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">Send Feedback</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Help us improve EDWIND by sharing your thoughts
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={feedbackType}
                label="Feedback Type"
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <MenuItem value="Bug Report">Bug Report</MenuItem>
                <MenuItem value="Feature Request">Feature Request</MenuItem>
                <MenuItem value="Improvement">Improvement</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Your Message"
              multiline
              rows={4}
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Describe your feedback in detail..."
              helperText={`${feedbackMessage.length}/2000 characters (minimum 10)`}
              inputProps={{ maxLength: 2000 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseFeedback} disabled={feedbackSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={feedbackSubmitting || !feedbackType || feedbackMessage.length < 10}
            startIcon={feedbackSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
