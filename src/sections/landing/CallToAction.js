// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, Container, Grid, Typography } from '@mui/material';

// third party
import { motion } from 'framer-motion';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import { ThemeMode } from 'config';

// assets
import { LoginOutlined, PhoneOutlined } from '@ant-design/icons';

// ==============================|| LANDING - CALL TO ACTION PAGE ||============================== //

const CallToActionPage = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[100] : theme.palette.secondary[800],
        '&:after': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '80%',
          bottom: 0,
          left: 0,
          background: `linear-gradient(180deg, transparent, ${
            theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[100] : theme.palette.secondary[800]
          })`
        }
      }}
    >
      <Container>
        <Grid
          container
          alignItems="stretch"
          justifyContent="center"
          spacing={4}
          sx={{
            position: 'relative',
            zIndex: 1,
            pt: { md: 12, xs: 7.5 },
            pb: { md: 10, xs: 5 }
          }}
        >
          {/* For Training Managers & Consultants */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 30
              }}
              style={{ height: '100%' }}
            >
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: theme.palette.common.white,
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  <FormattedMessage id="landing.cta.trainersTitle" />
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    mb: 3,
                    flex: 1
                  }}
                >
                  <FormattedMessage id="landing.cta.trainersDesc" />
                </Typography>
                <AnimateButton>
                  <Button
                    size="large"
                    color="primary"
                    variant="contained"
                    startIcon={<LoginOutlined />}
                    onClick={() => {
                      window.location.href = '/signup';
                    }}
                  >
                    <FormattedMessage id="landing.cta.trainersButton" />
                  </Button>
                </AnimateButton>
              </Box>
            </motion.div>
          </Grid>

          {/* For Corporate L&D & Academies */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 30,
                delay: 0.2
              }}
              style={{ height: '100%' }}
            >
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: theme.palette.common.white,
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  <FormattedMessage id="landing.cta.corporateTitle" />
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    mb: 3,
                    flex: 1
                  }}
                >
                  <FormattedMessage id="landing.cta.corporateDesc" />
                </Typography>
                <AnimateButton>
                  <Button
                    size="large"
                    variant="outlined"
                    startIcon={<PhoneOutlined />}
                    onClick={() => {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <FormattedMessage id="landing.cta.corporateButton" />
                  </Button>
                </AnimateButton>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CallToActionPage;
