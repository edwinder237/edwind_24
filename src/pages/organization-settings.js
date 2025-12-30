import { useRef } from 'react';
import { useRouter } from 'next/router';

// material-ui
import { Box, Chip, Grid, Stack, Typography, CircularProgress } from '@mui/material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import useUser from 'hooks/useUser';
import MainCard from 'components/MainCard';
import OrganizationProfile from 'sections/apps/organization/OrganizationProfile';
import OrganizationFormTab from 'sections/apps/organization/OrganizationFormTab';
import SubOrganizationsCard from 'sections/apps/organization/SubOrganizationsCard';
import SubscriptionCard from 'sections/apps/organization/SubscriptionCard';

// assets
import { LockOutlined } from '@ant-design/icons';

// ==============================|| ORGANIZATION SETTINGS ||============================== //

// Helper function to check if user has admin role
const isAdmin = (role) => {
  if (!role || typeof role !== 'string') return false;
  const normalizedRole = role.toLowerCase().trim();
  const adminRoles = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];
  return adminRoles.includes(normalizedRole);
};

const OrganizationSettings = () => {
  const inputRef = useRef(null);
  const router = useRouter();
  const { user, isLoading } = useUser();

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Page title="Organization Settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Check if user has admin role
  const userRole = user?.role;
  const hasAdminAccess = isAdmin(userRole);

  // If not admin, show access denied
  if (!hasAdminAccess) {
    return (
      <Page title="Organization Settings">
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LockOutlined style={{ fontSize: '4rem', color: '#8c8c8c', marginBottom: 16 }} />
            <Typography variant="h4" gutterBottom>
              Access Denied
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              You need administrator privileges to access organization settings.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Contact your organization administrator if you need access.
            </Typography>
          </Box>
        </MainCard>
      </Page>
    );
  }

  return (
    <Page title="Organization Settings">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Chip
              label="Admin Only"
              size="small"
              color="error"
              variant="outlined"
              icon={<LockOutlined />}
            />
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <OrganizationProfile focusInput={focusInput} />
        </Grid>
        <Grid item xs={12}>
          <OrganizationFormTab inputRef={inputRef} />
        </Grid>
        <Grid item xs={12}>
          <SubOrganizationsCard />
        </Grid>
        <Grid item xs={12}>
          <SubscriptionCard />
        </Grid>
      </Grid>
    </Page>
  );
};

OrganizationSettings.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default OrganizationSettings;