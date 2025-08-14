import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

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
  FormControlLabel
} from '@mui/material';

// project import
import useUser from 'hooks/useUser';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import useConfig from 'hooks/useConfig';

// assets
import { LogoutOutlined, UserOutlined, WalletOutlined, QuestionCircleOutlined, CommentOutlined, SettingOutlined } from '@ant-design/icons';

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

const Profile = () => {
  const theme = useTheme();
  const user = useUser();
  const router = useRouter();
  const { mode, onChangeMode } = useConfig();

  const handleLogout = () => {
    // Redirect to logout endpoint
    window.location.href = '/api/auth/logout';
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
            <Typography variant="subtitle1"> {capitalize(user.name)}</Typography>
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
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                {user.organizationName}
                              </Typography>
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
                    <ListItemButton selected={selectedIndex === 1} onClick={handleOrganizationSettings}>
                      <ListItemIcon>
                        <SettingOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Organization Settings" />
                    </ListItemButton>
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
    </Box>
  );
};

export default Profile;
