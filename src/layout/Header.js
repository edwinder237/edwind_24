import PropTypes from 'prop-types';
import * as React from 'react';
import { useState } from 'react';

// next
import NextLink from 'next/link';

// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import AppBar from '@mui/material/AppBar';
import { useTheme } from '@mui/material/styles';
import {
  useMediaQuery,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger
} from '@mui/material';

// project import
import { APP_DEFAULT_PATH, ThemeMode, HEADER_HEIGHT } from 'config';
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import Logo from 'components/logo';
import LanguageSelector from 'components/LanguageSelector';
import useUser from 'hooks/useUser';

// assets
import { MenuOutlined, LineOutlined } from '@ant-design/icons';

// ==============================|| COMPONENTS - APP BAR ||============================== //

// elevation scroll
function ElevationScroll({ layout, children, window }) {
  const theme = useTheme();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 10,
    target: window ? window() : undefined
  });

  const backColorScroll = theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[800];
  const backColor = layout !== 'landing' ? backColorScroll : 'transparent';

  return React.cloneElement(children, {
    style: {
      backgroundColor: trigger ? backColorScroll : backColor
    }
  });
}

const Header = ({ handleDrawerOpen, layout = 'landing', ...others }) => {
  const theme = useTheme();
  const { user, isAuthenticated } = useUser();
  const requiresCheckout = user?.subscription?.requiresCheckout;

  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerToggle, setDrawerToggle] = useState(false);

  /** Method called on multiple components with different event types */
  const drawerToggler = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerToggle(open);
  };

  return (
    <ElevationScroll layout={layout} {...others}>
      <AppBar sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        boxShadow: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        margin: 0,
        padding: 0,
        width: '100vw'
      }}>
        <Box sx={{ width: '100%', px: 0 }}>
          <Toolbar sx={{ px: 0, py: 0, minHeight: HEADER_HEIGHT, width: '100%' }}>
            {/* Logo - Always visible */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pl: { xs: 1, md: 2 } }}>
              <Logo sx={{ width: 'auto', height: 35 }} />
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 'auto', pr: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  '& .header-link': {
                    px: 2,
                    py: 1,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }
                }}
                spacing={0.5}
              >
                <Link
                  href="#why-edbahn"
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('why-edbahn')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FormattedMessage id="landing.nav.whyEdbahn" />
                </Link>
                <Link
                  href="#features"
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FormattedMessage id="landing.nav.features" />
                </Link>
                <Link
                  href="#pricing"
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FormattedMessage id="landing.nav.pricing" />
                </Link>
                <Link
                  href="#contact"
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FormattedMessage id="landing.nav.contact" />
                </Link>

                {/* Language Selector */}
                <LanguageSelector variant="landing" />

                <Box sx={{ ml: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  {isAuthenticated ? (
                    <AnimateButton>
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => {
                          window.location.href = requiresCheckout ? '/checkout-required' : '/projects';
                        }}
                        sx={{
                          backgroundColor: requiresCheckout ? '#ed6c02' : theme.palette.primary.main,
                          color: 'white',
                          fontWeight: 500,
                          minWidth: '140px',
                          height: '40px',
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: requiresCheckout ? '#e65100' : theme.palette.primary.dark
                          }
                        }}
                      >
                        {requiresCheckout ? 'Complete Setup' : 'Go to App'}
                      </Button>
                    </AnimateButton>
                  ) : (
                    <>
                      <AnimateButton>
                        <Button
                          variant="outlined"
                          size="medium"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/auth/signin-url');
                              const data = await response.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            } catch (error) {
                              console.error('Error redirecting to sign-in:', error);
                            }
                          }}
                          sx={{
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            minWidth: '100px',
                            height: '40px',
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: theme.palette.primary.dark,
                              backgroundColor: `${theme.palette.primary.main}0A`
                            }
                          }}
                        >
                          <FormattedMessage id="landing.nav.login" />
                        </Button>
                      </AnimateButton>
                      <AnimateButton>
                        <Button
                          variant="contained"
                          size="medium"
                          onClick={() => {
                            window.location.href = '/signup';
                          }}
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            fontWeight: 500,
                            minWidth: '100px',
                            height: '40px',
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark
                            }
                          }}
                        >
                          <FormattedMessage id="landing.nav.getStarted" />
                        </Button>
                      </AnimateButton>
                    </>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Mobile Navigation */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', ml: 'auto', gap: 0.5, pr: 1 }}>
              {/* Language Selector for Mobile */}
              <LanguageSelector variant="landing" />

              {isAuthenticated ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    window.location.href = requiresCheckout ? '/checkout-required' : '/projects';
                  }}
                  sx={{
                    height: 32,
                    minWidth: '80px',
                    fontSize: '0.75rem',
                    backgroundColor: requiresCheckout ? '#ed6c02' : theme.palette.primary.main,
                    color: 'white',
                    px: 1,
                    '&:hover': { backgroundColor: requiresCheckout ? '#e65100' : theme.palette.primary.dark }
                  }}
                >
                  {requiresCheckout ? 'Complete Setup' : 'Dashboard'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/signin-url');
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        console.error('Error redirecting to sign-in:', error);
                      }
                    }}
                    sx={{
                      height: 32,
                      minWidth: '55px',
                      fontSize: '0.75rem',
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      px: 1
                    }}
                  >
                    <FormattedMessage id="landing.nav.login" />
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      window.location.href = '/signup';
                    }}
                    sx={{
                      height: 32,
                      minWidth: '55px',
                      fontSize: '0.75rem',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      px: 1,
                      '&:hover': { backgroundColor: theme.palette.primary.dark }
                    }}
                  >
                    <FormattedMessage id="landing.nav.getStarted" />
                  </Button>
                </>
              )}

              <IconButton
                {...(layout === 'component' ? { onClick: handleDrawerOpen } : { onClick: drawerToggler(true) })}
                sx={{
                  color: 'white',
                  ml: 0.25,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <MenuOutlined />
              </IconButton>
              <Drawer
                anchor="top"
                open={drawerToggle}
                onClose={drawerToggler(false)}
                sx={{ '& .MuiDrawer-paper': { backgroundImage: 'none' } }}
              >
                <Box
                  sx={{
                    width: 'auto',
                    '& .MuiListItemIcon-root': {
                      fontSize: '1rem',
                      minWidth: 28
                    }
                  }}
                  role="presentation"
                  onClick={drawerToggler(false)}
                  onKeyDown={drawerToggler(false)}
                >
                  <List>
                    <ListItemButton
                      component="span"
                      onClick={() => {
                        document.getElementById('why-edbahn')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={<FormattedMessage id="landing.nav.whyEdbahn" />}
                        primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      component="span"
                      onClick={() => {
                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={<FormattedMessage id="landing.nav.features" />}
                        primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      component="span"
                      onClick={() => {
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={<FormattedMessage id="landing.nav.pricing" />}
                        primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      component="span"
                      onClick={() => {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={<FormattedMessage id="landing.nav.contact" />}
                        primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                      />
                    </ListItemButton>
                    {isAuthenticated ? (
                      <ListItemButton
                        component="span"
                        onClick={() => {
                          window.location.href = requiresCheckout ? '/checkout-required' : '/projects';
                          setDrawerToggle(false);
                        }}
                      >
                        <ListItemIcon>
                          <LineOutlined />
                        </ListItemIcon>
                        <ListItemText
                          primary={requiresCheckout ? 'Complete Setup' : 'Go to App'}
                          primaryTypographyProps={{ variant: 'h6', color: requiresCheckout ? 'warning.main' : 'primary.main' }}
                        />
                      </ListItemButton>
                    ) : (
                      <>
                        <ListItemButton
                          component="span"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/auth/signin-url');
                              const data = await response.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            } catch (error) {
                              console.error('Error redirecting to sign-in:', error);
                            }
                            setDrawerToggle(false);
                          }}
                        >
                          <ListItemIcon>
                            <LineOutlined />
                          </ListItemIcon>
                          <ListItemText
                            primary={<FormattedMessage id="landing.nav.login" />}
                            primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                          />
                        </ListItemButton>
                        <ListItemButton
                          component="span"
                          onClick={() => {
                            window.location.href = '/signup';
                            setDrawerToggle(false);
                          }}
                        >
                          <ListItemIcon>
                            <LineOutlined />
                          </ListItemIcon>
                          <ListItemText
                            primary={<FormattedMessage id="landing.nav.getStarted" />}
                            primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                          />
                        </ListItemButton>
                      </>
                    )}
                  </List>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Box>
      </AppBar>
    </ElevationScroll>
  );
};

Header.propTypes = {
  handleDrawerOpen: PropTypes.func,
  layout: PropTypes.string
};

export default Header;
