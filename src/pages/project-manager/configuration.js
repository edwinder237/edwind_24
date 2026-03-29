import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// material-ui
import { Box, Tab, Tabs } from '@mui/material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import TopicsTab from 'sections/apps/project-manager/resources/TopicsTab';
import ParticipantRolesTab from 'sections/apps/project-manager/resources/ParticipantRolesTab';
import ToolTemplatesTab from 'sections/apps/project-manager/resources/ToolTemplatesTab';
import RoomsTab from 'sections/apps/project-manager/resources/RoomsTab';

// assets
import { TagOutlined, UserSwitchOutlined, ToolOutlined, HomeOutlined } from '@ant-design/icons';

// ==============================|| TAB PANEL ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `config-tab-${index}`,
    'aria-controls': `config-tabpanel-${index}`
  };
}

// ==============================|| CONFIGURATION ||============================== //

const TAB_MAP = {
  topics: 0,
  'participant-roles': 1,
  'tool-templates': 2,
  rooms: 3
};

const TAB_NAMES = ['topics', 'participant-roles', 'tool-templates', 'rooms'];

const Configuration = () => {
  const router = useRouter();
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
    router.replace(
      { pathname: router.pathname, query: { tab: TAB_NAMES[newValue] } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Page title="Configuration">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="configuration tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Topics"
            icon={<TagOutlined />}
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            label="Participant Roles"
            icon={<UserSwitchOutlined />}
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            label="Tool Templates"
            icon={<ToolOutlined />}
            iconPosition="start"
            {...a11yProps(2)}
          />
          <Tab
            label="Rooms"
            icon={<HomeOutlined />}
            iconPosition="start"
            {...a11yProps(3)}
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <TopicsTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <ParticipantRolesTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <ToolTemplatesTab />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <RoomsTab />
      </TabPanel>
    </Page>
  );
};

Configuration.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Configuration;
