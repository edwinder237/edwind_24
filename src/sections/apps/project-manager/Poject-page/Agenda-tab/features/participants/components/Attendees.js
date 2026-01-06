import React, { useState, useEffect } from 'react';
import {
  Stack,
  Typography,
  Chip,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import { UserOutlined } from '@ant-design/icons';

// Project imports
import MainCard from 'components/MainCard';
import ParticipantDetailsDrawer from '../../../../Participant-Dialog/ParticipantDetailsDrawer';
import ParticipantList from './ParticipantList';
import AttendanceStats from './AttendanceStats';
import AddParticipantsDialog from '../dialogs/AddParticipantsDialog';

// RTK Query hooks
import { useGetProjectAgendaQuery } from 'store/api/projectApi';

// Custom hooks with RTK Query
import { useAttendanceManagementRTK } from '../hooks/useAttendanceManagementRTK';
import { useAddParticipantsDialogRTK } from '../hooks/useAddParticipantsDialogRTK';
import { useParticipantData } from '../hooks/useParticipantData';

// Store (for move to event functionality - commands only, no legacy actions)
import { useDispatch } from 'store';
import { moveParticipantBetweenEvents } from 'store/commands/eventCommands';

// Domain Events
import { useDomainEvent, useDomainEventEmitter } from 'store/events/eventIntegration';
import { DomainEvents } from 'store/events/domainEvents';

/**
 * RTK Query version of Attendees Component
 * 
 * Key improvements:
 * - Uses RTK Query for automatic caching and background updates
 * - Optimistic updates for better UX
 * - Automatic cache invalidation
 * - Built-in loading and error states
 */
const AttendeesRTK = ({ 
  eventParticipants = [], 
  eventCourse, 
  selectedEvent, 
  course = null, 
  isGroupOperationLoading = false,
  projectId // New prop to enable RTK Query
}) => {
  // RTK Query for project agenda data
  const {
    data: agendaData,
    isLoading: isAgendaLoading,
    error: agendaError,
    refetch: refetchAgenda
  } = useGetProjectAgendaQuery(projectId, {
    skip: !projectId, // Skip query if no projectId provided
    // Disable automatic refetching for manual control
    pollingInterval: 0, // No automatic polling
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  // Create project structure for backward compatibility
  const singleProject = agendaData ? {
    ...agendaData.projectInfo,
    participants: agendaData.participants || [],
    groups: agendaData.groups || []
  } : { participants: [], groups: [] };

  // Get all project events for "Move to Event" functionality
  const projectEvents = agendaData?.events || [];

  // Get events with the same courseId as the selected event (for showing participant assignments)
  const courseEvents = React.useMemo(() => {
    if (!selectedEvent?.course?.id || !projectEvents.length) return [];
    return projectEvents.filter(event =>
      event.course?.id === selectedEvent.course.id && event.id !== selectedEvent.id
    );
  }, [selectedEvent?.course?.id, selectedEvent?.id, projectEvents]);

  // Participant drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  // Dispatch for move to event functionality
  const dispatch = useDispatch();
  const emitEvent = useDomainEventEmitter();

  // Note: No need to manually fetch events - RTK Query handles this automatically
  // The useGetProjectAgendaQuery hook above manages all data fetching

  // Subscribe to attendance events for this event
  useDomainEvent(DomainEvents.PARTICIPANT_MARKED_PRESENT, (event) => {
    if (event.payload?.event?.id === selectedEvent?.id) {
      setRecentEvents(prev => [...prev.slice(-4), { type: 'present', ...event.payload }]);
    }
  }, [selectedEvent?.id]);

  useDomainEvent(DomainEvents.PARTICIPANT_MARKED_ABSENT, (event) => {
    if (event.payload?.event?.id === selectedEvent?.id) {
      setRecentEvents(prev => [...prev.slice(-4), { type: 'absent', ...event.payload }]);
    }
  }, [selectedEvent?.id]);

  useDomainEvent(DomainEvents.EVENT_CAPACITY_WARNING, (event) => {
    if (event.payload?.eventId === selectedEvent?.id) {
      console.warn('Event capacity warning:', event.payload);
    }
  }, [selectedEvent?.id]);

  // Custom hooks with RTK Query
  const attendanceManagement = useAttendanceManagementRTK(
    eventParticipants, 
    selectedEvent, 
    singleProject
  );

  const addParticipantsDialog = useAddParticipantsDialogRTK(
    selectedEvent, 
    singleProject
  );

  const participantData = useParticipantData(
    eventParticipants, 
    attendanceManagement.participantStatuses, 
    course
  );

  // Event handlers
  const handleParticipantClick = (participant) => {
    // In the Agenda context, participant might be from eventParticipants or participantData
    // We need to find the full project_participant record
    let projectParticipantId = null;
    let participantUUID = null;
    let participantInfo = null;

    // Case 1: participant has event_attendee structure (has participantId field)
    if (participant.participantId) {
      projectParticipantId = participant.participantId; // This is the numeric ID from project_participants

      // Find the full participant details from singleProject.participants
      const fullParticipant = singleProject.participants?.find(p => p.id === projectParticipantId);
      if (fullParticipant) {
        participantUUID = fullParticipant.participant?.id;
        participantInfo = fullParticipant.participant;
      }
    }
    // Case 2: participant has project_participant structure (has id field with participant nested object)
    else if (participant.participant) {
      projectParticipantId = participant.id; // Numeric ID
      participantUUID = participant.participant.id; // UUID
      participantInfo = participant.participant;
    }
    // Case 3: participant is direct participant record (UUID)
    else if (typeof participant.id === 'string' && participant.id.includes('-')) {
      participantUUID = participant.id;
      // Find project_participant record
      const fullParticipant = singleProject.participants?.find(
        p => p.participant?.id === participantUUID
      );
      if (fullParticipant) {
        projectParticipantId = fullParticipant.id;
        participantInfo = fullParticipant.participant;
      }
    }

    if (!projectParticipantId || !participantUUID) {
      console.error('[Attendees] Could not resolve participant IDs', participant);
      return;
    }

    // Transform participant data to include projectParticipantId (numeric ID needed for assessments API)
    const transformedParticipant = {
      id: participantUUID, // UUID from participants table
      projectParticipantId: projectParticipantId, // Numeric ID from project_participants table
      firstName: participantInfo?.firstName || participant.firstName,
      lastName: participantInfo?.lastName || participant.lastName,
      email: participantInfo?.email || participant.email,
      phone: participantInfo?.phone || participant.phone,
      role: participantInfo?.role || participant.role
    };

    setSelectedParticipant(transformedParticipant);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedParticipant(null);
  };

  // Handle moving participant to another event
  const handleMoveToEvent = async (participantId, eventParticipant, targetEvent) => {
    try {
      // Use semantic command for moving participant between events
      await dispatch(moveParticipantBetweenEvents({
        participantId,
        fromEventId: selectedEvent?.id,
        toEventId: targetEvent.id,
        projectId: projectId
      }));

      // CQRS: Use RTK Query refetch to update data automatically via cache invalidation
      // The moveParticipantBetweenEvents command handles tag invalidation
      await refetchAgenda();

      console.log(`Participant moved from event ${selectedEvent?.id} to event ${targetEvent.id} using semantic command`);
    } catch (error) {
      console.error('Error moving participant to event:', error);
      // Error notification is handled by the semantic command
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (projectId) {
      refetchAgenda();
    }
  };

  // Calculate filtered data for dialog
  const availableGroups = participantData.getAvailableGroups(
    singleProject?.groups || [], 
    selectedEvent?.event_groups || []
  );

  const availableParticipants = participantData.getAvailableParticipants(
    singleProject?.participants || [], 
    eventParticipants, 
    addParticipantsDialog.searchTerm
  );

  // Show loading state while fetching initial data
  if (isAgendaLoading && !agendaData) {
    return (
      <MainCard title="Participants">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  // Show error state
  if (agendaError) {
    return (
      <MainCard title="Participants">
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body2" color="error">
            Error loading participants: {agendaError.message}
          </Typography>
          <IconButton onClick={handleRefresh} sx={{ mt: 1 }}>
            Retry
          </IconButton>
        </Box>
      </MainCard>
    );
  }

  return (
    <>
      <MainCard
        title={
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Participants
              </Typography>
              <Typography variant="body2" sx={{ 
                color: participantData.capacityInfo.isAtMaxCapacity ? 'error.main' : 'text.secondary',
                fontWeight: participantData.capacityInfo.isAtMaxCapacity ? 600 : 400
              }}>
                {participantData.capacityInfo.hasMaxLimit 
                  ? `${participantData.attendanceStats.total}/${participantData.capacityInfo.maxParticipants}` 
                  : participantData.attendanceStats.total
                }
              </Typography>
              {participantData.capacityInfo.isAtMaxCapacity && (
                <Chip 
                  label="FULL" 
                  size="small" 
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderColor: 'error.main',
                    color: 'error.main',
                    backgroundColor: 'error.lighter',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
              
              {/* RTK Query loading indicator */}
              {isAgendaLoading && (
                <CircularProgress size={16} sx={{ color: 'primary.main' }} />
              )}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton 
                size="small" 
                onClick={addParticipantsDialog.openDialog}
                sx={{
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'success.lighter'
                  }
                }}
                title="Add Participant"
              >
                <UserOutlined style={{ fontSize: '1.1rem' }} />
              </IconButton>
              
              {/* Refresh button */}
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  }
                }}
                title="Refresh Data"
              >
                🔄
              </IconButton>
            </Stack>
          </Stack>
        }
        subheader={
          <Stack direction="row" alignItems="center" spacing={1}>
            {eventCourse && (
              <Typography variant="caption" color="text.secondary">
                {eventCourse}
              </Typography>
            )}
            {agendaData?.lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                • Updated: {new Date(agendaData.lastUpdated).toLocaleTimeString()}
              </Typography>
            )}
          </Stack>
        }
        sx={{ 
          "& .MuiCardHeader-root": { 
            pb: 1,
            '& .MuiCardHeader-title': { width: '100%' },
            '& .MuiCardHeader-action': {
              margin: 0,
              alignSelf: 'center',
              ml: 'auto'
            }
          },
          height: 'fit-content',
          maxHeight: 400,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          '&:hover': { boxShadow: 1 },
          "& .MuiCardContent-root": {
            overflowY: 'auto',
            maxHeight: 300,
            pt: 1
          }
        }}
      >
        <Box sx={{ p: 2, position: 'relative' }}>
          {/* Loading Overlay - including RTK Query operations */}
          {(isGroupOperationLoading || addParticipantsDialog.isLoading) && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: 2
            }}>
              <CircularProgress size={24} sx={{ mb: 1 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {addParticipantsDialog.isLoading ? 'Adding participants...' : 'Updating participants...'}
              </Typography>
            </Box>
          )}

          {participantData.uniqueParticipants.length > 0 ? (
            <Stack spacing={2}>
              <Stack spacing={1}>
                {/* Attendance Statistics */}
                <AttendanceStats attendanceStats={participantData.attendanceStats} />
                
                {/* Participants List */}
                <ParticipantList
                  participants={participantData.uniqueParticipants}
                  participantStatuses={attendanceManagement.participantStatuses}
                  updatingParticipant={attendanceManagement.updatingParticipant}
                  singleProject={singleProject}
                  onStatusChange={attendanceManagement.handleStatusChange}
                  onRemoveFromEvent={attendanceManagement.handleRemoveFromEvent}
                  onMoveToGroup={attendanceManagement.handleMoveToGroup}
                  onMoveToEvent={handleMoveToEvent}
                  onParticipantClick={handleParticipantClick}
                  availableEvents={projectEvents}
                  currentEventId={selectedEvent?.id}
                />
              </Stack>
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                No participants assigned to this event
              </Typography>
            </Box>
          )}
        </Box>
      </MainCard>
      
      {/* Participant Report Card Drawer */}
      <ParticipantDetailsDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        participant={selectedParticipant}
        projectId={projectId}
      />

      {/* Add Participants Dialog */}
      <AddParticipantsDialog
        isOpen={addParticipantsDialog.isOpen}
        onClose={addParticipantsDialog.closeDialog}
        selectedEvent={selectedEvent}
        activeTab={addParticipantsDialog.activeTab}
        onTabChange={addParticipantsDialog.setActiveTab}
        searchTerm={addParticipantsDialog.searchTerm}
        onSearchChange={addParticipantsDialog.setSearchTerm}
        selectedGroups={addParticipantsDialog.selectedGroups}
        selectedParticipants={addParticipantsDialog.selectedParticipants}
        onToggleGroup={addParticipantsDialog.toggleGroupSelection}
        onToggleParticipant={addParticipantsDialog.toggleParticipantSelection}
        onSelectAllGroups={addParticipantsDialog.selectAllGroups}
        onDeselectAllGroups={addParticipantsDialog.deselectAllGroups}
        onSelectAllParticipants={addParticipantsDialog.selectAllParticipants}
        onDeselectAllParticipants={addParticipantsDialog.deselectAllParticipants}
        onApplySelections={addParticipantsDialog.applySelections}
        isLoading={addParticipantsDialog.isLoading}
        availableGroups={availableGroups}
        availableParticipants={availableParticipants}
        suggestedParticipants={[]} // TODO: Implement suggested participants logic
        courseRoleIds={[]} // TODO: Extract from selectedEvent.course
        courseEvents={courseEvents}
      />
    </>
  );
};

export default AttendeesRTK;