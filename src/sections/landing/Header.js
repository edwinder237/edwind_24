// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, Chip, Container, Grid, Typography } from '@mui/material';

// third party
import { motion } from 'framer-motion';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import Logo from 'components/logo';
import useUser from 'hooks/useUser';

// assets
import { EyeOutlined, DashboardOutlined, ToolOutlined } from '@ant-design/icons';

// ==============================|| LANDING - HERO PAGE ||============================== //

const HeaderPage = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useUser();
  const requiresCheckout = user?.subscription?.requiresCheckout;

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
                  <FormattedMessage id="landing.hero.headline" />
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
                    lineHeight: { xs: 1.4, md: 1.6 },
                    opacity: 0.85
                  }}
                >
                  <FormattedMessage id="landing.hero.subheadline" />
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} sx={{ my: 2 }}>
              <motion.div
                initial={{ opacity: 0, translateY: 550 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 30,
                  delay: 0.35
                }}
              >
                <Chip
                  label={<FormattedMessage id="landing.hero.trialBadge" />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: `1px solid ${theme.palette.primary.main}`,
                    fontWeight: 500,
                    fontSize: '0.8rem'
                  }}
                />
              </motion.div>
            </Grid>
            <Grid item xs={12} sx={{ mb: 1 }}>
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
                  {isAuthenticated ? (
                    <Grid item>
                      <AnimateButton>
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={
                            requiresCheckout
                              ? <ToolOutlined style={{ fontSize: '1.15rem' }} />
                              : <DashboardOutlined style={{ fontSize: '1.15rem' }} />
                          }
                          onClick={() => {
                            window.location.href = requiresCheckout ? '/checkout-required' : '/projects';
                          }}
                          sx={{
                            backgroundColor: requiresCheckout ? '#ed6c02' : theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: requiresCheckout ? '#e65100' : theme.palette.primary.dark
                            }
                          }}
                        >
                          {requiresCheckout ? 'Complete Setup' : 'Go to Dashboard'}
                        </Button>
                      </AnimateButton>
                    </Grid>
                  ) : (
                    <>
                      <Grid item>
                        <AnimateButton>
                          <Button
                            size="large"
                            variant="contained"
                            startIcon={<EyeOutlined style={{ fontSize: '1.15rem' }} />}
                            onClick={() => {
                              window.location.href = '/signup';
                            }}
                            sx={{
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              '&:hover': {
                                backgroundColor: theme.palette.primary.dark
                              }
                            }}
                          >
                            <FormattedMessage id="landing.hero.startTrial" />
                          </Button>
                        </AnimateButton>
                      </Grid>
                      <Grid item>
                        <AnimateButton>
                          <Button
                            size="large"
                            variant="outlined"
                            onClick={() => {
                              document.getElementById('why-edbahn')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            sx={{
                              borderColor: theme.palette.primary.main,
                              color: theme.palette.primary.main,
                              '&:hover': {
                                borderColor: theme.palette.primary.dark,
                                backgroundColor: 'rgba(0, 131, 253, 0.04)'
                              }
                            }}
                          >
                            <FormattedMessage id="landing.hero.seeHowItWorks" />
                          </Button>
                        </AnimateButton>
                      </Grid>
                    </>
                  )}
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
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              gap: 2,
              [theme.breakpoints.down('md')]: { mt: 4 }
            }}>
              <Logo sx={{ width: 280, height: 'auto' }} />
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.7rem', md: '0.8rem' },
                  textAlign: 'center'
                }}
              >
                <FormattedMessage id="landing.hero.tagline" />
              </Typography>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HeaderPage;
