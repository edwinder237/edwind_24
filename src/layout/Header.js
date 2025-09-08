import PropTypes from 'prop-types';
import * as React from 'react';
import { useState } from 'react';

// next
import NextLink from 'next/link';

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
  const session = null; // Replace with your authentication logic

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
      <AppBar sx={{ bgcolor: '#1a1a1a', color: 'white', boxShadow: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth={false} sx={{ px: 3 }}>
          <Toolbar sx={{ px: 0, py: 0, minHeight: HEADER_HEIGHT }}>
            {/* Logo - Always visible */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img 
                src="/assets/images/logos/edwind-color-logo.png" 
                alt="EDWIND" 
                style={{ height: '40px', width: 'auto' }}
              />
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 'auto' }}>
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
                  href="#features" 
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Features
                </Link>
                <Link 
                  href="#pricing" 
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Pricing
                </Link>
                <Link 
                  href="#demo" 
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Demo
                </Link>
                <Link 
                  href="#contact" 
                  className="header-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Contact
                </Link>
                <Box sx={{ ml: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <AnimateButton>
                    <Button
                      variant="contained"
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
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontWeight: 500,
                        minWidth: '100px',
                        height: '40px',
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#1565c0'
                        }
                      }}
                    >
                      Login
                    </Button>
                  </AnimateButton>
                  <AnimateButton>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={async () => {
                        try {
                          // WorkOS uses the same auth endpoint for both login and signup
                          const response = await fetch('/api/auth/signin-url');
                          const data = await response.json();
                          if (data.url) {
                            window.location.href = data.url;
                          }
                        } catch (error) {
                          console.error('Error redirecting to sign-up:', error);
                        }
                      }}
                      sx={{ 
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        fontWeight: 500,
                        minWidth: '100px',
                        height: '40px',
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#1565c0',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
                      Sign Up
                    </Button>
                  </AnimateButton>
                </Box>
              </Stack>
            </Box>

            {/* Mobile Navigation */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', ml: 'auto', gap: 1 }}>
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
                  minWidth: '60px',
                  fontSize: '0.8rem',
                  borderColor: '#1976d2', 
                  color: '#1976d2',
                  px: 1.5
                }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/signin-url');
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error('Error redirecting to sign-up:', error);
                  }
                }}
                sx={{ 
                  height: 32, 
                  minWidth: '60px',
                  fontSize: '0.8rem',
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  px: 1.5,
                  '&:hover': { backgroundColor: '#1565c0' } 
                }}
              >
                Sign Up
              </Button>

              <IconButton
                {...(layout === 'component' ? { onClick: handleDrawerOpen } : { onClick: drawerToggler(true) })}
                sx={{ 
                  color: 'white',
                  ml: 0.5,
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
                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Features" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
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
                      <ListItemText primary="Pricing" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
                    </ListItemButton>
                    <ListItemButton 
                      component="span"
                      onClick={() => {
                        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Demo" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
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
                      <ListItemText primary="Contact" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
                    </ListItemButton>
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
                      <ListItemText primary="Login" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
                    </ListItemButton>
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
                          console.error('Error redirecting to sign-up:', error);
                        }
                        setDrawerToggle(false);
                      }}
                    >
                      <ListItemIcon>
                        <LineOutlined />
                      </ListItemIcon>
                      <ListItemText primary="Sign Up" primaryTypographyProps={{ variant: 'h6', color: 'text.primary' }} />
                    </ListItemButton>
                  </List>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ElevationScroll>
  );
};

Header.propTypes = {
  handleDrawerOpen: PropTypes.func,
  layout: PropTypes.string
};

export default Header;