import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Divider, Grid, Menu, MenuItem, Stack, Typography } from '@mui/material';

// project import
import useUser from 'hooks/useUser';
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';

// assets
import { MoreOutlined, BankOutlined } from '@ant-design/icons';

// ==============================|| ORGANIZATION PROFILE ||============================== //

const OrganizationProfile = ({ focusInput }) => {
  const theme = useTheme();
  const { user } = useUser();

  const [anchorEl, setAnchorEl] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [statistics, setStatistics] = useState({ projects: 0, instructors: 0, participants: 0 });
  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization/get-organization');
      if (response.ok) {
        const data = await response.json();
        if (data.organization) {
          setOrganization(data.organization);
          setLogoUrl(data.organization.logo_url);
        }
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <MainCard>
      <Grid container spacing={3} alignItems="center">
        {/* Organization Icon and Info */}
        <Grid item xs={12} md={6}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 2,
                bgcolor: logoUrl ? 'transparent' : theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                border: logoUrl ? `1px solid ${theme.palette.divider}` : 'none',
                overflow: 'hidden'
              }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Organization Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain' 
                  }} 
                />
              ) : (
                <BankOutlined style={{ fontSize: '2.5rem' }} />
              )}
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="h5">{organization?.title || user?.organizationName || 'EDWIND Learning Solutions'}</Typography>
              <Typography color="secondary">
                {organization?.sub_organizations && Array.isArray(organization.sub_organizations) && organization.sub_organizations.length > 0
                  ? organization.sub_organizations[0].title
                  : user?.subOrganizationName || 'Training Division'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 350 }}>
                Sub-organization for managing training programs and educational content delivery.
              </Typography>
            </Stack>
          </Stack>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={5}>
          <Stack direction="row" justifyContent="space-around" alignItems="center">
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{statistics.projects}</Typography>
              <Typography color="secondary">Projects</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{statistics.instructors}</Typography>
              <Typography color="secondary">Instructors</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5">{statistics.participants}</Typography>
              <Typography color="secondary">Participants</Typography>
            </Stack>
          </Stack>
        </Grid>

        {/* Menu Button */}
        <Grid item xs={12} md={1}>
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
              <MenuItem onClick={handleClose}>
                Edit
              </MenuItem>
              <MenuItem onClick={handleClose} disabled>
                Delete
              </MenuItem>
            </Menu>
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
};

OrganizationProfile.propTypes = {
  focusInput: PropTypes.func
};

export default OrganizationProfile;