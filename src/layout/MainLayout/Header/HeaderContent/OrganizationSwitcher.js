import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  ClickAwayListener,
  Paper,
  Popper,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import useUser from 'hooks/useUser';

// assets
import {
  SwapOutlined,
  ApartmentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// ==============================|| HEADER CONTENT - SUB-ORGANIZATION SWITCHER ||============================== //

const OrganizationSwitcher = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [subOrganizations, setSubOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubOrgId, setCurrentSubOrgId] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Fetch sub-organizations on mount to determine if switcher should be shown
  useEffect(() => {
    if (user && !initialLoaded) {
      fetchSubOrganizations();
      setInitialLoaded(true);
    }
  }, [user]);

  // Refresh list when dropdown opens
  useEffect(() => {
    if (open && initialLoaded) {
      fetchSubOrganizations();
    }
  }, [open]);

  // Refresh list when user sub-organization changes
  useEffect(() => {
    if (user && subOrganizations.length > 0) {
      fetchSubOrganizations();
    }
  }, [user?.subOrganizationName]);

  const fetchSubOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organization/list-organizations');
      const data = await response.json();

      if (data.success) {
        setSubOrganizations(data.subOrganizations || []);
        setCurrentSubOrgId(data.currentSubOrganizationId);
      } else {
        setError('Failed to load sub-organizations');
      }
    } catch (err) {
      console.error('Error fetching sub-organizations:', err);
      setError('Failed to load sub-organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleSwitchSubOrganization = async (subOrgId) => {
    if (subOrgId === currentSubOrgId || switching) {
      return;
    }

    setSwitching(true);
    setError(null);

    try {
      const response = await fetch('/api/organization/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subOrganizationId: subOrgId }),
      });

      const data = await response.json();

      if (data.success) {
        // Close dropdown
        setOpen(false);

        // Force a hard reload to ensure all cached data is cleared
        window.location.href = window.location.href;
      } else {
        setError(data.error || 'Failed to switch sub-organization');
        setSwitching(false);
      }
    } catch (err) {
      console.error('Error switching sub-organization:', err);
      setError('Failed to switch sub-organization');
      setSwitching(false);
    }
  };

  // Get current sub-organization name
  const currentSubOrgName = user?.subOrganizationName || 'Select Sub-Organization';

  const iconBackColorOpen = theme.palette.mode === 'dark' ? 'grey.200' : 'grey.300';

  // Only show if user is authenticated
  if (!user) {
    return null;
  }

  // Don't show switcher if there's only one sub-organization (or none)
  // User doesn't need to switch if there's nothing to switch to
  if (initialLoaded && subOrganizations.length <= 1) {
    return null;
  }

  // Group sub-organizations by parent organization
  const groupedSubOrgs = subOrganizations.reduce((acc, subOrg) => {
    const orgTitle = subOrg.organizationTitle;
    if (!acc[orgTitle]) {
      acc[orgTitle] = [];
    }
    acc[orgTitle].push(subOrg);
    return acc;
  }, {});

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0.75,
          bgcolor: open ? iconBackColorOpen : 'transparent',
          borderRadius: 1,
          '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'secondary.light' : 'secondary.lighter' },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2
          }
        }}
        aria-label="switch sub-organization"
        ref={anchorRef}
        aria-controls={open ? 'sub-organization-switcher' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SwapOutlined style={{ fontSize: '1.15rem' }} />
          <Stack spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
              Sub-Organization
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.2, fontWeight: 500 }}>
              {currentSubOrgName}
            </Typography>
          </Stack>
        </Stack>
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
                width: 350,
                minWidth: 300,
                maxWidth: 350,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 300
                }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <Box sx={{ p: 2, pb: 1.5 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      Switch Sub-Organization
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Select a sub-organization to switch your working context
                    </Typography>
                  </Box>

                  {error && (
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Alert severity="error" sx={{ py: 0.5 }}>
                        {error}
                      </Alert>
                    </Box>
                  )}

                  <Divider />

                  {loading ? (
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : subOrganizations.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No sub-organizations available
                      </Typography>
                    </Box>
                  ) : (
                    <List
                      component="nav"
                      sx={{
                        p: 0,
                        maxHeight: 400,
                        overflowY: 'auto',
                        '& .MuiListItemIcon-root': { minWidth: 32 }
                      }}
                    >
                      {Object.entries(groupedSubOrgs).map(([orgTitle, subOrgs]) => (
                        <Box key={orgTitle}>
                          <ListSubheader
                            sx={{
                              bgcolor: '#f5f5f5',
                              lineHeight: '32px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#666'
                            }}
                          >
                            {orgTitle}
                          </ListSubheader>
                          {subOrgs.map((subOrg) => (
                            <ListItemButton
                              key={subOrg.id}
                              selected={subOrg.isCurrent}
                              onClick={() => handleSwitchSubOrganization(subOrg.id)}
                              disabled={switching || subOrg.isCurrent}
                              sx={{
                                py: 1.25,
                                pl: 3,
                                bgcolor: '#fff',
                                '&:hover': {
                                  bgcolor: '#f9f9f9'
                                },
                                '&.Mui-selected': {
                                  bgcolor: '#f0f0f0',
                                  '&:hover': {
                                    bgcolor: '#f0f0f0'
                                  }
                                }
                              }}
                            >
                              <ListItemIcon>
                                {subOrg.isCurrent ? (
                                  <CheckCircleOutlined style={{ color: '#000' }} />
                                ) : (
                                  <ApartmentOutlined style={{ color: '#666' }} />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: subOrg.isCurrent ? 600 : 400, color: '#000' }}>
                                    {subOrg.title}
                                  </Typography>
                                }
                                secondary={
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                    <Chip
                                      label={subOrg.role}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        bgcolor: '#e0e0e0',
                                        color: '#000'
                                      }}
                                    />
                                    {subOrg.isCurrent && (
                                      <Typography variant="caption" sx={{ fontWeight: 500, color: '#000' }}>
                                        Current
                                      </Typography>
                                    )}
                                  </Stack>
                                }
                              />
                            </ListItemButton>
                          ))}
                        </Box>
                      ))}
                    </List>
                  )}

                  {switching && (
                    <Box sx={{ p: 2, pt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Switching sub-organization...
                      </Typography>
                    </Box>
                  )}
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

export default OrganizationSwitcher;
