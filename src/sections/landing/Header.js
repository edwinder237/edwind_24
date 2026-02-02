// next
import NextLink from 'next/link';
import Image from 'next/legacy/image';

// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, Container, Grid, Link, Typography } from '@mui/material';

// third party
import { motion } from 'framer-motion';

// project import
import AnimateButton from 'components/@extended/AnimateButton';

// assets
import { EyeOutlined } from '@ant-design/icons';

const headerlogo = '/assets/images/logos/edwind-color-logo.png';

// ==============================|| LANDING - HEADER PAGE ||============================== //

const HeaderPage = () => {
  const theme = useTheme();

  return (
    <Container sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Grid container alignItems="center" justifyContent="space-between" spacing={2} sx={{ pt: { md: 0, xs: 8 }, pb: { md: 0, xs: 5 } }}>
        <Grid item xs={12} lg={7} md={7}>
          <Grid container spacing={2} sx={{ pr: { lg: 4, md: 2 }, [theme.breakpoints.down('md')]: { pr: 0, textAlign: 'center' } }}>
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
                  variant="h1"
                  color="white"
                  sx={{
                    fontSize: { xs: '1.825rem', sm: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    lineHeight: { xs: 1.3, sm: 1.3, md: 1.3 }
                  }}
                >
                  <FormattedMessage id="landing.hero.welcome" />
                  <Box component="span" sx={{
                    color: '#1976d2',
                    textShadow: '0 0 10px rgba(25, 118, 210, 0.5), 0 0 20px rgba(25, 118, 210, 0.3), 0 0 30px rgba(25, 118, 210, 0.2)'
                  }}>
                    <FormattedMessage id="landing.hero.edwind" />
                  </Box>
                  <FormattedMessage id="landing.hero.platform" />
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, translateY: 550 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 30,
                  delay: 0.2
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  color="white"
                  sx={{
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    fontWeight: 400,
                    lineHeight: { xs: 1.4, md: 1.4 }
                  }}
                >
                  <FormattedMessage id="landing.hero.description" />
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} sx={{ my: 3.25 }}>
              <motion.div
                initial={{ opacity: 0, translateY: 550 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 30,
                  delay: 0.4
                }}
              >
                <Grid container spacing={2} sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Grid item>
                    <AnimateButton>
                      <Button
                        size="large"
                        variant="outlined"
                        onClick={() => {
                          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        sx={{
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          '&:hover': {
                            borderColor: '#1565c0',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)'
                          }
                        }}
                      >
                        <FormattedMessage id="landing.hero.seePricing" />
                      </Button>
                    </AnimateButton>
                  </Grid>
                  <Grid item>
                    <AnimateButton>
                      <Button
                        size="large"
                        variant="contained"
                        startIcon={<EyeOutlined style={{ fontSize: '1.15rem' }} />}
                        onClick={() => {
                          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        sx={{
                          backgroundColor: '#1976d2',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#1565c0'
                          }
                        }}
                      >
                        <FormattedMessage id="landing.nav.getStarted" />
                      </Button>
                    </AnimateButton>
                  </Grid>
                </Grid>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={5} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, translateX: 550 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 30,
              delay: 0.6
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              [theme.breakpoints.down('md')]: { mt: 4 }
            }}>
              <Image src={headerlogo} alt="EDWIND" width={380} height={160} style={{ zIndex: 9 }} />
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HeaderPage;
