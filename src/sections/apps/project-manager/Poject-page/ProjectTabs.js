import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import {
  Box,
  Tabs,
  Tab,
  Stack,
  IconButton,
  CircularProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import MainCard from 'components/MainCard';
import { useDispatch, useSelector } from "store";
import { fetchProjectSettings } from "store/reducers/project/settings";
import { useGetProjectAgendaQuery, useGetProjectChecklistQuery } from "store/api/projectApi";
import { selectAllParticipants } from "store/entities/participantsSlice";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Loader from "components/Loader";
// Import from index.js which controls which version to use (Legacy or RTK)
import TabSettings from "./Settings-tab";
import ProjectChecklist from "./Project-Checklist-tab";
import ProjectAssessmentsTab from "./Assessments-tab";
import AgendaTab from "./Agenda-tab";
import getTabIcons from "utils/getTabIcons";
import GroupTable from "./Groups";
import ParticipantsDrawer from "./Participants";

// Dynamic imports

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
  const { children, value, index, isMobile, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: isMobile ? 0 : 3 }}>
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
  styles
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  // Get participants from normalized store
  const participants = useSelector(selectAllParticipants);
  // Get projectId from URL as single source of truth
  const projectId = router.query.id;
  
  // RTK Query automatically fetches and normalizes data when projectId changes
  // The normalized participants are available via selectAllParticipants
  useGetProjectAgendaQuery(projectId, {
    skip: !projectId
  });

  // Fetch checklist data for tab icon display
  const { data: checklistItems = [] } = useGetProjectChecklistQuery(projectId, {
    skip: !projectId
  });
  const [tabValue, setTabValue] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hasLoadedSettingsData, setHasLoadedSettingsData] = React.useState(false);
  const [pulseAnimation, setPulseAnimation] = React.useState(false);

  // Show pulse animation when there are no participants
  React.useEffect(() => {
    if (project && (!participants || participants.length === 0)) {
      setPulseAnimation(true);
      // Stop animation after 5 seconds to avoid being annoying
      const timer = setTimeout(() => setPulseAnimation(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setPulseAnimation(false);
    }
  }, [project, participants]);

  const handleChange = async (_, newValue) => {
    setTabValue(newValue);

    // If switching to Settings tab (index 5), ensure settings data is loaded
    if (newValue === 5 && projectId && !hasLoadedSettingsData) {
      dispatch(fetchProjectSettings(projectId));
      setHasLoadedSettingsData(true);
    }
  };

  const [drawerAction, setDrawerAction] = React.useState(null); // string | null

  const handleOpenDrawer = async (action = null) => {
    setDrawerAction(action); // Pass action to drawer
    setDrawerOpen(true);

    // Data is now fetched automatically via RTK Query when project ID changes
    // No need for manual data fetching - the normalized store is kept in sync

    // Dispatch custom event to check if welcome dialog should be shown
    window.dispatchEvent(new CustomEvent('checkShowWelcomeDialog'));
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerAction(null); // Reset action when closing
  };

  // Listen for custom event to open participants drawer with specific action
  React.useEffect(() => {
    const handleOpenDrawerEvent = (event) => {
      const action = event.detail?.action;
      handleOpenDrawer(action);
    };

    window.addEventListener('openParticipantsDrawer', handleOpenDrawerEvent);
    
    return () => {
      window.removeEventListener('openParticipantsDrawer', handleOpenDrawerEvent);
    };
  }, []);

  // Loading fallback component
  const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading...</Typography>
    </Box>
  );

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
                <FileTextOutlined />
                <span>Assessments</span>
              </Box>
            }
            {...a11yProps(3)}
          />
          <Tab
            label={
              <Box sx={styles.tabLabel}>
                <TeamOutlined />
                <span>Groups</span>
              </Box>
            }
            {...a11yProps(4)}
          />
          <Tab
            label={
              <Box sx={styles.tabLabel}>
                <SettingOutlined />
                <span>Settings</span>
              </Box>
            }
            {...a11yProps(5)}
          />
        </Tabs>

        <IconButton
          onClick={handleOpenDrawer}
          aria-label="participants management"
          sx={{
            ml: 2,
            mr: 1,
            position: 'relative',
            ...(pulseAnimation && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
                  transform: 'scale(1)',
                },
                '50%': {
                  boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
                  transform: 'scale(1.05)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
                  transform: 'scale(1)',
                },
              },
            }),
            ...((!participants || participants.length === 0) && {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }),
          }}
        >
          <TeamOutlined />
          {(!participants || participants.length === 0) && (
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'error.main',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          )}
        </IconButton>

      </Stack>

        <TabPanel value={tabValue} index={0} isMobile={matchDownSM}>
          <AgendaTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1} isMobile={matchDownSM}>
          <Suspense fallback={<LoadingFallback />}>
            <OverviewTab project={project} />
          </Suspense>
        </TabPanel>
        <TabPanel value={tabValue} index={2} isMobile={matchDownSM}>
          <ProjectChecklist
            projectId={projectId ? parseInt(projectId) : null}
            styles={styles}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3} isMobile={matchDownSM}>
          <ProjectAssessmentsTab />
        </TabPanel>
        <TabPanel value={tabValue} index={4} isMobile={matchDownSM}>
          <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
            <GroupTable index={0} />
          </DndProvider>
        </TabPanel>
        <TabPanel value={tabValue} index={5} isMobile={matchDownSM}>
          <TabSettings project={project} />
        </TabPanel>
      </Box>

      {/* Bottom Drawer for Participants Management */}
      <ParticipantsDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        {...(drawerAction && { initialAction: drawerAction })}
      />
    </MainCard>
  );
};

ProjectTabs.propTypes = {
  project: PropTypes.object.isRequired,
  checklistItems: PropTypes.array.isRequired,
  checklistLoading: PropTypes.bool.isRequired,
  onChecklistToggle: PropTypes.func.isRequired,
  onChecklistNoteUpdate: PropTypes.func.isRequired,
  onChecklistRefresh: PropTypes.func.isRequired,
  updatingItems: PropTypes.instanceOf(Set).isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectTabs;