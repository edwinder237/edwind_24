import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Chip, CircularProgress, Divider, Grid, Skeleton, Stack, Typography } from '@mui/material';

// project import
import useUser from 'hooks/useUser';
import MainCard from 'components/MainCard';

// assets
import { BankOutlined, CrownOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';

// ==============================|| ORGANIZATION PROFILE ||============================== //

const OrganizationProfile = ({ focusInput }) => {
  const theme = useTheme();
  const { user } = useUser();

  const [organization, setOrganization] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [statistics, setStatistics] = useState({ projects: 0, instructors: 0, participants: 0 });
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchOrganization(), fetchSubscription()]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Listen for subscription updates from SubscriptionCard
    const handleSubscriptionUpdate = () => {
      fetchSubscription();
    };
    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
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

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      // Non-admin users will get 403, which is expected
      console.log('Subscription not available (may require admin access)');
    }
  };

  // Loading skeleton UI
  if (isLoading) {
    return (
      <MainCard>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Skeleton variant="rounded" width={100} height={100} />
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="text" width={150} height={24} />
                <Skeleton variant="text" width={300} height={20} />
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" justifyContent="space-around" alignItems="center">
              <Stack spacing={0.5} alignItems="center">
                <Skeleton variant="text" width={40} height={32} />
                <Skeleton variant="text" width={60} height={20} />
              </Stack>
              <Divider orientation="vertical" flexItem />
              <Stack spacing={0.5} alignItems="center">
                <Skeleton variant="text" width={40} height={32} />
                <Skeleton variant="text" width={70} height={20} />
              </Stack>
              <Divider orientation="vertical" flexItem />
              <Stack spacing={0.5} alignItems="center">
                <Skeleton variant="text" width={40} height={32} />
                <Skeleton variant="text" width={80} height={20} />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>
    );
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'enterprise':
        return <CrownOutlined />;
      case 'professional':
        return <StarOutlined />;
      case 'essential':
      default:
        return <RocketOutlined />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'enterprise':
        return 'success';
      case 'professional':
        return 'primary';
      case 'essential':
      default:
        return 'default';
    }
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
        <Grid item xs={12} md={6}>
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
            {subscription && (
              <>
                <Divider orientation="vertical" flexItem />
                <Stack spacing={0.5} alignItems="center">
                  <Chip
                    icon={getPlanIcon(subscription.planId)}
                    label={subscription.plan?.name || subscription.planId}
                    color={getPlanColor(subscription.planId)}
                    size="small"
                  />
                  <Typography color="secondary">Plan</Typography>
                </Stack>
              </>
            )}
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