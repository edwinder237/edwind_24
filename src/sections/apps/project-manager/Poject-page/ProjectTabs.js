import React from 'react';
import PropTypes from 'prop-types';
import dynamic from "next/dynamic";
import {
  Box,
  Grid,
  Tabs,
  Tab,
  Button,
  Stack,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from 'components/MainCard';
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  ExperimentOutlined,
  UserOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Loader from "components/Loader";
import TabSettings from "./Settings-tab/TabSettings";
import ProjectChecklist from "./ProjectChecklist";
import AgendaTab from "./Agenda-tab";
import getTabIcons from "utils/getTabIcons";

// Dynamic imports
const EnrolmentTAB = dynamic(() =>
  import("sections/apps/project-manager/Poject-page/Enrolment-tab").catch(
    (err) => console.error(err)
  )
);

const OverviewTab = dynamic(() =>
  import("./Overview-tab").catch(
    (err) => console.error(err)
  ),
  {
    ssr: false,
    loading: () => <Loader />
  }
);

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

// ==============================|| PROJECT TABS ||============================== //

const ProjectTabs = ({ 
  project,
  checklistItems,
  checklistLoading,
  onChecklistToggle,
  styles
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <MainCard
      content={false}
      border={false}
      boxShadow
      sx={{
        borderRadius: 0
      }}
    >
      <Grid item xs={12}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: '48px'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            aria-label="navigation tabs"
            sx={{ flex: 1 }}
          >
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <CalendarOutlined />
                <span>Agenda</span>
              </Box>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <DashboardOutlined />
                <span>Overview</span>
              </Box>
            }
            {...a11yProps(1)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <TeamOutlined />
                <span>Enrollment</span>
              </Box>
            }
            {...a11yProps(2)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <CheckSquareOutlined />
                <span>Checklist</span>
                {checklistItems.length > 0 && getTabIcons(
                  checklistItems.length > 0 && 
                  checklistItems.every(item => item.completed)
                )}
              </Box>
            }
            {...a11yProps(3)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <SettingOutlined />
                <span>Settings</span>
              </Box>
            }
            {...a11yProps(4)} 
          />
        </Tabs>

        <Button
          variant="contained"
          color="primary"
          startIcon={<UserOutlined />}
          onClick={handleOpenDrawer}
          sx={{
            ml: 2,
            mr: 1,
            whiteSpace: 'nowrap',
            minWidth: 'auto',
            borderRadius: 0
          }}
        >
          Manage Participants
        </Button>
      </Stack>

        <TabPanel value={tabValue} index={0}>
          <AgendaTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <OverviewTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <EnrolmentTAB index={0} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ProjectChecklist 
            checklistItems={checklistItems}
            checklistLoading={checklistLoading}
            onToggleItem={onChecklistToggle}
            styles={styles}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <TabSettings />
        </TabPanel>
      </Grid>

      {/* Bottom Drawer for Manage Participants */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            height: '70vh',
            borderRadius: 0,
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="600">
              Manage Participants
            </Typography>
            <IconButton onClick={handleCloseDrawer} size="large">
              <CloseOutlined />
            </IconButton>
          </Stack>
          
          {/* Placeholder content */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            color: 'text.secondary' 
          }}>
            <Typography variant="h6">
              Participants management content will go here
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </MainCard>
  );
};

ProjectTabs.propTypes = {
  project: PropTypes.object.isRequired,
  checklistItems: PropTypes.array.isRequired,
  checklistLoading: PropTypes.bool.isRequired,
  onChecklistToggle: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectTabs;