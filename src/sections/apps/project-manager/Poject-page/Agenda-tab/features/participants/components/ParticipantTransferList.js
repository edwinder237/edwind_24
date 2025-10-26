import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Checkbox,
  Avatar,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Snackbar
} from '@mui/material';
import {
  Search,
  ArrowForward,
  ArrowBack,
  Groups,
  Person,
  SwapHoriz,
  CheckCircle,
  Settings,
  RemoveCircle,
  CheckCircleOutlined,
  AccessTime,
  CancelOutlined,
  Schedule,
  AccessTimeFilled
} from '@mui/icons-material';
import { useSelector } from 'store';

// Attendance status options
const ATTENDANCE_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', icon: <AccessTime />, color: 'info' },
  { value: 'present', label: 'Present', icon: <CheckCircleOutlined />, color: 'success' },
  { value: 'absent', label: 'Absent', icon: <CancelOutlined />, color: 'error' },
  { value: 'late', label: 'Late', icon: <AccessTimeFilled />, color: 'warning' }
];

const ParticipantTransferList = ({ 
  eventId, 
  onAddParticipants, 
  onRemoveParticipant,
  loading = false,
  sessionTitle,
  course = null // Add course prop to get maxParticipants info
}) => {
  const { singleProject, project_participants } = useSelector((state) => state.projects);
  
  // State for transfer list
  const [availableParticipants, setAvailableParticipants] = useState([]);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAttendees, setSearchAttendees] = useState('');
  const [includeGroups, setIncludeGroups] = useState(false);
  
  // State for auto-save notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [updatingAttendance, setUpdatingAttendance] = useState({});

  // Max participants validation
  const maxParticipants = course?.maxParticipants;
  const currentParticipantCount = eventAttendees.length;
  const hasMaxLimit = maxParticipants && maxParticipants > 0;
  const isAtMaxCapacity = hasMaxLimit && currentParticipantCount >= maxParticipants;
  const spotsRemaining = hasMaxLimit ? Math.max(0, maxParticipants - currentParticipantCount) : Infinity;

  // Update data when props change
  useEffect(() => {
    if (project_participants && singleProject && eventId) {
      updateTransferListData();
    }
  }, [project_participants, singleProject, eventId, includeGroups]);

  const updateTransferListData = () => {
    const participants = project_participants || [];
    const groups = singleProject?.groups || [];
    
    // Get current event details
    const currentEvent = singleProject?.events?.find(e => e.id.toString() === eventId?.toString());
    const existingParticipantIds = currentEvent?.event_attendees?.map(attendee => attendee.enrolleeId) || [];
    const existingGroupIds = currentEvent?.event_groups?.map(eventGroup => eventGroup.groupId) || [];
    
    // Available participants (not in event)
    const available = participants.filter(participant => 
      !existingParticipantIds.includes(participant.id)
    );
    
    // Event attendees (already in event) - include attendance_status from event_attendees
    const attendees = participants.filter(participant => 
      existingParticipantIds.includes(participant.id)
    ).map(participant => {
      // Find the corresponding event_attendee record to get the attendance_status
      const eventAttendee = currentEvent?.event_attendees?.find(attendee => 
        attendee.enrolleeId === participant.id
      );
      return {
        ...participant,
        attendance_status: eventAttendee?.attendance_status || 'scheduled'
      };
    });
    
    // Add groups if includeGroups is true
    if (includeGroups) {
      const availableGroups = groups.filter(group => 
        !existingGroupIds.includes(group.id)
      ).map(group => ({
        ...group,
        isGroup: true,
        participant: {
          firstName: group.groupName,
          lastName: '',
          email: `${group.participants?.length || 0} participants`,
          derpartement: 'Group'
        }
      }));
      
      const attendeeGroups = groups.filter(group => 
        existingGroupIds.includes(group.id)
      ).map(group => ({
        ...group,
        isGroup: true,
        attendance_status: 'scheduled', // Groups don't have individual attendance status
        participant: {
          firstName: group.groupName,
          lastName: '',
          email: `${group.participants?.length || 0} participants`,
          derpartement: 'Group'
        }
      }));
      
      setAvailableParticipants([...available, ...availableGroups]);
      setEventAttendees([...attendees, ...attendeeGroups]);
    } else {
      setAvailableParticipants(available);
      setEventAttendees(attendees);
    }
  };

  // Filter functions
  const filteredAvailable = useMemo(() => {
    return availableParticipants.filter(item => {
      const participant = item.participant;
      if (!participant) return false;
      
      const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
      const searchTerm = searchAvailable.toLowerCase();
      
      return searchTerm === '' || 
             fullName.toLowerCase().includes(searchTerm) ||
             (participant.email || '').toLowerCase().includes(searchTerm) ||
             (participant.derpartement || '').toLowerCase().includes(searchTerm);
    });
  }, [availableParticipants, searchAvailable]);

  const filteredAttendees = useMemo(() => {
    return eventAttendees.filter(item => {
      const participant = item.participant;
      if (!participant) return false;
      
      const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
      const searchTerm = searchAttendees.toLowerCase();
      
      return searchTerm === '' || 
             fullName.toLowerCase().includes(searchTerm) ||
             (participant.email || '').toLowerCase().includes(searchTerm) ||
             (participant.derpartement || '').toLowerCase().includes(searchTerm);
    });
  }, [eventAttendees, searchAttendees]);

  // Selection handlers
  const handleToggleAvailable = (item) => {
    setSelectedAvailable(prev => {
      const isSelected = prev.find(p => p.id === item.id);
      if (isSelected) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleToggleAttendee = (item) => {
    setSelectedAttendees(prev => {
      const isSelected = prev.find(p => p.id === item.id);
      if (isSelected) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAllAvailable = () => {
    if (selectedAvailable.length === filteredAvailable.length) {
      setSelectedAvailable([]);
    } else {
      setSelectedAvailable([...filteredAvailable]);
    }
  };

  const handleSelectAllAttendees = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees([...filteredAttendees]);
    }
  };

  // Update attendance status with auto-save and snackbar
  const handleUpdateAttendanceStatus = async (participant, newStatus) => {
    const participantKey = `${participant.id}`;
    
    // Set loading state for this participant
    setUpdatingAttendance(prev => ({ ...prev, [participantKey]: true }));
    
    try {
      const response = await fetch('/api/projects/updateAttendanceStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          participantId: participant.id,
          attendance_status: newStatus
        }),
      });

      if (response.ok) {
        // Dispatch custom event to notify Groups tab of attendance change
        const attendanceUpdateEvent = new CustomEvent('attendanceUpdated', {
          detail: { 
            projectId: selectedEvent.projectId || singleProject?.id,
            eventId: eventId,
            participantId: participant.id,
            newStatus: newStatus
          }
        });
        window.dispatchEvent(attendanceUpdateEvent);

        // Update local state immediately
        setEventAttendees(prev => prev.map(attendee => 
          attendee.id === participant.id 
            ? { ...attendee, attendance_status: newStatus }
            : attendee
        ));
        
        // Show success snackbar
        const participantName = `${participant.participant?.firstName || ''} ${participant.participant?.lastName || ''}`.trim();
        const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        setSnackbar({
          open: true,
          message: `${participantName || 'Participant'} marked as ${statusLabel}`,
          severity: 'success'
        });
      } else {
        const errorData = await response.json();
        console.error('Error updating attendance status:', errorData.error);
        
        // Show error snackbar
        setSnackbar({
          open: true,
          message: 'Failed to update attendance status',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      
      // Show error snackbar
      setSnackbar({
        open: true,
        message: 'Network error while updating attendance',
        severity: 'error'
      });
    } finally {
      // Remove loading state
      setUpdatingAttendance(prev => {
        const newState = { ...prev };
        delete newState[participantKey];
        return newState;
      });
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Transfer handlers
  const handleMoveToEvent = async () => {
    if (selectedAvailable.length === 0) return;
    
    const participants = selectedAvailable.filter(item => !item.isGroup);
    const groups = selectedAvailable.filter(item => item.isGroup);
    
    // Calculate total participants being added (including group members)
    const groupParticipantCount = groups.reduce((total, group) => {
      return total + (group.participants?.length || 0);
    }, 0);
    const totalNewParticipants = participants.length + groupParticipantCount;
    
    // Check max participants limit
    if (hasMaxLimit && (currentParticipantCount + totalNewParticipants) > maxParticipants) {
      const availableSpots = maxParticipants - currentParticipantCount;
      setSnackbar({
        open: true,
        message: `Cannot add ${totalNewParticipants} participants. Only ${availableSpots} spots remaining (Max: ${maxParticipants})`,
        severity: 'error'
      });
      return;
    }
    
    try {
      await onAddParticipants(participants, groups);
      
      // Update local state
      setAvailableParticipants(prev => prev.filter(item => 
        !selectedAvailable.some(selected => selected.id === item.id)
      ));
      setEventAttendees(prev => [...prev, ...selectedAvailable]);
      setSelectedAvailable([]);
      
      // Show success message with remaining spots
      if (hasMaxLimit) {
        const newRemainingSpots = maxParticipants - (currentParticipantCount + totalNewParticipants);
        setSnackbar({
          open: true,
          message: `Added ${totalNewParticipants} participants. ${newRemainingSpots} spots remaining.`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding participants:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add participants',
        severity: 'error'
      });
    }
  };

  const handleRemoveFromEvent = async () => {
    if (selectedAttendees.length === 0) return;
    
    try {
      // Remove each selected attendee
      for (const attendee of selectedAttendees) {
        if (!attendee.isGroup) {
          await onRemoveParticipant(attendee);
        }
        // Note: Group removal would need a separate API call if implemented
      }
      
      // Update local state
      setEventAttendees(prev => prev.filter(item => 
        !selectedAttendees.some(selected => selected.id === item.id)
      ));
      setAvailableParticipants(prev => [...prev, ...selectedAttendees]);
      setSelectedAttendees([]);
    } catch (error) {
      console.error('Error removing participants:', error);
    }
  };

  // Get attendance status icon and color
  const getAttendanceStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />;
      case 'absent':
        return <CancelOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />;
      case 'late':
        return <AccessTimeFilled style={{ color: '#fa8c16', fontSize: '14px' }} />;
      case 'scheduled':
      default:
        return <AccessTime style={{ color: '#1890ff', fontSize: '14px' }} />;
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'scheduled':
      default:
        return 'info';
    }
  };

  // Render participant item
  const renderParticipantItem = (item, isSelected, onToggle, isAttendee = false) => {
    const participant = item.participant;
    if (!participant) return null;
    
    const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
    const displayName = fullName || 'Unknown Participant';
    const attendanceStatus = item.attendance_status || 'scheduled';
    const participantKey = `${item.id}`;
    const isUpdating = updatingAttendance[participantKey];
    
    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton onClick={() => onToggle(item)} dense>
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={isSelected}
              tabIndex={-1}
              disableRipple
              size="small"
            />
          </ListItemIcon>
          <ListItemAvatar>
            <Avatar
              src={item.isGroup ? undefined : participant.profileImg}
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: item.isGroup ? item.chipColor || 'primary.main' : 
                         item.fromGroupId ? 'secondary.main' : 'grey.500'
              }}
            >
              {item.isGroup ? (
                <Groups fontSize="small" />
              ) : (
                displayName.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                  {displayName}
                </Typography>
                {isAttendee && (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={attendanceStatus}
                      onChange={(e) => handleUpdateAttendanceStatus(item, e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={isUpdating}
                      sx={{ 
                        height: 24, 
                        fontSize: '0.7rem',
                        '& .MuiSelect-select': {
                          py: 0.25,
                          px: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }
                      }}
                      renderValue={(value) => (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {isUpdating ? (
                            <CircularProgress size={12} />
                          ) : (
                            getAttendanceStatusIcon(value)
                          )}
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {isUpdating ? 'Saving...' : (value.charAt(0).toUpperCase() + value.slice(1))}
                          </Typography>
                        </Stack>
                      )}
                    >
                      {ATTENDANCE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {React.cloneElement(option.icon, { 
                              style: { fontSize: '16px', color: option.color === 'success' ? '#52c41a' : 
                                     option.color === 'error' ? '#ff4d4f' : 
                                     option.color === 'warning' ? '#fa8c16' : '#1890ff' } 
                            })}
                            <Typography variant="body2">{option.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>
            }
            secondary={
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {participant.email || 'No email'}
                </Typography>
                {participant.derpartement && (
                  <Chip 
                    label={participant.derpartement} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
                {item.fromGroupName && (
                  <Chip 
                    label={`From: ${item.fromGroupName}`} 
                    size="small" 
                    color="secondary"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
                {item.isGroup && (
                  <Chip 
                    label="Group" 
                    size="small" 
                    color="primary"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
            }
          />
          {isAttendee && (
            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
              <Settings fontSize="small" />
            </IconButton>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  // Render transfer list card
  const renderTransferCard = (title, items, selectedItems, onToggle, onSelectAll, searchValue, onSearchChange, color = 'primary') => {
    const selectedCount = selectedItems.length;
    const totalCount = items.length;
    
    // Calculate attendance stats for Event Attendees
    const isEventAttendees = title.includes('Event Attendees');
    let attendanceStats = null;
    if (isEventAttendees) {
      attendanceStats = {
        scheduled: items.filter(item => (item.attendance_status || 'scheduled') === 'scheduled').length,
        present: items.filter(item => (item.attendance_status || 'scheduled') === 'present').length,
        absent: items.filter(item => (item.attendance_status || 'scheduled') === 'absent').length,
        late: items.filter(item => (item.attendance_status || 'scheduled') === 'late').length
      };
    }
    
    return (
      <Card sx={{ height: 500 }}>
        <CardHeader
          avatar={
            <Checkbox
              onClick={onSelectAll}
              checked={selectedCount === totalCount && totalCount > 0}
              indeterminate={selectedCount > 0 && selectedCount < totalCount}
              disabled={totalCount === 0}
              size="small"
            />
          }
          title={
            <Stack direction="column" spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" fontSize="0.9rem">
                  {title}
                </Typography>
                <Chip 
                  label={totalCount} 
                  size="small" 
                  color={color}
                  variant="outlined"
                />
              </Stack>
              {isEventAttendees && attendanceStats && (
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip 
                    icon={<AccessTime style={{ fontSize: '12px' }} />}
                    label={attendanceStats.scheduled}
                    size="small"
                    color="info"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                  <Chip 
                    icon={<CheckCircleOutlined style={{ fontSize: '12px' }} />}
                    label={attendanceStats.present}
                    size="small"
                    color="success"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                  <Chip 
                    icon={<AccessTimeFilled style={{ fontSize: '12px' }} />}
                    label={attendanceStats.late}
                    size="small"
                    color="warning"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                  <Chip 
                    icon={<CancelOutlined style={{ fontSize: '12px' }} />}
                    label={attendanceStats.absent}
                    size="small"
                    color="error"
                    variant="filled"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                </Stack>
              )}
            </Stack>
          }
          subheader={`${selectedCount}/${totalCount} selected`}
          sx={{ 
            pb: 1,
            '& .MuiCardHeader-title': { fontSize: '0.9rem' },
            '& .MuiCardHeader-subheader': { fontSize: '0.75rem' }
          }}
        />
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          <List
            sx={{
              height: 350,
              overflowY: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper'
            }}
            dense
          >
            {items.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">
                  {searchValue ? 'No items found matching your search.' : 'No items available.'}
                </Typography>
              </Box>
            ) : (
              items.map((item) => renderParticipantItem(
                item,
                selectedItems.some(selected => selected.id === item.id),
                onToggle,
                title.includes('Event Attendees')
              ))
            )}
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="column">
          <Typography variant="h6">Manage Participants</Typography>
          {sessionTitle && (
            <Typography variant="body2" color="text.secondary">
              Session: {sessionTitle}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Include Groups">
            <Button
              size="small"
              variant={includeGroups ? "contained" : "outlined"}
              onClick={() => setIncludeGroups(!includeGroups)}
              startIcon={<Groups />}
            >
              Groups
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Max Participants Warning */}
      {hasMaxLimit && (
        <Alert 
          severity={isAtMaxCapacity ? "error" : currentParticipantCount >= maxParticipants * 0.8 ? "warning" : "info"}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Typography variant="body2">
              {isAtMaxCapacity 
                ? `Maximum capacity reached (${currentParticipantCount}/${maxParticipants})`
                : `${currentParticipantCount}/${maxParticipants} participants enrolled`
              }
            </Typography>
            {!isAtMaxCapacity && (
              <Chip 
                label={`${spotsRemaining} spots remaining`}
                size="small"
                color={spotsRemaining <= 3 ? "warning" : "success"}
                variant="filled"
              />
            )}
          </Stack>
        </Alert>
      )}

      {/* Transfer List */}
      <Grid container spacing={2} alignItems="center">
        {/* Available Participants */}
        <Grid item xs={5}>
          {renderTransferCard(
            'Available Participants',
            filteredAvailable,
            selectedAvailable,
            handleToggleAvailable,
            handleSelectAllAvailable,
            searchAvailable,
            setSearchAvailable,
            'primary'
          )}
        </Grid>

        {/* Transfer Controls */}
        <Grid item xs={2}>
          <Stack spacing={1} alignItems="center">
            <Tooltip title={
              isAtMaxCapacity 
                ? `Maximum capacity reached (${maxParticipants} participants)`
                : `Add ${selectedAvailable.length} to event`
            }>
              <span>
                <Button
                  variant="contained"
                  onClick={handleMoveToEvent}
                  disabled={selectedAvailable.length === 0 || loading || isAtMaxCapacity}
                  sx={{ minWidth: 48, width: 48, height: 48 }}
                  color={isAtMaxCapacity ? "error" : "primary"}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ArrowForward />
                  )}
                </Button>
              </span>
            </Tooltip>
            
            <Tooltip title={`Remove ${selectedAttendees.length} from event`}>
              <span>
                <Button
                  variant="outlined"
                  onClick={handleRemoveFromEvent}
                  disabled={selectedAttendees.length === 0 || loading}
                  sx={{ minWidth: 48, width: 48, height: 48 }}
                >
                  <ArrowBack />
                </Button>
              </span>
            </Tooltip>

            <Divider sx={{ width: '100%', my: 1 }} />
            
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {selectedAvailable.length + selectedAttendees.length} selected
            </Typography>
          </Stack>
        </Grid>

        {/* Event Attendees */}
        <Grid item xs={5}>
          {renderTransferCard(
            'Event Attendees',
            filteredAttendees,
            selectedAttendees,
            handleToggleAttendee,
            handleSelectAllAttendees,
            searchAttendees,
            setSearchAttendees,
            'success'
          )}
        </Grid>
      </Grid>

      {/* Summary */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <Chip 
              icon={<Person />}
              label={`${filteredAvailable.length} Available`} 
              variant="outlined" 
              color="primary"
            />
            <Chip 
              icon={<CheckCircle />}
              label={`${filteredAttendees.length} In Event`} 
              variant="outlined" 
              color="success"
            />
            {hasMaxLimit && (
              <Chip 
                label={`Max: ${maxParticipants}`} 
                variant="outlined" 
                color={isAtMaxCapacity ? "error" : "info"}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Total Project Participants: {(availableParticipants.length + eventAttendees.length)}
            </Typography>
            {hasMaxLimit && (
              <Typography variant="body2" color={isAtMaxCapacity ? "error.main" : "text.secondary"}>
                {isAtMaxCapacity 
                  ? "At maximum capacity" 
                  : `${spotsRemaining} spots remaining`
                }
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Snackbar for auto-save notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParticipantTransferList;