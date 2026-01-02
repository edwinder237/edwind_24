import React, { useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Grid, ToggleButton, ToggleButtonGroup, Stack, useTheme, alpha, Button, Dialog, Typography, useMediaQuery, Chip } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  selectAvailableRoles,
  selectTrainingPlans,
  selectSettingsLoading
} from 'store/reducers/project/settings';
import { derivedSelectors } from 'store/selectors';
import { ViewList, CalendarMonth, DateRange } from '@mui/icons-material';

// Components
import MainCard from 'components/MainCard';
import AgendaView from './AgendaView';
import { EventDetailsSection } from './features/events/components';
import { FullCalendarMonthView, FullCalendarWeekView } from './views/calendar';
import ScheduleExport from './features/scheduling/components/ScheduleExport';
import ImportOptionsDialog from './features/scheduling/components/ImportOptionsDialog';
import { AddEventDialog } from './features/events/dialogs';

// Modernized hooks using CQRS architecture
import { useNormalizedEvents } from './features/events/hooks';
import { useEventsCRUDRTK } from './features/events/hooks';
import { useGetProjectSettingsQuery } from 'store/api/projectApi';

// Legacy hooks for UI state (keeping for now)
import { useAgendaState } from './hooks/useAgendaState';
import { VIEW_MODES, SCROLL_STYLES } from './utils/constants';

// Domain events integration
import eventBus from 'store/events/EventBus';

// Memoized components for better performance
const MemoizedAgendaView = AgendaView;
const MemoizedEventDetailsSection = React.memo(EventDetailsSection);
const MemoizedFullCalendarMonthView = React.memo(FullCalendarMonthView);
const MemoizedFullCalendarWeekView = React.memo(FullCalendarWeekView);

/**
 * Modernized Agenda Tab Component using CQRS Architecture
 * 
 * Key Improvements:
 * - RTK Query for automatic caching and background refetching
 * - Semantic commands for consistent business logic
 * - Domain events for loose coupling and real-time updates
 * - Normalized entity selectors for computed views
 * - Enhanced error handling and user feedback
 * - Performance optimizations with memoization
 */
const AgendaTabRTK = React.memo(() => {
  const theme = useTheme();
  const router = useRouter();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

  // Get projectId from URL as single source of truth
  const projectId = router.query.id;

  // Get project data from derived selectors (computed from Redux store)
  const dashboardData = useSelector(derivedSelectors.dashboard.selectCompleteDashboard);

  // CQRS: Fetch project settings using RTK Query for agenda time range
  const { data: projectSettingsData } = useGetProjectSettingsQuery(projectId, {
    skip: !projectId
  });

  // Create a mock project object for backward compatibility with child components
  const project = dashboardData?.projectInfo ? {
    id: dashboardData.projectInfo.id,
    title: dashboardData.projectInfo.title,
    summary: dashboardData.projectInfo.summary,
    projectStatus: dashboardData.projectInfo.projectStatus,
    project_settings: projectSettingsData?.settings // Add settings for agenda time range (CQRS)
  } : null;

  // Normalized data management with caching
  const {
    events,
    participants,
    groups,
    instructors,
    projectInfo,
    loading,
    refreshing,
    error,
    hasData,
    isEmpty,
    metrics,
    forceRefresh
  } = useNormalizedEvents(projectId);

  // CRUD operations with RTK Query mutations
  const crudConfig = useMemo(() => ({
    data: events,
    participants,
    groups,
    projectId,
    onRefresh: forceRefresh
  }), [events, participants, groups, projectId, forceRefresh]);

  const crudOperations = useEventsCRUDRTK(crudConfig);

  // Get roles and training plans from Redux store
  const availableRoles = useSelector(selectAvailableRoles);
  const availableTrainingPlans = useSelector(selectTrainingPlans);
  const settingsLoading = useSelector(selectSettingsLoading);

  // UI State management (using legacy hook for now)
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

  // Local state for dialogs
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = React.useState(false);

  // Domain events subscription for real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to event-related events
    const handleEventCreated = (event) => {
      console.log('[AgendaTabRTK] Event created:', event);
      // RTK Query will automatically refetch due to cache invalidation
    };

    const handleEventUpdated = (event) => {
      console.log('[AgendaTabRTK] Event updated:', event);
    };

    const handleEventDeleted = (event) => {
      console.log('[AgendaTabRTK] Event deleted:', event);
    };

    const handleAttendanceUpdated = (event) => {
      console.log('[AgendaTabRTK] Attendance updated:', event);
    };

    // Subscribe to events
    const unsubscribe1 = eventBus.subscribe('event.create.completed', handleEventCreated);
    const unsubscribe2 = eventBus.subscribe('event.update.completed', handleEventUpdated);
    const unsubscribe3 = eventBus.subscribe('event.delete.completed', handleEventDeleted);
    const unsubscribe4 = eventBus.subscribe('event.attendance.update.completed', handleAttendanceUpdated);

    // Cleanup subscriptions
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, [projectId]);

  // Enhanced CRUD handlers with domain events
  const handleCRUD = useMemo(() => ({
    handleCreateEvent: async (eventData) => {
      await crudOperations.handleCreateEvent(eventData);
      setAddEventDialogOpen(false);
    },
    handleUpdateEvent: crudOperations.handleUpdateEvent,
    handleDeleteEvent: crudOperations.handleDeleteEvent,
    handleUpdateAttendance: crudOperations.handleUpdateAttendance,
    handleAddParticipantToEvent: crudOperations.handleAddParticipantToEvent,
    handleRemoveParticipantFromEvent: crudOperations.handleRemoveParticipantFromEvent,
    handleAddGroupToEvent: crudOperations.handleAddGroupToEvent,
    handleImportCurriculumSchedule: crudOperations.handleImportCurriculumSchedule,
  }), [crudOperations]);

  // Dialog handlers
  const handleOpenImportDialog = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleCloseImportDialog = useCallback(() => {
    setImportDialogOpen(false);
  }, []);

  const handleOpenAddEventDialog = useCallback(() => {
    setAddEventDialogOpen(true);
  }, []);

  const handleCloseAddEventDialog = useCallback(() => {
    setAddEventDialogOpen(false);
  }, []);

  // Handle import completion
  const handleImportCompletion = useCallback(async (result) => {
    if (result.success) {
      console.log(`Import completed: ${result.events?.length || 0} events created`);
      if (result.warnings > 0) {
        console.warn(`Import completed with ${result.warnings} warnings`);
      }
      // Data will be automatically updated via RTK Query cache invalidation
    }
  }, []);

  // Memoized styles
  const styles = useMemo(() => ({
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
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
      p: matchDownSM ? 0 : 2
    },
    scrollableBox: {
      maxHeight: 'calc(100vh - 320px)',
      overflow: 'auto',
      ...(matchDownSM ? {
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      } : SCROLL_STYLES)
    },
    fullViewBox: {
      flex: 1,
      overflow: 'hidden',
      ...SCROLL_STYLES
    }
  }), [matchDownSM]);

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

  // Header content with better performance
  const headerContent = useMemo(() => (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* Import/Export Buttons - Pro Features */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label="Pro"
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
          }}
        />
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

      {/* View Toggle Buttons - Hide on mobile */}
      {!matchDownSM && (
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
      )}
    </Stack>
  ), [viewMode, handleViewModeChange, toggleButtonStyles, handleOpenImportDialog, openViewSchedule, buttonStyles, matchDownSM]);

  // Error Display Component
  const ErrorDisplay = useCallback(() => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>
        Failed to load schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error?.message || 'Unable to load events'}
      </Typography>
      <Button variant="contained" onClick={forceRefresh}>
        Retry
      </Button>
    </Box>
  ), [error, forceRefresh]);

  // Loading Display Component
  const LoadingDisplay = useCallback(() => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="body2">Loading schedule...</Typography>
    </Box>
  ), []);

  // Render different view modes
  const renderViewContent = useCallback(() => {
    // Use normalized events data
    const eventData = events || [];

    if (loading && !refreshing) {
      return <LoadingDisplay />;
    }

    if (error && !loading) {
      return <ErrorDisplay />;
    }

    switch (viewMode) {
      case VIEW_MODES.AGENDA:
        return (
          <Grid container spacing={matchDownSM ? 0 : 2} sx={styles.viewContainer}>
            <Grid item xs={12} md={8}>
              <Box sx={styles.scrollableBox}>
                <MemoizedAgendaView
                  project={project}
                  events={eventData}
                  onEventSelect={handleEventSelect}
                  crudOperations={handleCRUD}
                />
              </Box>
            </Grid>
            {!matchDownSM && (
              <Grid item xs={12} md={4}>
                <Box sx={styles.scrollableBox}>
                  <MemoizedEventDetailsSection 
                    selectedDate={selectedDate}
                    selectedEventId={selectedEventId}
                    project={project}
                    availableRoles={availableRoles}
                    crudOperations={handleCRUD}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        );

      case VIEW_MODES.WEEK:
        return (
          <Box sx={styles.fullViewBox}>
            <MemoizedFullCalendarWeekView
              project={project}
              events={eventData}
              onEventSelect={handleEventSelect}
              crudOperations={handleCRUD}
            />
          </Box>
        );

      case VIEW_MODES.MONTH:
        return (
          <Box sx={styles.fullViewBox}>
            <MemoizedFullCalendarMonthView
              project={project}
              events={eventData}
              onEventSelect={handleEventSelect}
              crudOperations={handleCRUD}
            />
          </Box>
        );

      default:
        return null;
    }
  }, [
    events, loading, refreshing, error, viewMode, matchDownSM, project,
    selectedDate, selectedEventId, availableRoles, handleEventSelect,
    handleCRUD, styles, LoadingDisplay, ErrorDisplay
  ]);

  return (
    <Box sx={styles.container}>
      {/* Main Content */}
      <MainCard 
        title="Schedule Planning"
        secondary={headerContent}
        sx={{
          ...styles.mainCard,
          ...(matchDownSM && {
            '& .MuiCardContent-root': {
              p: 0,
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }
          })
        }}
      >
        {renderViewContent()}
      </MainCard>

      {/* Import Options Dialog */}
      <ImportOptionsDialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        onImport={handleImportCompletion}
        projectId={project?.id}
        projectGroups={groups || []}
        availableRoles={availableRoles}
        availableTrainingPlans={availableTrainingPlans}
        loading={settingsLoading}
        crudOperations={handleCRUD}
      />

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onClose={handleCloseAddEventDialog}
        selectedTime={null}
        selectedDate={selectedDate || new Date()}
        project={project}
        onEventCreated={handleCRUD.handleCreateEvent}
        availableRoles={availableRoles}
        availableTrainingPlans={availableTrainingPlans}
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
            projectEvents={events || []}
            projectTitle={project?.title || 'Project Schedule'}
          />
        </MainCard>
      </Dialog>
    </Box>
  );
});

AgendaTabRTK.displayName = 'AgendaTabRTK';

export default AgendaTabRTK;