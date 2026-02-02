import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// material-ui
import { Box, Chip, Grid, Stack, Typography, CircularProgress, Tab, Tabs } from '@mui/material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import useUser from 'hooks/useUser';
import MainCard from 'components/MainCard';
import OrganizationProfile from 'sections/apps/organization/OrganizationProfile';
import OrganizationFormTab from 'sections/apps/organization/OrganizationFormTab';
import SubOrganizationsCard from 'sections/apps/organization/SubOrganizationsCard';
import SubscriptionCard from 'sections/apps/organization/SubscriptionCard';
import UsageLimitsCard from 'sections/apps/organization/UsageLimitsCard';

// assets
import {
  LockOutlined,
  SettingOutlined,
  ApartmentOutlined,
  CreditCardOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// ==============================|| TAB PANEL ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-settings-tabpanel-${index}`}
      aria-labelledby={`org-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `org-settings-tab-${index}`,
    'aria-controls': `org-settings-tabpanel-${index}`
  };
}

// ==============================|| ORGANIZATION SETTINGS ||============================== //

// Helper function to check if user has admin role
const isAdmin = (role) => {
  if (!role || typeof role !== 'string') return false;
  const normalizedRole = role.toLowerCase().trim();
  const adminRoles = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];
  return adminRoles.includes(normalizedRole);
};

const TAB_MAP = {
  general: 0,
  'sub-organizations': 1,
  billing: 2,
  usage: 3
};

const OrganizationSettings = () => {
  const inputRef = useRef(null);
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab from URL query parameter
  useEffect(() => {
    const { tab } = router.query;
    if (tab && TAB_MAP[tab] !== undefined) {
      setActiveTab(TAB_MAP[tab]);
    }
  }, [router.query]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Update URL without navigation
    const tabNames = ['general', 'sub-organizations', 'billing', 'usage'];
    router.replace(
      { pathname: router.pathname, query: { tab: tabNames[newValue] } },
      undefined,
      { shallow: true }
    );
  };

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
      <Stack spacing={3}>
        {/* Organization Profile - Always Visible */}
        <OrganizationProfile focusInput={focusInput} />

        {/* Tabbed Content */}
        <MainCard>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5">Settings</Typography>
            <Chip
              label="Admin Only"
              size="small"
              color="error"
              variant="outlined"
              icon={<LockOutlined />}
            />
          </Stack>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="organization settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label="General"
                icon={<SettingOutlined />}
                iconPosition="start"
                {...a11yProps(0)}
              />
              <Tab
                label="Sub-Organizations"
                icon={<ApartmentOutlined />}
                iconPosition="start"
                {...a11yProps(1)}
              />
              <Tab
                label="Subscription & Billing"
                icon={<CreditCardOutlined />}
                iconPosition="start"
                {...a11yProps(2)}
              />
              <Tab
                label="Usage Limits"
                icon={<BarChartOutlined />}
                iconPosition="start"
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>

          {/* General Tab */}
          <TabPanel value={activeTab} index={0}>
            <OrganizationFormTab inputRef={inputRef} />
          </TabPanel>

          {/* Sub-Organizations Tab */}
          <TabPanel value={activeTab} index={1}>
            <SubOrganizationsCard />
          </TabPanel>

          {/* Subscription & Billing Tab */}
          <TabPanel value={activeTab} index={2}>
            <SubscriptionCard />
          </TabPanel>

          {/* Usage Limits Tab */}
          <TabPanel value={activeTab} index={3}>
            <UsageLimitsCard />
          </TabPanel>
        </MainCard>
      </Stack>
    </Page>
  );
};

OrganizationSettings.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default OrganizationSettings;
