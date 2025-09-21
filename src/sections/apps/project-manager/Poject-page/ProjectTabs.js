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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import MainCard from 'components/MainCard';
import { useDispatch, useSelector } from "store";
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
  checklistItems,
  checklistLoading,
  onChecklistToggle,
  onChecklistNoteUpdate,
  onChecklistRefresh,
  updatingItems,
  styles
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { project_participants } = useSelector((state) => state.projects);
  const [tabValue, setTabValue] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hasLoadedParticipantsData, setHasLoadedParticipantsData] = React.useState(false);
  const [pulseAnimation, setPulseAnimation] = React.useState(false);
  
  // Show pulse animation when there are no participants
  React.useEffect(() => {
    if (project && (!project_participants || project_participants.length === 0)) {
      setPulseAnimation(true);
      // Stop animation after 5 seconds to avoid being annoying
      const timer = setTimeout(() => setPulseAnimation(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setPulseAnimation(false);
    }
  }, [project, project_participants]);

  const handleChange = async (event, newValue) => {
    setTabValue(newValue);
    
    // If switching to Groups tab (index 3), ensure data is loaded
    if (newValue === 3 && project?.id && !hasLoadedParticipantsData) {
      await Promise.all([
        dispatch(getParticipants(project.id)),
        dispatch(getGroupsDetails(project.id))
      ]);
      setHasLoadedParticipantsData(true);
    }
  };

  const handleOpenDrawer = async (action = null) => {
    setDrawerOpen(true);
    
    // Fetch participants data only once when drawer is first opened
    if (!hasLoadedParticipantsData && project?.id) {
      await Promise.all([
        dispatch(getParticipants(project.id)),
        dispatch(getGroupsDetails(project.id))
      ]);
      setHasLoadedParticipantsData(true);
    }
    
    // Dispatch custom event to check if welcome dialog should be shown
    window.dispatchEvent(new CustomEvent('checkShowWelcomeDialog'));
    
    // If action is specified, trigger the corresponding button after a delay
    if (action) {
      setTimeout(() => {
        if (action === 'addManually') {
          const addButton = document.querySelector('[aria-label="add-participant"]');
          if (addButton) addButton.click();
        } else if (action === 'importCSV') {
          const importButton = document.querySelector('[aria-label="import-csv"]');
          if (importButton) importButton.click();
        }
      }, 500);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
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
                <TeamOutlined />
                <span>Groups</span>
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
            ...((!project_participants || project_participants.length === 0) && {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }),
          }}
        >
          <TeamOutlined />
          {(!project_participants || project_participants.length === 0) && (
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
            checklistItems={checklistItems}
            checklistLoading={checklistLoading}
            onToggleItem={onChecklistToggle}
            onUpdateNote={onChecklistNoteUpdate}
            onRefreshChecklist={onChecklistRefresh}
            updatingItems={updatingItems}
            styles={styles}
            projectId={project.id}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3} isMobile={matchDownSM}>
          <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
            <GroupTable index={0} />
          </DndProvider>
        </TabPanel>
        <TabPanel value={tabValue} index={4} isMobile={matchDownSM}>
          <TabSettings />
        </TabPanel>
      </Box>

      {/* Bottom Drawer for Participants Management */}
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
  onChecklistNoteUpdate: PropTypes.func.isRequired,
  onChecklistRefresh: PropTypes.func.isRequired,
  updatingItems: PropTypes.instanceOf(Set).isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectTabs;