import React, { Suspense } from 'react';
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
  Card,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import MainCard from 'components/MainCard';
import { useDispatch } from "store";
import { getParticipants, getGroupsDetails } from "store/reducers/projects";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  ExperimentOutlined,
  UserOutlined,
  CloseOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import Loader from "components/Loader";
import TabSettings from "./Settings-tab/TabSettings";
import ProjectChecklist from "./ProjectChecklist";
import AgendaTab from "./Agenda-tab";
import getTabIcons from "utils/getTabIcons";
import GroupTable from "./Enrolment-tab/Groups";

// Dynamic imports
const EnrolmentTAB = dynamic(() =>
  import("sections/apps/project-manager/Poject-page/Enrolment-tab").catch(
    (err) => console.error(err)
  )
);

// Lazy load the Participants table for better performance
const ParticipantTable = dynamic(() => import("./Enrolment-tab/ParticipantsTable").catch(
  (err) => console.error(err)
));

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
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [participantTabValue, setParticipantTabValue] = React.useState(0);
  const [hasLoadedParticipantsData, setHasLoadedParticipantsData] = React.useState(false);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDrawer = async () => {
    setDrawerOpen(true);
    
    // Fetch participants data only once when drawer is first opened
    if (!hasLoadedParticipantsData && project?.id) {
      await Promise.all([
        dispatch(getParticipants(project.id)),
        dispatch(getGroupsDetails(project.id))
      ]);
      setHasLoadedParticipantsData(true);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleParticipantTabChange = (event, newValue) => {
    setParticipantTabValue(newValue);
  };

  // Loading fallback component
  const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading...</Typography>
    </Box>
  );

  // Tab Panel Component for drawer
  function DrawerTabPanel({ children, value, index, ...other }) {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`drawer-tabpanel-${index}`}
        aria-labelledby={`drawer-tab-${index}`}
        style={{ 
          flex: 1, 
          display: value === index ? 'flex' : 'none',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
        {...other}
      >
        {children}
      </div>
    );
  }

  return (
    <MainCard
      content={false}
      border={false}
      boxShadow
      sx={{
        borderRadius: 0,
        width: '100%'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: '48px',
            width: '100%'
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
                <DashboardOutlined />
                <span>Overview</span>
              </Box>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <CalendarOutlined />
                <span>Agenda</span>
              </Box>
            }
            {...a11yProps(1)} 
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
            {...a11yProps(2)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <SettingOutlined />
                <span>Settings</span>
              </Box>
            }
            {...a11yProps(3)} 
          />
        </Tabs>

        <IconButton
          onClick={handleOpenDrawer}
          sx={{
            ml: 2,
            mr: 1,
          }}
        >
          <TeamOutlined />
        </IconButton>

      </Stack>

        <TabPanel value={tabValue} index={0}>
          <Suspense fallback={<LoadingFallback />}>
            <OverviewTab project={project} />
          </Suspense>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AgendaTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ProjectChecklist 
            checklistItems={checklistItems}
            checklistLoading={checklistLoading}
            onToggleItem={onChecklistToggle}
            styles={styles}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <TabSettings />
        </TabPanel>
      </Box>

      {/* Bottom Drawer for Manage Participants */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            height: '80vh',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <MainCard
          title={
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="h5" fontWeight="600">
                Manage Participants
              </Typography>
              <IconButton onClick={handleCloseDrawer} size="large">
                <CloseOutlined />
              </IconButton>
            </Stack>
          }
          content={false}
          border={false}
          boxShadow={false}
          sx={{ 
            flex: 1,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            '& .MuiCardHeader-root': {
              pb: 2,
              flexShrink: 0
            },
            '& .MuiCardContent-root': {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tabs 
                value={participantTabValue} 
                onChange={handleParticipantTabChange} 
                aria-label="participants management tabs"
                sx={{ px: 2 }}
              >
                <Tab 
                  label="Groups" 
                  icon={<TeamOutlined />} 
                  iconPosition="start"
                  id="drawer-tab-0"
                  aria-controls="drawer-tabpanel-0"
                />
                <Tab 
                  label="Participants" 
                  icon={<UserOutlined />} 
                  iconPosition="start"
                  id="drawer-tab-1"
                  aria-controls="drawer-tabpanel-1"
                />
              </Tabs>
            </Box>
            
            <DrawerTabPanel value={participantTabValue} index={0}>
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
                <GroupTable index={0} />
              </Box>
            </DrawerTabPanel>
            
            <DrawerTabPanel value={participantTabValue} index={1}>
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
                <Suspense fallback={<LoadingFallback />}>
                  <ParticipantTable index={0} />
                </Suspense>
              </Box>
            </DrawerTabPanel>
          </Box>
        </MainCard>
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