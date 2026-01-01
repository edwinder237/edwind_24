import { useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box, Divider, Grid, Stack, Typography } from '@mui/material';

// project import
import BackLeft from './UserProfileBackLeft';
import BackRight from './UserProfileBackRight';
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';
import useUser from 'hooks/useUser';

// ==============================|| USER PROFILE - TOP CARD ||============================== //

const ProfileCard = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, fetchProfile } = useUser();

  // Fetch profile on mount to get latest usage data
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainCard border={false} content={false} sx={{ bgcolor: 'primary.lighter', position: 'relative', p: 3 }}>
      <Box sx={{ position: 'absolute', bottom: '-7px', left: 0, zIndex: 1 }}>
        <BackLeft />
      </Box>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 5, py: 1 }}>
        <Grid item xs={12} md={6}>
          <Stack direction="row" spacing={matchDownSM ? 1 : 2} alignItems="center">
            <Avatar
              sx={{
                ml: { xs: 1, sm: 2 },
                width: 80,
                height: 80,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: '2rem',
                fontWeight: 600
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
            <Stack spacing={0.5}>
              <Typography variant="h4">{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="secondary">
                {user?.email || ''}
              </Typography>
              {user?.role && (
                <Typography variant="caption" color="text.secondary">
                  {user.role} {user?.organizationName ? `at ${user.organizationName}` : ''}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5} sx={{ mt: { xs: 2, md: 0 } }}>
          <Stack direction="row" justifyContent="space-around" alignItems="center">
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{user?.usage?.projects || 0}</Typography>
              <Typography color="secondary">Projects</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{user?.usage?.courses || 0}</Typography>
              <Typography color="secondary">Courses</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{user?.usage?.curriculums || 0}</Typography>
              <Typography color="secondary">Curriculums</Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
        <BackRight />
      </Box>
    </MainCard>
  );
};

export default ProfileCard;
