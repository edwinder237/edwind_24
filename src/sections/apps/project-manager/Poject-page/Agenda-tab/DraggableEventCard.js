import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  Button,
  Divider,
  Collapse,
  TextField,
  useTheme,
  alpha,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Popover,
  Grid,
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  Person,
  Group,
  MoreVert,
  Edit,
  Delete,
  ContentCopy,
  Schedule,
  ArrowForward,
  ArrowBack,
  Palette,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useDispatch, useSelector } from 'store';
import { deleteEvent, getEvents } from 'store/reducers/calendar';
import { getSingleProject } from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';
import EditEventDialog from './EditEventDialog';

// Drag types
const ItemTypes = {
  EVENT: 'event'
};

const DraggableEventCard = ({ event, isSelected, onSelect, onTimeEdit, onMoveToNextDay, allEvents, project, isCompact = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { events } = useSelector((state) => state.calendar);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const colorPickerOpen = Boolean(colorPickerAnchorEl);

  // Predefined color options
  const colorOptions = [
    { name: 'Primary', value: theme.palette.primary.main },
    { name: 'Info', value: theme.palette.info.main },
    { name: 'Success', value: theme.palette.success.main },
    { name: 'Warning', value: theme.palette.warning.main },
    { name: 'Error', value: theme.palette.error.main },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Teal', value: '#009688' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Indigo', value: '#3f51b5' },
    { name: 'Cyan', value: '#00bcd4' },
    { name: 'Grey', value: '#607d8b' }
  ];

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.EVENT,
    item: {
      id: event.id,
      event: event,
      originalTime: event.start
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Generate time options (15-minute intervals)
  const timeOptions = useMemo(() => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
        times.push({ value: time24, label: time12 });
      }
    }
    return times;
  }, []);

  // Check if there's a previous day available (not the first day of the project)
  const hasPreviousDay = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return true; // Allow moving if no events context
    
    const currentEventDate = new Date(event.start);
    
    // Find the earliest event date in the project
    const earliestEvent = allEvents.reduce((earliest, evt) => {
      const evtDate = new Date(evt.start);
      return evtDate < earliest ? evtDate : earliest;
    }, new Date(allEvents[0].start));
    
    // Allow moving to previous day if current event is not on the first day
    const earliestDateString = earliestEvent.toDateString();
    const currentDateString = currentEventDate.toDateString();
    
    return currentDateString !== earliestDateString;
  }, [allEvents, event.start]);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Close dialog first
      setDeleteDialogOpen(false);
      
      // Delete event using Redux action
      await dispatch(deleteEvent(event.id, events));
      
      // Refresh calendar events
      if (project?.id) {
        await dispatch(getEvents(project.id));
      }
      
      // Refresh project data to update Beta tab
      if (project?.id) {
        await dispatch(getSingleProject(project.id));
      }
      
      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event deleted successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete event',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleColorPickerOpen = (event) => {
    event.stopPropagation();
    setColorPickerAnchorEl(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null);
  };

  const handleColorChange = async (newColor) => {
    try {
      handleColorPickerClose();
      
      // Update event color via API call
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: {
            ...event,
            color: newColor,
            backgroundColor: newColor
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event color');
      }

      // Refresh calendar events
      if (project?.id) {
        await dispatch(getEvents(project.id));
      }
      
      // Refresh project data to update Beta tab
      if (project?.id) {
        await dispatch(getSingleProject(project.id));
      }
      
      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event color updated successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );
    } catch (error) {
      console.error('Error updating event color:', error);
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update event color',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    }
  };

  const handleMenuAction = (action) => {
    handleMenuClose();
    switch (action) {
      case 'edit':
        setEditDialogOpen(true);
        break;
      case 'duplicate':
        // TODO: Implement duplicate event functionality
        break;
      case 'time':
        setIsEditingTime(true);
        break;
      case 'moveToNextDay':
        if (onTimeEdit) {
          // Calculate next day dates
          const currentStart = new Date(event.start);
          const currentEnd = new Date(event.end);
          
          const nextDayStart = new Date(currentStart);
          nextDayStart.setDate(nextDayStart.getDate() + 1);
          
          const nextDayEnd = new Date(currentEnd);
          nextDayEnd.setDate(nextDayEnd.getDate() + 1);
          
          const updatedEvent = {
            ...event,
            start: nextDayStart.toISOString(),
            end: nextDayEnd.toISOString()
          };
          
          onTimeEdit(updatedEvent);
        }
        break;
      case 'moveToPreviousDay':
        if (onTimeEdit && hasPreviousDay) {
          // Calculate previous day dates
          const currentStart = new Date(event.start);
          const currentEnd = new Date(event.end);
          
          const previousDayStart = new Date(currentStart);
          previousDayStart.setDate(previousDayStart.getDate() - 1);
          
          const previousDayEnd = new Date(currentEnd);
          previousDayEnd.setDate(previousDayEnd.getDate() - 1);
          
          const updatedEvent = {
            ...event,
            start: previousDayStart.toISOString(),
            end: previousDayEnd.toISOString()
          };
          
          onTimeEdit(updatedEvent);
        }
        break;
      case 'color':
        // Open color picker and close menu
        setColorPickerAnchorEl(menuAnchorEl);
        break;
      case 'delete':
        handleDeleteClick();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [event]);

  const getEventTypeColor = (event) => {
    // Use event color from database if available, otherwise fall back to type-based colors
    if (event.color) return event.color;
    if (event.eventType === 'course') return theme.palette.primary.main;
    if (event.eventType === 'meeting') return theme.palette.info.main;
    if (event.eventType === 'break') return theme.palette.warning.main;
    return theme.palette.grey[500];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
    <Card
      ref={drag}
      onClick={() => onSelect(event.id)}
      sx={{
        flex: 1,
        mb: isCompact ? 0 : 3,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.3s ease',
        border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
        borderLeftWidth: 4,
        borderLeftColor: getEventTypeColor(event),
        boxShadow: isSelected ? theme.shadows[3] : theme.shadows[0],
        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[2],
          transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.08)
        }
      }}
    >
      <CardContent sx={{ px: 1.5, py: 2, '&:last-child': { pb: 1 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: getEventTypeColor(event),
                  flexShrink: 0
                }}
              />
              <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1 }}>
                {event.title}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              {event.location && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Stack>
              )}

              {event.instructor && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.instructor.name}
                  </Typography>
                </Stack>
              )}

              {event.event_attendees && event.event_attendees.length > 0 && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.event_attendees.length} participants
                  </Typography>
                </Stack>
              )}

              {/* Group chips */}
              {event.event_groups && event.event_groups.length > 0 && (
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  {event.event_groups.map((eventGroup, index) => 
                    eventGroup.groups ? (
                      <Chip
                        key={`group-${eventGroup.groups.id}-${index}`}
                        label={eventGroup.groups.groupName}
                        size="small"
                        sx={{
                          backgroundColor: alpha(eventGroup.groups.chipColor || theme.palette.primary.main, 0.1),
                          color: eventGroup.groups.chipColor || theme.palette.primary.main,
                          border: `1px solid ${alpha(eventGroup.groups.chipColor || theme.palette.primary.main, 0.3)}`,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    ) : null
                  )}
                </Stack>
              )}
            </Stack>
          </Box>

          <Stack spacing={0.5} alignItems="flex-end" sx={{ mr: 3 }}>
            <Chip
              label={event.eventType || 'Event'}
              size="small"
              sx={{
                backgroundColor: alpha(getEventTypeColor(event), 0.1),
                color: getEventTypeColor(event),
                fontWeight: 500
              }}
            />
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTime(true);
              }}
              sx={{
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: `1px solid ${alpha(getEventTypeColor(event), 0.3)}`,
                backgroundColor: alpha(getEventTypeColor(event), 0.05),
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(getEventTypeColor(event), 0.12),
                  transform: 'scale(1.02)'
                }
              }}
            >
              <AccessTime sx={{ fontSize: 14, color: getEventTypeColor(event), mr: 0.5 }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                {formatTime(event.start)} - {formatTime(event.end)}
              </Typography>
            </Stack>
          </Stack>

          {/* Menu button in absolute position outside content flow */}
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                width: 20,
                height: 20,
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: alpha(theme.palette.action.hover, 0.5)
                }
              }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Stack>

        {/* Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              boxShadow: theme.shadows[3],
              minWidth: 160,
            }
          }}
        >
          <MenuItem onClick={() => handleMenuAction('edit')}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('time')}>
            <ListItemIcon>
              <Schedule fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Time</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('duplicate')}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuAction('moveToPreviousDay')}
            disabled={!hasPreviousDay}
            sx={{
              color: !hasPreviousDay ? 'text.disabled' : 'inherit'
            }}
          >
            <ListItemIcon>
              <ArrowBack 
                fontSize="small" 
                sx={{ color: !hasPreviousDay ? 'text.disabled' : 'inherit' }}
              />
            </ListItemIcon>
            <ListItemText>Move to Previous Day</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('moveToNextDay')}>
            <ListItemIcon>
              <ArrowForward fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move to Next Day</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('color')}>
            <ListItemIcon>
              <Palette fontSize="small" />
            </ListItemIcon>
            <ListItemText>Change Color</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => handleMenuAction('delete')}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Color Picker Popover */}
        <Popover
          open={colorPickerOpen}
          anchorEl={colorPickerAnchorEl}
          onClose={handleColorPickerClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              p: 2,
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              minWidth: 200,
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Choose Event Color
          </Typography>
          <Grid container spacing={1}>
            {colorOptions.map((color) => (
              <Grid item xs={4} key={color.name}>
                <Box
                  onClick={() => handleColorChange(color.value)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: color.value,
                    cursor: 'pointer',
                    border: event.color === color.value ? `3px solid ${theme.palette.text.primary}` : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  {event.color === color.value && (
                    <Typography 
                      sx={{ 
                        color: 'white', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      ✓
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Popover>

        {event.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {event.description}
          </Typography>
        )}

        {/* Time Edit Section */}
        <Collapse in={isEditingTime} timeout={300}>
          <Divider sx={{ my: 1, opacity: 0.6 }} />
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1
          }}>

            {/* Start Time Input */}
            <TextField
              type="time"
              size="small"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={allDay}
              sx={{
                width: 110,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem',
                  height: 28,
                  pl: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2]
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[3]
                  }
                },
                '& .MuiOutlinedInput-input': {
                  pl: 0.5
                }
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                opacity: allDay ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
                mx: 0.5
              }}
            >
              -
            </Typography>

            {/* End Time Input */}
            <TextField
              type="time"
              size="small"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={allDay}
              sx={{
                width: 110,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem',
                  height: 28,
                  pl: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2]
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[3]
                  }
                },
                '& .MuiOutlinedInput-input': {
                  pl: 0.5
                }
              }}
            />

            {/* All Day Checkbox */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              ml: 1.5,
              mr: 2
            }}>
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => {
                  setAllDay(e.target.checked);
                  if (e.target.checked) {
                    setStartTime('00:00');
                    setEndTime('23:59');
                  }
                }}
                style={{
                  marginRight: 4,
                  cursor: 'pointer',
                  transform: 'scale(0.8)'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  cursor: 'pointer',
                  fontWeight: allDay ? 600 : 400,
                  color: allDay ? 'primary.main' : 'text.secondary',
                  fontSize: '0.7rem'
                }}
                onClick={() => {
                  const newAllDay = !allDay;
                  setAllDay(newAllDay);
                  if (newAllDay) {
                    setStartTime('00:00');
                    setEndTime('23:59');
                  }
                }}
              >
                All day
              </Typography>
            </Box>

            {/* Action Buttons - Now on same row */}
            <Box sx={{
              display: 'flex',
              gap: 0.5,
              ml: 'auto'
            }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setIsEditingTime(false);
                  // Reset values on cancel
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  setStartTime(start.toTimeString().slice(0, 5));
                  setEndTime(end.toTimeString().slice(0, 5));
                  setAllDay(false);
                }}

              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={!startTime || !endTime}
                onClick={() => {
                  // Save time changes
                  if (startTime && endTime) {
                    const eventDate = new Date(event.start);
                    const [startHour, startMin] = startTime.split(':');
                    const [endHour, endMin] = endTime.split(':');

                    const newStart = new Date(eventDate);
                    newStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

                    const newEnd = new Date(eventDate);
                    newEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

                    // If end time is before start time, assume it's next day
                    if (newEnd <= newStart) {
                      newEnd.setDate(newEnd.getDate() + 1);
                    }

                    onTimeEdit({
                      ...event,
                      start: newStart.toISOString(),
                      end: newEnd.toISOString()
                    });
                  }
                  setIsEditingTime(false);
                }}

              >
                Save
              </Button>
            </Box>
          </Box>
        </Collapse>


      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    <Dialog
      open={deleteDialogOpen}
      onClose={handleDeleteCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        Delete Event
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete "{event.title}"? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={handleDeleteConfirm} color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>

    {/* Edit Event Dialog */}
    <EditEventDialog
      open={editDialogOpen}
      onClose={() => setEditDialogOpen(false)}
      event={event}
      project={project}
    />
    </>
  );
};

export default DraggableEventCard;