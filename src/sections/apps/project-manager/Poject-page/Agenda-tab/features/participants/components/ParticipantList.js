import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Dialog,
  Button,
  Stack,
  alpha,
  Switch
} from '@mui/material';
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from 'components/Dropdown';
import { Remove, ArrowRight, Event as EventIcon } from '@mui/icons-material';
import { ATTENDANCE_STATUS_CHOICES } from 'constants';
import MainCard from 'components/MainCard';

/**
 * ParticipantList - Displays the list of participants with attendance controls
 * Focused on rendering and user interactions only
 */
const ParticipantList = ({
  participants,
  participantStatuses,
  updatingParticipant,
  onStatusChange,
  onRemoveFromEvent,
  onMoveToEvent,
  onParticipantClick,
  availableEvents = [],
  currentEventId = null,
  currentCourseId = null
}) => {
  // State for move confirmation dialog
  const [moveConfirmOpen, setMoveConfirmOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);

  // State for remove confirmation dialog
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  // State for showing all sessions vs same course only (default: same course)
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Filter events based on showAllSessions toggle
  const filteredEvents = useMemo(() => {
    if (!availableEvents?.length) return [];
    const eventsExcludingCurrent = availableEvents.filter(event => event.id !== currentEventId);
    if (showAllSessions || !currentCourseId) {
      return eventsExcludingCurrent;
    }
    return eventsExcludingCurrent.filter(event => event.course?.id === currentCourseId);
  }, [availableEvents, currentEventId, currentCourseId, showAllSessions]);


  // Handle move to event click - opens confirmation dialog
  const handleMoveToEventClick = (participantId, eventParticipant, targetEvent) => {
    const participant = eventParticipant.participant;
    setPendingMove({
      participantId,
      eventParticipant,
      targetEvent,
      participantName: `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() || 'this participant'
    });
    setMoveConfirmOpen(true);
  };

  // Confirm the move
  const handleConfirmMove = () => {
    if (pendingMove) {
      onMoveToEvent(pendingMove.participantId, pendingMove.eventParticipant, pendingMove.targetEvent);
    }
    setMoveConfirmOpen(false);
    setPendingMove(null);
  };

  // Cancel the move
  const handleCancelMove = () => {
    setMoveConfirmOpen(false);
    setPendingMove(null);
  };

  // Handle remove from event click - opens confirmation dialog
  const handleRemoveFromEventClick = (participantId, eventParticipant) => {
    const participant = eventParticipant.participant;
    setPendingRemove({
      participantId,
      eventParticipant,
      participantName: `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() || 'this participant'
    });
    setRemoveConfirmOpen(true);
  };

  // Confirm the remove
  const handleConfirmRemove = () => {
    if (pendingRemove) {
      onRemoveFromEvent(pendingRemove.participantId, pendingRemove.eventParticipant);
    }
    setRemoveConfirmOpen(false);
    setPendingRemove(null);
  };

  // Cancel the remove
  const handleCancelRemove = () => {
    setRemoveConfirmOpen(false);
    setPendingRemove(null);
  };

  if (participants.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        <Typography variant="body2">
          No participants assigned to this event
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
      {participants.map((eventParticipant, index) => {
        const participant = eventParticipant.participant;
        if (!participant) return null;

        // enrolleeId should be directly on eventParticipant (from event_attendees table)
        // Fallback to enrollee.id if enrolleeId is missing (for backwards compatibility)
        const participantId = eventParticipant.enrolleeId || eventParticipant.enrollee?.id || participant.id;
        
        return (
          <Box
            key={participantId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.75,
              px: 1,
              borderBottom: index < participants.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {/* Participant Name and Role */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: 1, 
                minWidth: 0, 
                flex: 1,
                cursor: 'pointer',
                '&:hover': {
                  '& .participant-name': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }
              }}
              onClick={() => onParticipantClick(participant)}
            >
              <Typography 
                className="participant-name"
                variant="body2" 
                sx={{ 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  transition: 'all 0.2s'
                }}
              >
                {`${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {participant.role?.title || participant.role?.name || eventParticipant.role?.title || eventParticipant.role?.name || 'No Role'}
              </Typography>
            </Box>

            {/* Status Dropdown with Actions */}
            <Dropdown
              trigger={
                <Box 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    minWidth: 90,
                    opacity: updatingParticipant && updatingParticipant !== participantId ? 0.5 : 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {updatingParticipant === participantId ? (
                    <CircularProgress size={10} sx={{ color: 'primary.main' }} />
                  ) : (
                    <Box 
                      sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%',
                        bgcolor: (participantStatuses[participantId] || 'scheduled') === 'present' ? 'success.main' : 
                                 (participantStatuses[participantId] || 'scheduled') === 'late' ? 'warning.main' : 
                                 (participantStatuses[participantId] || 'scheduled') === 'absent' ? 'error.main' : 'info.main'
                      }} 
                    />
                  )}
                  <Typography 
                    sx={{ 
                      fontSize: '0.7rem',
                      color: updatingParticipant === participantId ? 'primary.main' :
                             (participantStatuses[participantId] || 'scheduled') === 'present' ? 'success.main' : 
                             (participantStatuses[participantId] || 'scheduled') === 'late' ? 'warning.main' : 
                             (participantStatuses[participantId] || 'scheduled') === 'absent' ? 'error.main' : 'info.main',
                      textTransform: 'capitalize'
                    }}
                  >
                    {updatingParticipant === participantId ? 'Updating...' : (participantStatuses[participantId] || 'scheduled')}
                  </Typography>
                </Box>
              }
              menu={[
                // Attendance status options
                ...ATTENDANCE_STATUS_CHOICES.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => {
                      if (updatingParticipant === null) {
                        onStatusChange(participantId, status.value);
                      }
                    }}
                    disabled={updatingParticipant !== null}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.color }} />
                      {status.text}
                    </Box>
                  </DropdownMenuItem>
                )),

                // Divider to separate status options from actions
                <Divider key="divider" sx={{ my: 0.5 }} />,

                // Move to event submenu
                <DropdownNestedMenuItem
                  key="move-to-event"
                  rightAnchored
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EventIcon style={{ fontSize: 14, color: 'inherit' }} />
                      Move to Event
                    </Box>
                  }
                  rightIcon={<ArrowRight style={{ fontSize: 16 }} />}
                  menu={[
                    // Show All Sessions toggle (only if there's a current course)
                    currentCourseId && (
                      <DropdownMenuItem
                        key="show-all-toggle"
                        keepOpen
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          minWidth: 200,
                          py: 0.5
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Show all sessions
                        </Typography>
                        <Switch
                          size="small"
                          checked={showAllSessions}
                          onChange={(e) => {
                            e.stopPropagation();
                            setShowAllSessions(e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </DropdownMenuItem>
                    ),
                    // Event list
                    ...(filteredEvents.length > 0
                      ? filteredEvents.map((event) => (
                          <DropdownMenuItem
                            key={`move-to-event-${event.id}`}
                            onClick={() => handleMoveToEventClick(participantId, eventParticipant, event)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon style={{ fontSize: 16, color: '#2e7d32' }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                  {event.title || `Event ${event.id}`}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 500 }}>
                                  {new Date(event.start).toLocaleDateString()} <span style={{ color: '#1976d2' }}>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </Typography>
                              </Box>
                            </Box>
                          </DropdownMenuItem>
                        ))
                      : [
                          <DropdownMenuItem key="no-events" disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon style={{ fontSize: 16, color: 'rgba(0,0,0,0.26)' }} />
                              {currentCourseId && !showAllSessions
                                ? 'No other sessions for this course'
                                : 'No other events available'}
                            </Box>
                          </DropdownMenuItem>
                        ])
                  ].filter(Boolean)}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08)
                    }
                  }}
                />,

                // Divider before remove action
                <Divider key="divider-remove" sx={{ my: 0.5 }} />,

                // Remove from event option
                <DropdownMenuItem
                  key="remove"
                  onClick={() => handleRemoveFromEventClick(participantId, eventParticipant)}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Remove sx={{ fontSize: 14, color: 'error.main' }} />
                    Remove from Event
                  </Box>
                </DropdownMenuItem>
              ]}
              minWidth={180}
            />
          </Box>
        );
      })}

      {/* Move to Event Confirmation Dialog */}
      <Dialog
        open={moveConfirmOpen}
        onClose={handleCancelMove}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <MainCard title="Confirm Move">
          <Stack spacing={2}>
            <Typography>
              Move <strong>{pendingMove?.participantName}</strong> to{' '}
              <strong>{pendingMove?.targetEvent?.title || 'the selected event'}</strong>?
            </Typography>
            {pendingMove?.targetEvent && (
              <Typography variant="body2" color="text.secondary">
                {new Date(pendingMove.targetEvent.start).toLocaleDateString()}{' '}
                {new Date(pendingMove.targetEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button onClick={handleCancelMove}>Cancel</Button>
              <Button onClick={handleConfirmMove} variant="contained" color="primary">
                Move
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Dialog>

      {/* Remove from Event Confirmation Dialog */}
      <Dialog
        open={removeConfirmOpen}
        onClose={handleCancelRemove}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <MainCard title="Confirm Remove">
          <Stack spacing={2}>
            <Typography>
              Remove <strong>{pendingRemove?.participantName}</strong> from this event?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The participant will no longer be assigned to this event.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button onClick={handleCancelRemove}>Cancel</Button>
              <Button onClick={handleConfirmRemove} variant="contained" color="error">
                Remove
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Dialog>
    </Box>
  );
};

export default ParticipantList;