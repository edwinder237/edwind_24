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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Menu,
} from "@mui/material";
import { Remove, Person, Group, Add, ChevronRight, ArrowRight } from "@mui/icons-material";
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from "components/Dropdown";

// project imports
import MainCard from "components/MainCard";
import ParticipantDrawer from "./ParticipantDrawer";
import { useSelector, useDispatch } from "store";
import { getSingleProject, getEvents } from "store/reducers/projects";
import { openSnackbar } from "store/reducers/snackbar";

// constants
import { ATTENDANCE_STATUS_CHOICES, PARTICIPANT_ACTION_CHOICES } from "constants";

// assets
import { UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, BulbOutlined } from "@ant-design/icons";

// assets
const Avatar1 = "/assets/images/users/avatar-1.png";

// ===========================||  ||=========================== //

const Attendees = React.memo(({ eventParticipants, eventCourse, groupName, selectedEvent, onAddParticipants, onRemoveParticipant, onMoveParticipant, course = null, isGroupOperationLoading = false }) => {
  const dispatch = useDispatch();
  const { singleProject, project_participants } = useSelector((state) => state.projects);
  const [loading, setLoading] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
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


  const handleAddParticipant = () => {
    setAddParticipantOpen(true);
  };

  const handleCloseAddParticipant = () => {
    setAddParticipantOpen(false);
    setSelectedGroups([]);
    setSelectedParticipants([]);
    setActiveTab(0);
  };

  // Handle toggle group selection
  const handleToggleGroup = (group) => {
    setSelectedGroups(prev => {
      const isSelected = prev.some(g => g.id === group.id);
      if (isSelected) {
        return prev.filter(g => g.id !== group.id);
      } else {
        return [...prev, group];
      }
    });
  };

  // Handle toggle participant selection
  const handleToggleParticipant = (participant) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p.id === participant.id);
      if (isSelected) {
        return prev.filter(p => p.id !== participant.id);
      } else {
        return [...prev, participant];
      }
    });
  };

  // Handle applying multiple selections
  const handleApplySelections = async () => {
    if (selectedGroups.length === 0 && selectedParticipants.length === 0) {
      return;
    }

    setDialogLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Add selected groups
      for (const group of selectedGroups) {
        try {
          const response = await fetch('/api/projects/addEventGroup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: selectedEvent.id, groupId: group.id })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error adding group:', error);
        }
      }

      // Add selected participants
      for (const participant of selectedParticipants) {
        try {
          const response = await fetch('/api/projects/addEventParticipant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: selectedEvent.id, participantId: participant.id })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error adding participant:', error);
        }
      }

      // Show summary message
      if (successCount > 0 && errorCount === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Successfully added ${successCount} ${successCount === 1 ? 'item' : 'items'} to event`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else if (successCount > 0 && errorCount > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Added ${successCount} items, ${errorCount} failed`,
          variant: 'alert',
          alert: { color: 'warning' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to add items to event',
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      // Refresh project data
      if (singleProject?.id) {
        await dispatch(getSingleProject(singleProject.id));
        await dispatch(getEvents(singleProject.id));
      }

      handleCloseAddParticipant();
    } catch (error) {
      console.error('Error applying selections:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to add items to event',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDialogLoading(false);
    }
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

  // Handle removing participant from event via dropdown
  const handleRemoveParticipantFromEvent = async (participantId, participant) => {
    if (!selectedEvent?.id) {
      console.error('No event ID available for participant removal');
      return;
    }

    const participantName = participant?.participant ? 
      `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
      `Participant ${participantId}`;

    try {
      const response = await fetch('/api/projects/removeEventParticipant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          participantId: participantId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant from event');
      }

      // Refresh project data to update the UI
      if (singleProject?.id) {
        await dispatch(getSingleProject(singleProject.id));
        await dispatch(getEvents(singleProject.id));
      }

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} removed from event`,
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      console.error('Error removing participant from event:', error);
      
      // Show error notification
      dispatch(openSnackbar({
        open: true,
        message: `Failed to remove ${participantName} from event`,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
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

  // Handle moving participant to a different group
  const handleMoveParticipantToGroup = useCallback(async (participantId, participant, targetGroup) => {
    if (!targetGroup?.id || !singleProject?.id) {
      console.error('Missing target group or project for participant move');
      return;
    }

    const participantName = participant?.participant ? 
      `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
      `Participant ${participantId}`;

    try {
      // Find the participant's current group
      const currentGroup = singleProject.groups?.find(group => 
        group.participants?.some(p => p.participantId === participantId)
      );

      // Step 1: Remove participant from their current group (if they have one)
      if (currentGroup?.id) {
        const removeFromGroupResponse = await fetch('/api/projects/remove-participant-from-group', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: currentGroup.id,
            participantId: parseInt(participantId)
          })
        });

        if (!removeFromGroupResponse.ok) {
          throw new Error(`Failed to remove participant from current group: ${currentGroup.groupName}`);
        }
      }

      // Step 2: Add participant to the target group
      const addToGroupResponse = await fetch('/api/projects/add-participant-to-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: singleProject.id,
          groupId: targetGroup.id,
          participantId: parseInt(participantId)
        })
      });

      if (!addToGroupResponse.ok) {
        throw new Error(`Failed to add participant to target group: ${targetGroup.groupName}`);
      }

      // Refresh project data to update the UI
      if (singleProject?.id) {
        await dispatch(getSingleProject(singleProject.id));
        await dispatch(getEvents(singleProject.id));
      }

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: currentGroup 
          ? `${participantName} moved from ${currentGroup.groupName} to ${targetGroup.groupName}` 
          : `${participantName} added to ${targetGroup.groupName}`,
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      console.error('Error moving participant to group:', error);
      
      // Show error notification
      dispatch(openSnackbar({
        open: true,
        message: `Failed to move ${participantName} to ${targetGroup.groupName}`,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  }, [singleProject, dispatch]);

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
          <Stack direction="row" spacing={0.5}>
            <IconButton 
              size="small" 
              onClick={handleAddParticipant}
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
          </Stack>
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

                      {/* Status Dropdown with Nested Options */}
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
                          ...ATTENDANCE_STATUS_CHOICES.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() => {
                                if (updatingParticipant === null) {
                                  handleStatusChange(participantId, status.value);
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
                          <DropdownNestedMenuItem
                            key="move-to-group"
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TeamOutlined style={{ fontSize: 14, color: 'inherit' }} />
                                Move to Group
                              </Box>
                            }
                            rightIcon={<ArrowRight style={{ fontSize: 16 }} />}
                            menu={
                              singleProject?.groups?.length > 0 ? 
                                singleProject.groups.map((group) => (
                                  <DropdownMenuItem
                                    key={`move-to-${group.id}`}
                                    onClick={() => {
                                      handleMoveParticipantToGroup(
                                        participantId, 
                                        eventParticipant, 
                                        group
                                      );
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <TeamOutlined style={{ fontSize: 16, color: '#1976d2' }} />
                                      {group.groupName || `Group ${group.id}`}
                                    </Box>
                                  </DropdownMenuItem>
                                )) : [
                                  <DropdownMenuItem key="no-groups" disabled>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <TeamOutlined style={{ fontSize: 16, color: 'rgba(0,0,0,0.26)' }} />
                                      No groups available
                                    </Box>
                                  </DropdownMenuItem>
                                ]
                            }
                            sx={{ 
                              fontSize: '0.75rem',
                              color: 'info.main',
                              '&:hover': {
                                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.08)
                              }
                            }}
                          />,
                          <DropdownMenuItem
                            key="remove"
                            onClick={() => {
                              handleRemoveParticipantFromEvent(participantId, participant);
                            }}
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
      
      
      {/* Participant Report Card Drawer */}
      <ParticipantDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        participant={selectedParticipant}
      />


      {/* Add Participant Dialog */}
      <Dialog 
        open={addParticipantOpen} 
        onClose={handleCloseAddParticipant}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            maxHeight: '90vh',
            height: 'auto',
            maxWidth: '480px'
          }
        }}
      >
        <MainCard
          title={
            <Stack direction="column" spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Add color="primary" />
                <Typography variant="h6">Add Attendee(s)</Typography>
              </Stack>
              {selectedEvent?.title && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                  {selectedEvent.title}
                </Typography>
              )}
            </Stack>
          }
          content={false}
          sx={{ m: 0, boxShadow: 'none' }}
        >
          <Stack spacing={0}>
            {/* Tab Navigation */}
            <Tabs
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              aria-label="add participant tabs"
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab 
                label="Groups" 
                icon={<TeamOutlined />} 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                label="Participants" 
                icon={<Person />} 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                label="Suggested" 
                icon={<BulbOutlined />} 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ 
              maxHeight: 'calc(90vh - 160px)', 
              overflowY: 'auto',
              p: 3 
            }}>
              {/* Groups Tab */}
              {activeTab === 0 && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Select multiple groups to add to this event.
                  </Typography>

                  {(() => {
                    const projectGroups = singleProject?.groups || [];
                    const eventGroups = selectedEvent?.event_groups || [];
                    const availableGroups = projectGroups.filter(group =>
                      !eventGroups.some(eg => eg.groupId === group.id)
                    );

                    if (availableGroups.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                          No available groups to add
                        </Typography>
                      );
                    }

                    return (
                      <Stack spacing={3}>
                        {/* Selection Summary */}
                        {selectedGroups.length > 0 && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), 
                            borderRadius: 1, 
                            border: 1, 
                            borderColor: 'primary.main' 
                          }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" color="primary.main" fontWeight={500}>
                                {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''} selected
                              </Typography>
                              <Chip 
                                label={`${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''}`}
                                size="small"
                                color="primary"
                                variant="filled"
                              />
                            </Stack>
                          </Box>
                        )}

                        {/* Available Groups */}
                        <Box>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              Available Groups ({availableGroups.length})
                            </Typography>
                            {availableGroups.length > 1 && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                  const allSelected = availableGroups.every(group => 
                                    selectedGroups.some(sg => sg.id === group.id)
                                  );
                                  if (allSelected) {
                                    setSelectedGroups([]);
                                  } else {
                                    setSelectedGroups(availableGroups);
                                  }
                                }}
                                sx={{
                                  color: 'primary.main',
                                  textTransform: 'none',
                                  fontSize: '0.8rem',
                                  '&:hover': {
                                    backgroundColor: 'primary.lighter'
                                  }
                                }}
                              >
                                {availableGroups.every(group => selectedGroups.some(sg => sg.id === group.id)) 
                                  ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            {availableGroups.map((group) => {
                              const isSelected = selectedGroups.some(sg => sg.id === group.id);
                              return (
                                <Box
                                  key={group.id}
                                  onClick={() => handleToggleGroup(group)}
                                  sx={{
                                    p: 1,
                                    border: 1,
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                    '&:hover': {
                                      backgroundColor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                                      borderColor: 'primary.main'
                                    }
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Checkbox 
                                      checked={isSelected} 
                                      color="primary"
                                      size="small"
                                    />
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: group.chipColor || 'primary.main'
                                      }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={500} noWrap>
                                        {group.groupName}
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                          • {group.participants?.length || 0} members
                                        </Typography>
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Stack>
                    );
                  })()}
                </Stack>
              )}

              {/* Individual Participants Tab */}
              {activeTab === 1 && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Select individual participants to add to this event.
                  </Typography>

                  {(() => {
                    const projectParticipants = project_participants || [];
                    const currentEventParticipants = eventParticipants || [];
                    const availableParticipants = projectParticipants.filter(pp => 
                      !currentEventParticipants.some(ep => ep.enrolleeId === pp.id)
                    );

                    if (availableParticipants.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                          No available participants to add
                        </Typography>
                      );
                    }

                    return (
                      <Stack spacing={3}>
                        {/* Selection Summary */}
                        {selectedParticipants.length > 0 && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08), 
                            borderRadius: 1, 
                            border: 1, 
                            borderColor: 'secondary.main' 
                          }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" color="secondary.main" fontWeight={500}>
                                {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                              </Typography>
                              <Chip 
                                label={`${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`}
                                size="small"
                                color="secondary"
                                variant="filled"
                              />
                            </Stack>
                          </Box>
                        )}

                        {/* Available Participants */}
                        <Box>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                              Available Participants ({availableParticipants.length})
                            </Typography>
                            {availableParticipants.length > 1 && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                  const allSelected = availableParticipants.every(participant => 
                                    selectedParticipants.some(sp => sp.id === participant.id)
                                  );
                                  if (allSelected) {
                                    setSelectedParticipants([]);
                                  } else {
                                    setSelectedParticipants(availableParticipants);
                                  }
                                }}
                                sx={{
                                  color: 'secondary.main',
                                  textTransform: 'none',
                                  fontSize: '0.8rem',
                                  '&:hover': {
                                    backgroundColor: 'secondary.lighter'
                                  }
                                }}
                              >
                                {availableParticipants.every(participant => selectedParticipants.some(sp => sp.id === participant.id)) 
                                  ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            {availableParticipants.map((participant) => {
                              const isSelected = selectedParticipants.some(sp => sp.id === participant.id);
                              return (
                                <Box
                                  key={participant.id}
                                  onClick={() => handleToggleParticipant(participant)}
                                  sx={{
                                    p: 1,
                                    border: 1,
                                    borderColor: isSelected ? 'secondary.main' : 'divider',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? (theme) => alpha(theme.palette.secondary.main, 0.08) : 'transparent',
                                    '&:hover': {
                                      backgroundColor: isSelected ? (theme) => alpha(theme.palette.secondary.main, 0.12) : 'action.hover',
                                      borderColor: 'secondary.main'
                                    }
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Checkbox 
                                      checked={isSelected} 
                                      color="secondary"
                                      size="small"
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={500} noWrap>
                                        {participant.participant ? 
                                          `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
                                          'Unknown Participant'
                                        }
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                          • {participant.participant?.role?.title || 'Participant'}
                                        </Typography>
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Stack>
                    );
                  })()}
                </Stack>
              )}

              {/* Suggested Tab */}
              {activeTab === 2 && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Participants suggested based on course role requirements.
                  </Typography>

                  {(() => {
                    // Get course role requirements from selectedEvent.course.course_participant_roles
                    const courseRoleIds = selectedEvent?.course?.course_participant_roles?.map(cpr => cpr.role?.id).filter(Boolean) || [];
                    
                    if (courseRoleIds.length === 0) {
                      return (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <BulbOutlined style={{ fontSize: '2rem', color: '#ccc', marginBottom: '1rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            No role requirements defined for this course
                          </Typography>
                          {selectedEvent?.courseId && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Course ID: {selectedEvent.courseId}
                            </Typography>
                          )}
                        </Box>
                      );
                    }

                    const projectParticipants = project_participants || [];
                    const currentEventParticipants = eventParticipants || [];
                    
                    // Filter participants who match course role requirements and are not already in the event
                    const suggestedParticipants = projectParticipants.filter(pp => {
                      // Check if participant is already in the event
                      const isInEvent = currentEventParticipants.some(ep => ep.enrolleeId === pp.id);
                      if (isInEvent) return false;
                      
                      // Check if participant's role matches course requirements
                      const participantRoleId = pp.participant?.role?.id;
                      return participantRoleId && courseRoleIds.includes(participantRoleId);
                    });

                    if (suggestedParticipants.length === 0) {
                      return (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <BulbOutlined style={{ fontSize: '2rem', color: '#ccc', marginBottom: '1rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            No participants match the course role requirements
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Required roles: {courseRoleIds.map(id => {
                              // Try to find role title from existing participants
                              const roleExample = projectParticipants.find(p => 
                                (p.participant?.roleId === id || p.participant?.role?.id === id)
                              );
                              return roleExample?.participant?.role?.title || `Role ${id}`;
                            }).join(', ')}
                          </Typography>
                        </Box>
                      );
                    }

                    return (
                      <Stack spacing={3}>
                        {/* Selection Summary */}
                        {selectedParticipants.length > 0 && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.08), 
                            borderRadius: 1, 
                            border: 1, 
                            borderColor: 'success.main' 
                          }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" color="success.main" fontWeight={500}>
                                {selectedParticipants.length} suggested participant{selectedParticipants.length > 1 ? 's' : ''} selected
                              </Typography>
                              <Chip 
                                label={`${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`}
                                size="small"
                                color="success"
                                variant="filled"
                              />
                            </Stack>
                          </Box>
                        )}

                        {/* Course Role Requirements Info */}
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.08), 
                          borderRadius: 1, 
                          border: 1, 
                          borderColor: 'info.main' 
                        }}>
                          <Typography variant="caption" color="info.main" fontWeight={500}>
                            Course requires: {courseRoleIds.map(id => {
                              const roleExample = projectParticipants.find(p => 
                                (p.participant?.roleId === id || p.participant?.role?.id === id)
                              );
                              return roleExample?.participant?.role?.title || `Role ${id}`;
                            }).join(', ')}
                          </Typography>
                        </Box>

                        {/* Suggested Participants */}
                        <Box>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 600 }}>
                              Suggested Participants ({suggestedParticipants.length})
                            </Typography>
                            {suggestedParticipants.length > 1 && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                  const allSelected = suggestedParticipants.every(participant => 
                                    selectedParticipants.some(sp => sp.id === participant.id)
                                  );
                                  if (allSelected) {
                                    setSelectedParticipants(prev => 
                                      prev.filter(sp => !suggestedParticipants.some(suggested => suggested.id === sp.id))
                                    );
                                  } else {
                                    setSelectedParticipants(prev => {
                                      const newSelections = suggestedParticipants.filter(suggested => 
                                        !prev.some(sp => sp.id === suggested.id)
                                      );
                                      return [...prev, ...newSelections];
                                    });
                                  }
                                }}
                                sx={{
                                  color: 'success.main',
                                  textTransform: 'none',
                                  fontSize: '0.8rem',
                                  '&:hover': {
                                    backgroundColor: 'success.lighter'
                                  }
                                }}
                              >
                                {suggestedParticipants.every(participant => selectedParticipants.some(sp => sp.id === participant.id)) 
                                  ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            {suggestedParticipants.map((participant) => {
                              const isSelected = selectedParticipants.some(sp => sp.id === participant.id);
                              return (
                                <Box
                                  key={participant.id}
                                  onClick={() => handleToggleParticipant(participant)}
                                  sx={{
                                    p: 1,
                                    border: 1,
                                    borderColor: isSelected ? 'success.main' : 'divider',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.08) : 'transparent',
                                    '&:hover': {
                                      backgroundColor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.12) : 'action.hover',
                                      borderColor: 'success.main'
                                    }
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Checkbox 
                                      checked={isSelected} 
                                      color="success"
                                      size="small"
                                    />
                                    <BulbOutlined style={{ fontSize: '16px', color: '#4caf50' }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={500} noWrap>
                                        {participant.participant ? 
                                          `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
                                          'Unknown Participant'
                                        }
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                          • {participant.participant?.role?.title || 'Participant'}
                                        </Typography>
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Stack>
                    );
                  })()}
                </Stack>
              )}
            </Box>

            {/* Actions - Fixed at bottom */}
            <Stack 
              direction="row" 
              justifyContent="flex-end" 
              spacing={2} 
              sx={{ 
                p: 3, 
                pt: 2,
                borderTop: 1, 
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                position: 'sticky',
                bottom: 0
              }}
            >
              <Button 
                onClick={handleCloseAddParticipant}
                disabled={dialogLoading}
                variant="outlined"
                sx={{
                  borderColor: 'grey.300',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.400',
                    backgroundColor: 'grey.50'
                  },
                  textTransform: 'none',
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={handleApplySelections}
                disabled={(selectedGroups.length === 0 && selectedParticipants.length === 0) || dialogLoading}
                startIcon={dialogLoading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500'
                  },
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  fontWeight: 500
                }}
              >
                {dialogLoading ? 'Adding...' : `Add ${selectedGroups.length + selectedParticipants.length} Attendee(s)`}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Dialog>
    </MainCard>
  );
});

export default Attendees;
