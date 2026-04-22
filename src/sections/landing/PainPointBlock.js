// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { Container, Grid, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import MainCard from 'components/MainCard';
import Animation from './Animation';

// icons
import { TeamOutlined, SwapOutlined, KeyOutlined, AimOutlined } from '@ant-design/icons';

// ==============================|| LANDING - PAIN POINTS ||============================== //

const painPoints = [
  {
    icon: TeamOutlined,
    titleId: 'landing.painpoints.logistics',
    descId: 'landing.painpoints.logisticsDesc'
  },
  {
    icon: SwapOutlined,
    titleId: 'landing.painpoints.transfers',
    descId: 'landing.painpoints.transfersDesc'
  },
  {
    icon: KeyOutlined,
    titleId: 'landing.painpoints.provisioning',
    descId: 'landing.painpoints.provisioningDesc'
  },
  {
    icon: AimOutlined,
    titleId: 'landing.painpoints.curriculum',
    descId: 'landing.painpoints.curriculumDesc'
  }
];

const PainPointBlock = () => {
  const theme = useTheme();

  return (
    <Container id="why-edbahn" sx={{ py: { xs: 6, md: 10 } }}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12}>
          <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
            <Grid item sm={10} md={6}>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
                <FormattedMessage id="landing.painpoints.subtitle" />
              </Typography>
              <Typography variant="h2" sx={{ mb: 2 }}>
                <FormattedMessage id="landing.painpoints.title" />
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        {painPoints.map((point, index) => {
          const Icon = point.icon;
          return (
            <Grid item xs={12} sm={6} md={6} key={index}>
              <Animation
                variants={{
                  hidden: { opacity: 0, translateY: 50 },
                  visible: { opacity: 1, translateY: 0 }
                }}
              >
                <MainCard
                  contentSX={{ p: 3 }}
                  sx={{
                    height: '100%',
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.primary.lighter,
                        flexShrink: 0
                      }}
                    >
                      <Icon style={{ fontSize: '24px', color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        <FormattedMessage id={point.titleId} />
                      </Typography>
                      <Typography variant="body1" color="secondary">
                        <FormattedMessage id={point.descId} />
                      </Typography>
                    </Box>
                  </Box>
                </MainCard>
              </Animation>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default PainPointBlock;
