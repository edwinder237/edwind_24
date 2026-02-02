// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { Container, Grid, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import MainCard from 'components/MainCard';
import Animation from './Animation';

// icons
import { BookOutlined, ProjectOutlined, BarChartOutlined } from '@ant-design/icons';

// ==============================|| LANDING - FEATURE PAGE ||============================== //

const FeatureBlock = () => {
  const theme = useTheme();

  return (
    <Container id="features">
      <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
        <Grid item xs={12}>
          <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
            <Grid item sm={10} md={6}>
              <Grid container spacing={1} justifyContent="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary">
                    <FormattedMessage id="landing.features.subtitle" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    <FormattedMessage id="landing.features.title" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <FormattedMessage id="landing.features.description" />
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Animation
            variants={{
              hidden: { opacity: 0, translateY: 550 },
              visible: { opacity: 1, translateY: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3 }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      height: 160,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <BookOutlined
                      style={{
                        fontSize: '64px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.features.courseManagement" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.features.courseManagementDesc" />
                  </Typography>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Animation
            variants={{
              hidden: { opacity: 0, translateY: 550 },
              visible: { opacity: 1, translateY: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3 }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      height: 160,
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <ProjectOutlined
                      style={{
                        fontSize: '64px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.features.projectTracking" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.features.projectTrackingDesc" />
                  </Typography>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Animation
            variants={{
              hidden: { opacity: 0, translateY: 550 },
              visible: { opacity: 1, translateY: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3 }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      height: 160,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <BarChartOutlined
                      style={{
                        fontSize: '64px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.features.analyticsReports" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.features.analyticsReportsDesc" />
                  </Typography>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FeatureBlock;
