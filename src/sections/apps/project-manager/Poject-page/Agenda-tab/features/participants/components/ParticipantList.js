import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  alpha
} from '@mui/material';
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from 'components/Dropdown';
import { Remove, ArrowRight, Event as EventIcon } from '@mui/icons-material';
import { ATTENDANCE_STATUS_CHOICES } from 'constants';

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
  currentEventId = null
}) => {
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
                
                // Move to event submenu
                <DropdownNestedMenuItem
                  key="move-to-event"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EventIcon style={{ fontSize: 14, color: 'inherit' }} />
                      Move to Event
                    </Box>
                  }
                  rightIcon={<ArrowRight style={{ fontSize: 16 }} />}
                  menu={
                    availableEvents?.length > 0 ? 
                      availableEvents
                        .filter(event => event.id !== currentEventId) // Don't show current event
                        .map((event) => (
                          <DropdownMenuItem
                            key={`move-to-event-${event.id}`}
                            onClick={() => onMoveToEvent(participantId, eventParticipant, event)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon style={{ fontSize: 16, color: '#2e7d32' }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                  {event.title || `Event ${event.id}`}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                  {new Date(event.start).toLocaleDateString()} {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            </Box>
                          </DropdownMenuItem>
                        )) : [
                          <DropdownMenuItem key="no-events" disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon style={{ fontSize: 16, color: 'rgba(0,0,0,0.26)' }} />
                              No other events available
                            </Box>
                          </DropdownMenuItem>
                        ]
                  }
                  sx={{ 
                    fontSize: '0.75rem',
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08)
                    }
                  }}
                />,
                
                // Remove from event option
                <DropdownMenuItem
                  key="remove"
                  onClick={() => onRemoveFromEvent(participantId, eventParticipant)}
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
    </Box>
  );
};

export default ParticipantList;