// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Container, Grid, Typography } from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import Animation from './Animation';

// assets
import { TeamOutlined, BookOutlined, DashboardOutlined } from '@ant-design/icons';

// ==============================|| LANDING - DEMO PAGE ||============================== //

const DemoBlock = () => {
  const theme = useTheme();

  return (
    <Container id="demo">
      <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
        <Grid item xs={12}>
          <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
            <Grid item sm={10} md={6}>
              <Grid container spacing={1} justifyContent="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary">
                    <FormattedMessage id="landing.demo.subtitle" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    <FormattedMessage id="landing.demo.title" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <FormattedMessage id="landing.demo.description" />
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={4} md={4}>
          <Animation
            variants={{
              visible: { opacity: 1 },
              hidden: { opacity: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.demo.courseManagement" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.demo.courseManagementDesc" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <BookOutlined style={{ fontSize: '20px', color: '#1976d2', marginRight: '8px' }} />
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                      <FormattedMessage id="landing.demo.courseCreationTools" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.moduleCurriculum" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.interactiveContent" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.progressAssessment" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.certificationManagement" />
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Animation
            variants={{
              visible: { opacity: 1 },
              hidden: { opacity: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3, background: theme.palette.primary.lighter }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.demo.projectManagement" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.demo.projectManagementDesc" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <DashboardOutlined style={{ fontSize: '20px', color: '#1976d2', marginRight: '8px' }} />
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                      <FormattedMessage id="landing.demo.advancedDashboard" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.realtimeDashboard" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.enrollmentTracking" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.scheduleIntegration" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.groupManagement" />
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Animation
            variants={{
              visible: { opacity: 1 },
              hidden: { opacity: 0 }
            }}
          >
            <MainCard contentSX={{ p: 3 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 2 }}>
                    <FormattedMessage id="landing.demo.participantTracking" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="secondary">
                    <FormattedMessage id="landing.demo.participantTrackingDesc" />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TeamOutlined style={{ fontSize: '20px', color: '#1976d2', marginRight: '8px' }} />
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                      <FormattedMessage id="landing.demo.realtimeProgress" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.individualProgress" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.attendanceTracking" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.performanceAnalytics" />
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      • <FormattedMessage id="landing.demo.certificationStatus" />
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </MainCard>
          </Animation>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DemoBlock;
