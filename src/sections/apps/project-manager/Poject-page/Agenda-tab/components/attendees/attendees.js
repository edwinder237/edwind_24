import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";

// material-ui
import {
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Stack,
  Typography,
  Chip,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Badge,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import AddParticipantSlider from "./AddParticipantSlider";
import ParticipantDrawer from "./ParticipantDrawer";
import { useSelector, useDispatch } from "store";
import { getSingleProject, getEvents } from "store/reducers/projects";
import { openSnackbar } from "store/reducers/snackbar";

// assets
import { SettingOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

// assets
const Avatar1 = "/assets/images/users/avatar-1.png";

// ===========================||  ||=========================== //

const Attendees = React.memo(({ eventParticipants, eventCourse, groupName, selectedEvent, onAddParticipants, onRemoveParticipant, onMoveParticipant, course = null, isGroupOperationLoading = false }) => {
  const dispatch = useDispatch();
  const { singleProject } = useSelector((state) => state.projects);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Initialize participant statuses from eventParticipants
  const [participantStatuses, setParticipantStatuses] = useState({});
  
  // Track which participant is currently being updated to prevent multiple simultaneous changes
  const [updatingParticipant, setUpdatingParticipant] = useState(null);
  
  // State for participant drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Initialize statuses when eventParticipants changes (prevent looping)
  useEffect(() => {
    if (eventParticipants?.length > 0) {
      const initialStatuses = {};
      eventParticipants.forEach(ep => {
        // Use enrolleeId if available, otherwise fall back to participant.id
        const participantId = ep.enrolleeId || ep.participant?.id;
        if (participantId) {
          initialStatuses[participantId] = ep.attendance_status || 'scheduled';
        }
      });
      
      // Only update if the statuses have actually changed to prevent loops
      setParticipantStatuses(prev => {
        const hasChanged = Object.keys(initialStatuses).some(id => 
          prev[id] !== initialStatuses[id]
        ) || Object.keys(prev).length !== Object.keys(initialStatuses).length;
        
        return hasChanged ? initialStatuses : prev;
      });
    }
  }, [eventParticipants?.length, selectedEvent?.id]); // Use length and event ID to prevent unnecessary updates

  const handleOpenSlider = () => {
    setSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setSliderOpen(false);
  };

  const handleParticipantClick = (participant) => {
    setSelectedParticipant(participant);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedParticipant(null);
  };

  const handleStatusChange = async (participantId, newStatus) => {
    // Prevent multiple simultaneous changes
    if (updatingParticipant) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please wait for the current status change to complete',
        variant: 'alert',
        alert: {
          color: 'warning',
          variant: 'filled'
        }
      }));
      return;
    }

    // Set the updating participant to prevent other changes
    setUpdatingParticipant(participantId);
    
    // Find the event participant for participant name and check if they're direct or from group
    const eventParticipant = eventParticipants.find(ep => {
      const epParticipantId = ep.enrolleeId || ep.participant?.id || ep.id;
      return epParticipantId === participantId;
    });
    
    const participantName = eventParticipant?.participant ? 
      `${eventParticipant.participant.firstName || ''} ${eventParticipant.participant.lastName || ''}`.trim() || 
      `${eventParticipant.firstName || ''} ${eventParticipant.lastName || ''}`.trim() || 'Participant' :
      'Participant';
    
    // Check if this is a group member (not a direct attendee)
    if (eventParticipant && eventParticipant.isDirect === false) {
      // For group members, we need to first add them as direct attendees before updating status
      try {
        console.log(`Adding group member ${participantId} as direct attendee first`);
        
        // Add participant as direct attendee first
        const addResponse = await fetch('/api/projects/addEventParticipant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            participantId: participantId,
            attendance_status: newStatus
          })
        });

        if (addResponse.ok || addResponse.status === 400) {
          // Success or already exists, now try to update status
          const updateResponse = await fetch('/api/projects/updateAttendanceStatus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: selectedEvent.id,
              participantId: participantId,
              attendance_status: newStatus
            })
          });

          if (!updateResponse.ok) {
            throw new Error('Failed to update attendance status after adding participant');
          }

          // Dispatch custom event to notify Groups tab of attendance change
          const attendanceUpdateEvent = new CustomEvent('attendanceUpdated', {
            detail: { 
              projectId: selectedEvent.projectId || singleProject?.id,
              eventId: selectedEvent.id,
              participantId: participantId,
              newStatus: newStatus
            }
          });
          window.dispatchEvent(attendanceUpdateEvent);

          // Update local state
          setParticipantStatuses(prev => ({
            ...prev,
            [participantId]: newStatus
          }));

          // Show success toast
          dispatch(openSnackbar({
            open: true,
            message: `${participantName} marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            variant: 'alert',
            alert: {
              color: 'success',
              variant: 'filled'
            }
          }));
        } else {
          throw new Error('Failed to add participant as direct attendee');
        }
      } catch (error) {
        console.error('Error handling group member status update:', error);
        
        // Show error toast
        dispatch(openSnackbar({
          open: true,
          message: `Failed to update ${participantName}'s attendance status`,
          variant: 'alert',
          alert: {
            color: 'error',
            variant: 'filled'
          }
        }));
      } finally {
        setUpdatingParticipant(null);
      }
      return;
    }
    
    // For direct attendees, proceed with normal status update
    // Optimistically update local state
    setParticipantStatuses(prev => ({
      ...prev,
      [participantId]: newStatus
    }));
    
    try {
      if (eventParticipant && selectedEvent?.id) {
        // Make API call to update attendance status using existing endpoint
        const response = await fetch('/api/projects/updateAttendanceStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            participantId: participantId,
            attendance_status: newStatus
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update attendance status');
        }

        const result = await response.json();
        console.log(`Successfully updated participant ${participantId} to ${newStatus}:`, result);

        // Dispatch custom event to notify Groups tab of attendance change
        const attendanceUpdateEvent = new CustomEvent('attendanceUpdated', {
          detail: { 
            projectId: selectedEvent.projectId || singleProject?.id,
            eventId: selectedEvent.id,
            participantId: participantId,
            newStatus: newStatus
          }
        });
        window.dispatchEvent(attendanceUpdateEvent);
        
        // Show success toast
        dispatch(openSnackbar({
          open: true,
          message: `${participantName} marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          variant: 'alert',
          alert: {
            color: 'success',
            variant: 'filled'
          }
        }));
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      
      // Revert the optimistic update on error
      setParticipantStatuses(prev => {
        const originalStatus = eventParticipant?.attendance_status || 'scheduled';
        return {
          ...prev,
          [participantId]: originalStatus
        };
      });
      
      // Show error toast
      dispatch(openSnackbar({
        open: true,
        message: `Failed to update ${participantName}'s attendance status`,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    } finally {
      // Clear the updating participant to allow other changes
      setUpdatingParticipant(null);
    }
  };

  // Memoize unique participants calculation
  const uniqueParticipants = useMemo(() => {
    return eventParticipants.filter((participant, index, self) => {
      // For participants, use enrolleeId first, then participant ID or email as unique identifier
      const identifier = participant.enrolleeId || participant.participant?.id || participant.participant?.email || participant.id || participant.email;
      return index === self.findIndex(p => {
        const pIdentifier = p.enrolleeId || p.participant?.id || p.participant?.email || p.id || p.email;
        return pIdentifier === identifier;
      });
    });
  }, [eventParticipants]);

  // Memoize attendance statistics calculation using current state
  const attendanceStats = useMemo(() => {
    const statuses = Object.values(participantStatuses);
    return {
      scheduled: statuses.filter(status => status === 'scheduled').length,
      present: statuses.filter(status => status === 'present').length,
      absent: statuses.filter(status => status === 'absent').length,
      late: statuses.filter(status => status === 'late').length,
      total: uniqueParticipants.length
    };
  }, [participantStatuses, uniqueParticipants.length]);

  // Memoize capacity calculations
  const capacityInfo = useMemo(() => {
    const maxParticipants = course?.maxParticipants;
    const hasMaxLimit = maxParticipants && maxParticipants > 0;
    const isAtMaxCapacity = hasMaxLimit && attendanceStats.total >= maxParticipants;
    const missingCount = attendanceStats.scheduled - attendanceStats.present;
    
    return { maxParticipants, hasMaxLimit, isAtMaxCapacity, missingCount };
  }, [course?.maxParticipants, attendanceStats.total, attendanceStats.scheduled, attendanceStats.present]);

  const handleAddParticipants = useCallback(async (participants, groups) => {
    setLoading(true);
    try {
      await onAddParticipants(participants, groups);
    } finally {
      setLoading(false);
    }
  }, [onAddParticipants]);

  const handleRemoveParticipant = useCallback(async (participant) => {
    setLoading(true);
    try {
      await onRemoveParticipant(participant);
    } finally {
      setLoading(false);
    }
  }, [onRemoveParticipant]);

  const handleMoveParticipant = useCallback(async (participant, targetEventId) => {
    setLoading(true);
    try {
      await onMoveParticipant(participant, targetEventId);
    } finally {
      setLoading(false);
    }
  }, [onMoveParticipant]);

  // Memoize participant details calculation
  const eventParticipantsDetails = useMemo(() => {
    return uniqueParticipants.map((participant) => {
      const foundPerson = singleProject.participants.find(
        (project_participant) =>
          project_participant.id === participant?.project_paticipantId
      );
      return foundPerson
        ? { ...participant, participant: foundPerson.participant }
        : null;
    });
  }, [uniqueParticipants, singleProject.participants]);

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Participants
            </Typography>
            <Typography variant="body2" sx={{ 
              color: capacityInfo.isAtMaxCapacity ? 'error.main' : 'text.secondary',
              fontWeight: capacityInfo.isAtMaxCapacity ? 600 : 400
            }}>
              {capacityInfo.hasMaxLimit ? `${attendanceStats.total}/${capacityInfo.maxParticipants}` : attendanceStats.total}
            </Typography>
            {capacityInfo.isAtMaxCapacity && (
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
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Stack>
          <IconButton 
            size="small" 
            onClick={handleOpenSlider}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.lighter'
              }
            }}
          >
            <SettingOutlined style={{ fontSize: '1.1rem' }} />
          </IconButton>
        </Stack>
      }
      subheader={eventCourse && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {eventCourse}
        </Typography>
      )}
      sx={{ 
        "& .MuiCardHeader-root": { 
          pb: 1,
          '& .MuiCardHeader-title': {
            width: '100%'
          },
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
        '&:hover': {
          boxShadow: 1
        },
        "& .MuiCardContent-root": {
          overflowY: 'auto',
          maxHeight: 300,
          pt: 1
        }
      }}
    >
      <Box sx={{ p: 2, position: 'relative' }}>
        {/* Loading Overlay */}
        {isGroupOperationLoading && (
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
              Updating participants...
            </Typography>
          </Box>
        )}

        {uniqueParticipants.length > 0 ? (
          <Stack spacing={2}>
            {/* Participants List with integrated stats */}
            <Stack spacing={1}>
              {/* Subtle attendance summary above title */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
                {attendanceStats.present > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {attendanceStats.present} present
                    </Typography>
                  </Box>
                )}
                {attendanceStats.scheduled > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {attendanceStats.scheduled} scheduled
                    </Typography>
                  </Box>
                )}
                {attendanceStats.late > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {attendanceStats.late} late
                    </Typography>
                  </Box>
                )}
                {attendanceStats.absent > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {attendanceStats.absent} absent
                    </Typography>
                  </Box>
                )}
              </Stack>
              
              {/* Minimal participant list */}
              <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                {uniqueParticipants.map((eventParticipant, index) => {
                  const participant = eventParticipant.participant;
                  if (!participant) return null;
                  
                  // Use enrolleeId if available, otherwise fall back to participant.id
                  const participantId = eventParticipant.enrolleeId || participant.id;
                  
                  return (
                    <Box
                      key={participantId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.75,
                        px: 1,
                        borderBottom: index < uniqueParticipants.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      {/* Name and Role */}
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
                        onClick={() => handleParticipantClick(participant)}
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

                      {/* Status Dropdown */}
                      <Select
                        value={participantStatuses[participantId] || 'scheduled'}
                        onChange={(e) => handleStatusChange(participantId, e.target.value)}
                        size="small"
                        variant="standard"
                        disabled={updatingParticipant !== null} // Disable all dropdowns while any participant is updating
                        sx={{
                          fontSize: '0.75rem',
                          minWidth: 90,
                          opacity: updatingParticipant && updatingParticipant !== participantId ? 0.5 : 1, // Reduce opacity for non-updating participants
                          '& .MuiSelect-select': {
                            py: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          },
                          '&:before': {
                            display: 'none'
                          },
                          '&:after': {
                            display: 'none'
                          },
                          '& .MuiSelect-icon': {
                            fontSize: '1rem'
                          },
                          '&.Mui-disabled': {
                            opacity: updatingParticipant === participantId ? 1 : 0.5
                          }
                        }}
                        renderValue={(value) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {updatingParticipant === participantId ? (
                              <CircularProgress size={10} sx={{ color: 'primary.main' }} />
                            ) : (
                              <Box 
                                sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: '50%',
                                  bgcolor: value === 'present' ? 'success.main' : 
                                           value === 'late' ? 'warning.main' : 
                                           value === 'absent' ? 'error.main' : 'info.main'
                                }} 
                              />
                            )}
                            <Typography 
                              sx={{ 
                                fontSize: '0.7rem',
                                color: updatingParticipant === participantId ? 'primary.main' :
                                       value === 'present' ? 'success.main' : 
                                       value === 'late' ? 'warning.main' : 
                                       value === 'absent' ? 'error.main' : 'info.main',
                                textTransform: 'capitalize'
                              }}
                            >
                              {updatingParticipant === participantId ? 'Updating...' : value}
                            </Typography>
                          </Box>
                        )}
                      >
                        <MenuItem value="scheduled" sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
                            Scheduled
                          </Box>
                        </MenuItem>
                        <MenuItem value="present" sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                            Present
                          </Box>
                        </MenuItem>
                        <MenuItem value="late" sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                            Late
                          </Box>
                        </MenuItem>
                        <MenuItem value="absent" sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                            Absent
                          </Box>
                        </MenuItem>
                      </Select>
                    </Box>
                  );
                })}
              </Box>
              
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
      
      {/* Manage Participants Slider */}
      <AddParticipantSlider
        open={sliderOpen}
        onClose={handleCloseSlider}
        eventId={selectedEvent?.id}
        onAddParticipants={handleAddParticipants}
        loading={loading}
        sessionTitle={selectedEvent?.title || eventCourse}
        onRemoveParticipant={handleRemoveParticipant}
        onMoveParticipant={handleMoveParticipant}
        course={course}
      />
      
      {/* Participant Report Card Drawer */}
      <ParticipantDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        participant={selectedParticipant}
      />
    </MainCard>
  );
});

export default Attendees;
