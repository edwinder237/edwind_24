import PropTypes from 'prop-types';

// next
import NextLink from 'next/link';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box, Button, Grid, Stack, Typography } from '@mui/material';

// assets
import { SettingOutlined } from '@ant-design/icons';

// project import
import BackLeft from '../apps/profiles/user/UserProfileBackLeft';
import BackRight from '../apps/profiles/user/UserProfileBackRight';
import MainCard from 'components/MainCard';

// ==============================|| ORGANIZATION SETTINGS - TOP CARD ||============================== //

const OrganizationCard = ({ focusInput }) => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <MainCard border={false} content={false} sx={{ bgcolor: 'primary.lighter', position: 'relative' }}>
      <Box sx={{ position: 'absolute', bottom: '-7px', left: 0, zIndex: 1 }}>
        <BackLeft />
      </Box>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 5 }}>
        <Grid item>
          <Stack direction="row" spacing={matchDownSM ? 1 : 2} alignItems="center">
            <Box sx={{ ml: { xs: 0, sm: 1 } }}>
              {/* Organization Icon */}
              <Box
                sx={{
                  width: 136,
                  height: 136,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <SettingOutlined style={{ fontSize: '4rem' }} />
              </Box>
            </Box>
            <Stack spacing={0.75}>
              <Typography variant="h5">Organization Settings</Typography>
              <Typography variant="body2" color="secondary">
                Manage your sub-organization settings and information
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid item sx={{ mx: matchDownSM ? 2 : 3, my: matchDownSM ? 1 : 0, mb: matchDownSM ? 2 : 0 }} xs={matchDownSM ? 12 : 'auto'}>
          <Button variant="contained" fullWidth={matchDownSM} onClick={focusInput}>
            Edit Settings
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
        <BackRight />
      </Box>
    </MainCard>
  );
};

OrganizationCard.propTypes = {
  focusInput: PropTypes.func
};

export default OrganizationCard;