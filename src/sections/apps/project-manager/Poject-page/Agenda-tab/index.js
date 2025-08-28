import React, { useMemo } from 'react';
import { Box, Grid, ToggleButton, ToggleButtonGroup, Stack, useTheme, alpha, Button, Dialog, Typography } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { getSingleProject } from 'store/reducers/projects';
import { ViewList, CalendarMonth, DateRange, Add } from '@mui/icons-material';

// Components
import MainCard from 'components/MainCard';
import ItinerarySchedule from './ItinerarySchedule';
import EventDetailsSection from './EventDetailsSection';
import FullCalendarMonthView from './FullCalendarMonthView';
import FullCalendarWeekView from './FullCalendarWeekView';
import ScheduleExport from './components/ScheduleExport';
import ImportOptionsDialog from './components/ImportOptionsDialog';
import AddEventDialog from './AddEventDialog';

// Hooks and utilities
import { useAgendaState } from './hooks/useAgendaState';
import { useEventOperations } from './hooks/useEventOperations';
import { VIEW_MODES, SCROLL_STYLES } from './utils/constants';

// Memoized components for better performance
const MemoizedItinerarySchedule = React.memo(ItinerarySchedule);
const MemoizedEventDetailsSection = React.memo(EventDetailsSection);
const MemoizedFullCalendarMonthView = React.memo(FullCalendarMonthView);
const MemoizedFullCalendarWeekView = React.memo(FullCalendarWeekView);

// ==============================|| AGENDA TAB - ITINERARY SCHEDULE ||============================== //

const AgendaTab = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { singleProject: project } = useSelector((state) => state.projects);
  
  // Local state for import dialog
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importLoading, setImportLoading] = React.useState(false);
  
  // Local state for add event dialog
  const [addEventDialogOpen, setAddEventDialogOpen] = React.useState(false);
  
  // State for available roles and training plans
  const [availableRoles, setAvailableRoles] = React.useState([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [availableTrainingPlans, setAvailableTrainingPlans] = React.useState([]);
  const [trainingPlansLoading, setTrainingPlansLoading] = React.useState(false);
  
  // Custom hooks for state and operations
  const {
    selectedDate,
    selectedEventId,
    viewMode,
    viewScheduleOpen,
    handleEventSelect,
    handleViewModeChange,
    openViewSchedule,
    closeViewSchedule
  } = useAgendaState();

  const { importCurriculumSchedule } = useEventOperations(project?.id);

  // Fetch available roles and training plans when project changes
  React.useEffect(() => {
    const fetchProjectData = async () => {
      if (!project?.id) return;
      
      // Fetch available roles
      setRolesLoading(true);
      try {
        const rolesResponse = await fetch(`/api/projects/available-roles?projectId=${project.id}`);
        const rolesData = await rolesResponse.json();
        
        if (rolesData.success) {
          setAvailableRoles(rolesData.roles);
        } else {
          console.error('Failed to fetch available roles:', rolesData.error);
        }
      } catch (error) {
        console.error('Error fetching available roles:', error);
      } finally {
        setRolesLoading(false);
      }
      
      // Fetch available training plans
      setTrainingPlansLoading(true);
      try {
        const plansResponse = await fetch(`/api/training-plans/fetch-for-project?projectId=${project.id}`);
        const plansData = await plansResponse.json();
        
        if (plansData.success) {
          setAvailableTrainingPlans(plansData.trainingPlans);
        } else {
          console.error('Failed to fetch training plans:', plansData.error);
        }
      } catch (error) {
        console.error('Error fetching training plans:', error);
      } finally {
        setTrainingPlansLoading(false);
      }
    };

    fetchProjectData();
  }, [project?.id]);

  // Handle opening import dialog
  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  // Handle closing import dialog
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
  };

  // Handle opening add event dialog
  const handleOpenAddEventDialog = () => {
    setAddEventDialogOpen(true);
  };

  // Handle closing add event dialog
  const handleCloseAddEventDialog = () => {
    setAddEventDialogOpen(false);
  };

  // Handle event creation completion
  const handleEventCreated = async () => {
    // Refresh the project data to show new event
    if (project?.id) {
      await dispatch(getSingleProject(project.id));
      console.log('Project data refreshed after event creation');
    }
    setAddEventDialogOpen(false);
  };

  // Handle import completion (called from dialog when import finishes)
  const handleImportCompletion = async (result) => {
    if (result.success) {
      console.log(`Import completed: ${result.events?.length || 0} events created`);
      if (result.warnings > 0) {
        console.warn(`Import completed with ${result.warnings} warnings`);
      }
      // Refresh the project data to show new events
      if (project?.id) {
        await dispatch(getSingleProject(project.id));
        console.log('Project data refreshed after import');
      }
    }
  };

  // Memoized styles
  const styles = useMemo(() => ({
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    actionStack: {
      direction: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      spacing: 1,
      sx: { mb: 2 }
    },
    mainCard: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      '& .MuiCardContent-root': {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 0
      }
    },
    viewContainer: {
      flex: 1,
      p: 2
    },
    scrollableBox: {
      height: 'calc(100vh - 320px)',
      overflow: 'auto',
      ...SCROLL_STYLES
    },
    fullViewBox: {
      flex: 1,
      overflow: 'hidden',
      ...SCROLL_STYLES
    }
  }), []);

  // Memoized toggle button styles
  const toggleButtonStyles = useMemo(() => ({
    '& .MuiToggleButton-root': {
      px: 2,
      py: 0.75,
      border: `1px solid ${alpha(theme.palette.divider, 0.23)}`,
      borderRadius: 0,
      color: theme.palette.text.secondary,
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none',
      minWidth: '80px',
      height: 36,
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.04),
        color: theme.palette.text.primary
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderColor: theme.palette.primary.main,
        fontWeight: 600,
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }
      }
    },
    '& .MuiToggleButtonGroup-grouped': {
      '&:not(:first-of-type)': {
        borderLeft: 'none',
        marginLeft: '-1px'
      },
      '&:first-of-type, &:last-of-type': {
        borderRadius: 0
      }
    }
  }), [theme]);

  // Button styles
  const buttonStyles = useMemo(() => ({
    common: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.75rem',
      px: 1.5,
      py: 0.5,
      minWidth: 'auto',
      borderRadius: 0
    },
    outlined: {
      color: theme.palette.text.primary,
      borderColor: alpha(theme.palette.divider, 0.23),
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        color: theme.palette.primary.main
      }
    },
    contained: {
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none'
      }
    }
  }), [theme]);

  // Header content - view toggle buttons
  const headerContent = useMemo(() => (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewModeChange}
      size="small"
      sx={toggleButtonStyles}
    >
      <ToggleButton value={VIEW_MODES.AGENDA}>
        <ViewList sx={{ mr: 0.5, fontSize: '1rem' }} />
        Agenda
      </ToggleButton>
      <ToggleButton value={VIEW_MODES.WEEK}>
        <DateRange sx={{ mr: 0.5, fontSize: '1rem' }} />
        Week
      </ToggleButton>
      <ToggleButton value={VIEW_MODES.MONTH}>
        <CalendarMonth sx={{ mr: 0.5, fontSize: '1rem' }} />
        Month
      </ToggleButton>
    </ToggleButtonGroup>
  ), [viewMode, handleViewModeChange, toggleButtonStyles]);

  // Render different view modes
  const renderViewContent = () => {
    const events = project?.events || [];

    switch (viewMode) {
      case VIEW_MODES.AGENDA:
        return (
          <Grid container spacing={2} sx={styles.viewContainer}>
            <Grid item xs={12} md={8}>
              <Box sx={styles.scrollableBox}>
                <MemoizedItinerarySchedule
                  project={project}
                  events={events}
                  onEventSelect={handleEventSelect}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={styles.scrollableBox}>
                <MemoizedEventDetailsSection 
                  selectedDate={selectedDate}
                  selectedEventId={selectedEventId}
                  project={project}
                />
              </Box>
            </Grid>
          </Grid>
        );

      case VIEW_MODES.WEEK:
        return (
          <Box sx={styles.fullViewBox}>
            <MemoizedFullCalendarWeekView
              project={project}
              events={events}
              onEventSelect={handleEventSelect}
            />
          </Box>
        );

      case VIEW_MODES.MONTH:
        return (
          <Box sx={styles.fullViewBox}>
            <MemoizedFullCalendarMonthView
              project={project}
              events={events}
              onEventSelect={handleEventSelect}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={styles.container}>
      {/* Action Buttons */}
      <Stack {...styles.actionStack}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenImportDialog}
          sx={{ ...buttonStyles.common, ...buttonStyles.outlined }}
        >
          Import
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={openViewSchedule}
          sx={{ ...buttonStyles.common, ...buttonStyles.contained }}
        >
          Export
        </Button>
      </Stack>

      {/* Main Content */}
      <MainCard 
        title="Schedule Planning"
        secondary={headerContent}
        sx={styles.mainCard}
      >
        {renderViewContent()}
      </MainCard>

      {/* Import Options Dialog */}
      <ImportOptionsDialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        onImport={handleImportCompletion}
        projectId={project?.id}
        projectGroups={project?.groups || []}
        availableRoles={availableRoles}
        availableTrainingPlans={availableTrainingPlans}
        loading={trainingPlansLoading || rolesLoading}
      />

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onClose={handleCloseAddEventDialog}
        selectedTime={null}
        selectedDate={selectedDate || new Date()}
        project={project}
        onEventCreated={handleEventCreated}
      />

      {/* View Schedule Dialog */}
      <Dialog
        open={viewScheduleOpen}
        onClose={closeViewSchedule}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: 2
          }
        }}
      >
        <MainCard
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiCardContent-root': {
              flex: 1,
              overflow: 'hidden',
              p: 0
            }
          }}
        >
          <ScheduleExport 
            projectEvents={project?.events || []}
            projectTitle={project?.name || 'Project Schedule'}
          />
        </MainCard>
      </Dialog>
    </Box>
  );
};

export default React.memo(AgendaTab);