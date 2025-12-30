import { useRef, useState, useEffect } from 'react';

// next
import { useRouter } from 'next/router';


// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  capitalize,
  CardContent,
  ClickAwayListener,
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
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';

// project import
import useUser from 'hooks/useUser';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import useConfig from 'hooks/useConfig';

// assets
import { LogoutOutlined, UserOutlined, WalletOutlined, QuestionCircleOutlined, CommentOutlined, SettingOutlined, EditOutlined, CheckCircleOutlined, ApartmentOutlined } from '@ant-design/icons';

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
  const { user } = useUser();
  const router = useRouter();
  const { mode, onChangeMode } = useConfig();

  // Check if user has admin role
  const hasAdminAccess = isAdmin(user?.role);

  // Organization selector state
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);

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
                  <CardContent sx={{ px: 2.5, pt: 3 }}>
                    <Grid container justifyContent="flex-start" alignItems="center">
                      <Grid item>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText
                            }}
                          >
                            {getInitials(user?.name)}
                          </Avatar>
                          <Stack>
                            <Typography variant="body2" color="textSecondary">
                              {user?.role || 'User'}
                            </Typography>
                            {user?.organizationName && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
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
                                  <EditOutlined style={{ fontSize: '0.7rem', color: '#666' }} />
                                </IconButton>
                              </Box>
                            )}
                            {user?.subOrganizationName && (
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                                {user.subOrganizationName}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>

                  {/* Dark Mode Toggle */}
                  <Box sx={{ px: 2.5, pb: 2 }}>
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

                  {/* Combined Menu */}
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
                        <ListItemText primary="Organization Settings" />
                      </ListItemButton>
                    )}
                    <ListItemButton selected={selectedIndex === 2} onClick={(event) => handleListItemClick(event, 2)}>
                      <ListItemIcon>
                        <WalletOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Billing" />
                    </ListItemButton>
                    <ListItemButton selected={selectedIndex === 3} onClick={(event) => handleListItemClick(event, 3)}>
                      <ListItemIcon>
                        <QuestionCircleOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Support" />
                    </ListItemButton>
                    <ListItemButton selected={selectedIndex === 4} onClick={(event) => handleListItemClick(event, 4)}>
                      <ListItemIcon>
                        <CommentOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Feedback" />
                    </ListItemButton>
                    <ListItemButton selected={selectedIndex === 5} onClick={handleLogout}>
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
        PaperProps={{
          sx: { bgcolor: '#fff' }
        }}
      >
        <DialogTitle sx={{ pb: 1, color: '#000' }}>
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
              <Typography variant="body2" sx={{ color: '#666' }}>
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
                  disabled={switchingOrg || org.isCurrent}
                  sx={{
                    py: 1.5,
                    bgcolor: '#fff',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    '&.Mui-selected': {
                      bgcolor: '#f0f0f0',
                      '&:hover': { bgcolor: '#f0f0f0' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {org.isCurrent ? (
                      <CheckCircleOutlined style={{ color: '#000' }} />
                    ) : (
                      <ApartmentOutlined style={{ color: '#666' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: org.isCurrent ? 600 : 400, color: '#000' }}>
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
                            bgcolor: '#e0e0e0',
                            color: '#000'
                          }}
                        />
                        {org.subOrganizationCount > 0 && (
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                            {org.subOrganizationCount} sub-org{org.subOrganizationCount !== 1 ? 's' : ''}
                          </Typography>
                        )}
                        {org.isCurrent && (
                          <Typography variant="caption" sx={{ fontWeight: 500, color: '#000' }}>
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
            <Box sx={{ p: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid #eee' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" sx={{ color: '#666' }}>
                Switching organization...
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;
