// third-party
import { FormattedMessage } from 'react-intl';

// material-ui
import { Box, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import Animation from './Animation';
import { ThemeMode } from 'config';

// ==============================|| LANDING - S.M.A.R.T. DIFFERENTIATOR ||============================== //

const smartItems = [
  { letter: 'S', titleId: 'landing.smart.specific', descId: 'landing.smart.specificDesc' },
  { letter: 'M', titleId: 'landing.smart.measurable', descId: 'landing.smart.measurableDesc' },
  { letter: 'A', titleId: 'landing.smart.achievable', descId: 'landing.smart.achievableDesc' },
  { letter: 'R', titleId: 'landing.smart.relevant', descId: 'landing.smart.relevantDesc' },
  { letter: 'T', titleId: 'landing.smart.timeBound', descId: 'landing.smart.timeBoundDesc' }
];

const SMARTBlock = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: theme.palette.mode === ThemeMode.DARK ? 'grey.0' : 'grey.100'
      }}
    >
      <Container>
        <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
          <Grid item sm={10} md={8}>
            <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
              <FormattedMessage id="landing.smart.subtitle" />
            </Typography>
            <Typography variant="h2" sx={{ mb: 2 }}>
              <FormattedMessage id="landing.smart.title" />
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={4} alignItems="center">
          {/* Left - Quote */}
          <Grid item xs={12} md={6}>
            <Animation
              variants={{
                hidden: { opacity: 0, x: -50 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <Box
                sx={{
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  pl: 3,
                  py: 1,
                  mb: 3
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 500,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    color: theme.palette.text.primary
                  }}
                >
                  &ldquo;<FormattedMessage id="landing.smart.quote" />&rdquo;
                </Typography>
              </Box>
              <Typography variant="body1" color="secondary" sx={{ pl: 3 }}>
                <FormattedMessage id="landing.smart.description" />
              </Typography>
            </Animation>
          </Grid>

          {/* Right - S.M.A.R.T. Breakdown */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {smartItems.map((item, index) => (
                <Animation
                  key={item.letter}
                  variants={{
                    hidden: { opacity: 0, translateX: 50 },
                    visible: { opacity: 1, translateX: 0 }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      p: 2,
                      borderRadius: 2,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: theme.palette.mode === ThemeMode.DARK
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 800,
                        fontSize: '2.5rem',
                        color: theme.palette.primary.main,
                        minWidth: 48,
                        textAlign: 'center',
                        lineHeight: 1
                      }}
                    >
                      {item.letter}
                    </Typography>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.25 }}>
                        <FormattedMessage id={item.titleId} />
                      </Typography>
                      <Typography variant="body2" color="secondary">
                        <FormattedMessage id={item.descId} />
                      </Typography>
                    </Box>
                  </Box>
                </Animation>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SMARTBlock;
