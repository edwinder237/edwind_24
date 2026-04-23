// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { Container, Grid, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import MainCard from 'components/MainCard';
import Animation from './Animation';

// icons
import {
  ScheduleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  MailOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// ==============================|| LANDING - FEATURE PAGE ||============================== //

const features = [
  {
    icon: ScheduleOutlined,
    titleId: 'landing.features.smartScheduling',
    descId: 'landing.features.smartSchedulingDesc',
    gradient: 'primary'
  },
  {
    icon: SafetyOutlined,
    titleId: 'landing.features.attendance',
    descId: 'landing.features.attendanceDesc',
    gradient: 'secondary'
  },
  {
    icon: ThunderboltOutlined,
    titleId: 'landing.features.ai',
    descId: 'landing.features.aiDesc',
    chipId: 'landing.features.aiChip',
    gradient: 'warning'
  },
  {
    icon: ClockCircleOutlined,
    titleId: 'landing.features.timeline',
    descId: 'landing.features.timelineDesc',
    chipId: 'landing.features.timelineChip',
    comingSoon: true,
    gradient: 'info'
  },
  {
    icon: MailOutlined,
    titleId: 'landing.features.communications',
    descId: 'landing.features.communicationsDesc',
    gradient: 'success'
  },
  {
    icon: BarChartOutlined,
    titleId: 'landing.features.analytics',
    descId: 'landing.features.analyticsDesc',
    gradient: 'error'
  }
];

const FeatureBlock = () => {
  const theme = useTheme();

  const getGradient = (type) => {
    const colors = {
      primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
      warning: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
      info: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
      success: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
      error: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
    };
    return colors[type] || colors.primary;
  };

  return (
    <Container id="features">
      <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
        <Grid item xs={12}>
          <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
            <Grid item sm={10} md={6}>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
                <FormattedMessage id="landing.features.subtitle" />
              </Typography>
              <Typography variant="h2" sx={{ mb: 2 }}>
                <FormattedMessage id="landing.features.title" />
              </Typography>
              <Typography variant="body1">
                <FormattedMessage id="landing.features.description" />
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Animation
                variants={{
                  hidden: { opacity: 0, translateY: 550 },
                  visible: { opacity: 1, translateY: 0 }
                }}
              >
                <MainCard contentSX={{ p: 3 }} sx={{ height: '100%' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          height: 140,
                          background: getGradient(feature.gradient),
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Icon
                          style={{
                            fontSize: '56px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -25,
                            left: -25,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)'
                          }}
                        />
                        {feature.chipId && (
                          <Chip
                            label={<FormattedMessage id={feature.chipId} />}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              bgcolor: feature.comingSoon ? 'rgba(255,152,0,0.85)' : 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mt: 2 }}>
                        <FormattedMessage id={feature.titleId} />
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1" color="secondary">
                        <FormattedMessage id={feature.descId} />
                      </Typography>
                    </Grid>
                  </Grid>
                </MainCard>
              </Animation>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default FeatureBlock;
