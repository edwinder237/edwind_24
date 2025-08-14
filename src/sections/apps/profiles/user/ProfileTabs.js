import PropTypes from 'prop-types';
import React, { useState } from 'react';

// next
import NextLink from 'next/link';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Divider, Grid, Menu, MenuItem, Stack, Typography } from '@mui/material';

// project import
import useUser from 'hooks/useUser';
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import ProfileTab from './ProfileTab';
// assets
import { MoreOutlined } from '@ant-design/icons';

// ==============================|| USER PROFILE - TAB CONTENT ||============================== //

const ProfileTabs = ({ focusInput }) => {
  const theme = useTheme();
  const user = useUser();

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

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <MainCard>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end">
            <IconButton
              variant="light"
              color="secondary"
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <MoreOutlined />
            </IconButton>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button'
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <NextLink href="/apps/profiles/user/personal" passHref>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    setTimeout(() => {
                      focusInput();
                    });
                  }}
                >
                  Edit
                </MenuItem>
              </NextLink>
              <MenuItem onClick={handleClose} disabled>
                Delete
              </MenuItem>
            </Menu>
          </Stack>
          <Stack spacing={2.5} alignItems="center">
            {user && (
              <Avatar 
                sx={{ 
                  width: 124, 
                  height: 124, 
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: '3rem',
                  fontWeight: 600
                }}
              >
                {getInitials(user.name)}
              </Avatar>
            )}
            {user && (
              <Stack spacing={0.5} alignItems="center">
                <Typography variant="h5">{user.name}</Typography>
                <Typography color="secondary">{user.role}</Typography>
                {user.organizationName && (
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', textAlign: 'center' }}>
                    {user.organizationName}
                  </Typography>
                )}
                {user.subOrganizationName && (
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center' }}>
                    {user.subOrganizationName}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Grid>
        <Grid item sm={3} sx={{ display: { sm: 'block', md: 'none' } }} />
        <Grid item xs={12} sm={6} md={12}>
          <Stack direction="row" justifyContent="space-around" alignItems="center">
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">86</Typography>
              <Typography color="secondary">Post</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">40</Typography>
              <Typography color="secondary">Project</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">4.5K</Typography>
              <Typography color="secondary">Members</Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <ProfileTab />
        </Grid>
      </Grid>
    </MainCard>
  );
};

ProfileTabs.propTypes = {
  focusInput: PropTypes.func
};

export default ProfileTabs;
