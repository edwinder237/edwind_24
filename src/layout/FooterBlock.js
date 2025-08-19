import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import { Box, Button, Container, CardMedia, Divider, Grid, Link, Stack, Typography } from '@mui/material';

// third party
import { motion } from 'framer-motion';

// project import
import useConfig from 'hooks/useConfig';
import AnimateButton from 'components/@extended/AnimateButton';
import { useCookieConsent } from 'contexts/CookieConsentContext';
import LegalModal from 'components/LegalModal';

// assets
import { SendOutlined } from '@ant-design/icons';

const imgfooterlogo = 'assets/images/logos/edwind-white-logo.png';

// link - custom style
const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main
  },
  '&:active': {
    color: theme.palette.primary.main
  }
}));

// ==============================|| LANDING - FOOTER PAGE ||============================== //

const FooterBlock = ({ isFull }) => {
  const theme = useTheme();
  const { presetColor } = useConfig();
  const { openPreferences } = useCookieConsent();
  const textColor = theme.palette.mode === 'dark' ? 'text.primary' : 'background.paper';
  
  const [legalModal, setLegalModal] = useState({ open: false, type: '' });

  const handleLegalClick = (type) => {
    setLegalModal({ open: true, type });
  };

  const handleLegalClose = () => {
    setLegalModal({ open: false, type: '' });
  };



  return (
    <>
      {isFull && (
        <Box
          sx={{
            position: 'relative',
            bgcolor: theme.palette.grey.A700,
            zIndex: 1,
            mt: { xs: 0, md: 13.75 },
            pt: { xs: 8, sm: 7.5, md: 18.75 },
            pb: { xs: 2.5, md: 10 },
            '&:after': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '80%',
              bottom: 0,
              left: 0,
              background: `linear-gradient(180deg, transparent 0%, ${theme.palette.grey.A700} 70%)`
            }
          }}
        >
          <Container>
            <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
              <Grid item xs={12} md={6} sx={{ position: 'relative', zIndex: 1 }}>
                <Grid container spacing={2} sx={{ [theme.breakpoints.down('md')]: { pr: 0, textAlign: 'center' } }}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.common.white }}>
                      Roadmap
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, translateY: 550 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 150,
                        damping: 30
                      }}
                    >
                      <Typography
                        variant="h2"
                        sx={{
                          color: theme.palette.common.white,
                          fontWeight: 700
                        }}
                      >
                        Upcoming Release
                      </Typography>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ color: theme.palette.common.white }}>
                      Stay updated with the latest features and improvements coming to EDWIND platform.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sx={{ my: 2 }}>
                    <Box sx={{ display: 'inline-block' }}>
                      <AnimateButton>
                        <Button
                          size="large"
                          variant="contained"
                          endIcon={<SendOutlined />}
                          component={Link}
                          href="#contact"
                        >
                          Contact Us
                        </Button>
                      </AnimateButton>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      <Box sx={{ pt: isFull ? 0 : 10, pb: 10, bgcolor: theme.palette.grey.A700 }}>
        <Container>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, translateY: 550 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 30
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <CardMedia component="img" image={imgfooterlogo} sx={{ width: '180px', height: 'auto' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.common.white }}>
                      EDWIND is a comprehensive training management platform designed to empower organizations with 
                      advanced educational development and participant tracking solutions.
                    </Typography>
                  </Grid>
                </Grid>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={{ xs: 5, md: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={{ xs: 3, md: 5 }}>
                    <Typography variant="h5" color={textColor} sx={{ fontWeight: 500 }}>
                      Company
                    </Typography>
                    <Stack spacing={{ xs: 1.5, md: 2.5 }}>
                      <FooterLink href="#about" underline="none">
                        About Us
                      </FooterLink>
                      <FooterLink href="#contact" underline="none">
                        Contact Us
                      </FooterLink>
                      <FooterLink href="#careers" underline="none">
                        Careers
                      </FooterLink>
                      <FooterLink href="#blog" underline="none">
                        Blog
                      </FooterLink>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={{ xs: 3, md: 5 }}>
                    <Typography variant="h5" color={textColor} sx={{ fontWeight: 500 }}>
                      Support
                    </Typography>
                    <Stack spacing={{ xs: 1.5, md: 2.5 }}>
                      <FooterLink href="#help" underline="none">
                        Help Center
                      </FooterLink>
                      <FooterLink href="#documentation" underline="none">
                        Documentation
                      </FooterLink>
                      <FooterLink href="#support" underline="none">
                        Technical Support
                      </FooterLink>
                      <FooterLink href="#training" underline="none">
                        Training Resources
                      </FooterLink>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={{ xs: 3, md: 5 }}>
                    <Typography variant="h5" color={textColor} sx={{ fontWeight: 500 }}>
                      Legal
                    </Typography>
                    <Stack spacing={{ xs: 1.5, md: 2.5 }}>
                      <FooterLink 
                        component="button"
                        underline="none"
                        onClick={() => handleLegalClick('privacy')}
                        sx={{ 
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        Privacy Policy
                      </FooterLink>
                      <FooterLink 
                        component="button"
                        underline="none"
                        onClick={() => handleLegalClick('terms')}
                        sx={{ 
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        Terms of Service
                      </FooterLink>
                      <FooterLink 
                        component="button"
                        underline="none"
                        onClick={() => handleLegalClick('license')}
                        sx={{ 
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        License Agreement
                      </FooterLink>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={{ xs: 3, md: 5 }}>
                    <Typography variant="h5" color={textColor} sx={{ fontWeight: 500 }}>
                      Resources
                    </Typography>
                    <Stack spacing={{ xs: 1.5, md: 2.5 }}>
                      <FooterLink href="#tutorials" underline="none">
                        Tutorials
                      </FooterLink>
                      <FooterLink href="#webinars" underline="none">
                        Webinars
                      </FooterLink>
                      <FooterLink href="#case-studies" underline="none">
                        Case Studies
                      </FooterLink>
                      <FooterLink href="#community" underline="none">
                        Community
                      </FooterLink>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Divider sx={{ borderColor: 'grey.700' }} />
      <Box
        sx={{
          py: 1.5,
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[50] : theme.palette.grey[800]
        }}
      >
        <Container>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Typography variant="subtitle2" color="secondary">
                © EDWIND by <Link href="https://www.lumeve.ca" target="_blank" color="inherit" underline="hover">Lumeve</Link> All rights reserved
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={openPreferences}
                  sx={{
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontSize: '0.775rem',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  Cookie Preferences
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Legal Modal */}
      <LegalModal 
        open={legalModal.open} 
        onClose={handleLegalClose} 
        type={legalModal.type} 
      />
    </>
  );
};

FooterBlock.propTypes = {
  isFull: PropTypes.bool
};

export default FooterBlock;
