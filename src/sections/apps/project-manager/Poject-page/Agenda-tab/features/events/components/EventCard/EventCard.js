import React, { useMemo, useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  MoreVert,
  AccessTime,
  LocationOn,
  Person,
  Group,
  Edit,
  Delete,
  ColorLens,
  Videocam,
  MeetingRoom
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';

// Utils
import { formatTime, formatDuration, calculateEventDuration } from '../../../../utils/timeHelpers';
import { DRAG_TYPES, EVENT_TYPES, COLOR_OPTIONS } from '../../../../utils/constants';

// Sub-components
import EventColorPicker from './EventColorPicker';

const EventCard = React.memo(({ 
  event, 
  onEventSelect, 
  onEventEdit, 
  onEventDelete, 
  onColorChange,
  isDraggable = false,
  isSelected = false,
  showDetails = true
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Drag and drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPES.EVENT,
    item: { id: event.id, type: 'event', event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isDraggable,
  });

  // Memoized calculations
  const eventDuration = useMemo(() => {
    if (!event.start_time || !event.end_time) return 0;
    return calculateEventDuration(event.start_time, event.end_time);
  }, [event.start_time, event.end_time]);

  const formattedDuration = useMemo(() => {
    return formatDuration(eventDuration);
  }, [eventDuration]);

  const eventColor = useMemo(() => {
    const colorOption = COLOR_OPTIONS.find(c => c.value === event.color);
    return colorOption || COLOR_OPTIONS[0];
  }, [event.color]);

  // Calculate total participant count including those from groups, avoiding duplicates
  const totalParticipantCount = useMemo(() => {
    // Use a Set to track unique participant IDs
    const uniqueParticipantIds = new Set();
    
    // Add direct event participants
    if (event.participants?.length > 0) {
      event.participants.forEach(participant => {
        const id = participant.id || participant.participantId;
        if (id) uniqueParticipantIds.add(id);
      });
    }
    
    // Add participants from groups
    if (event.groups?.length > 0) {
      event.groups.forEach(group => {
        if (group.participants?.length > 0) {
          group.participants.forEach(participant => {
            const id = participant.participant?.id || participant.participantId;
            if (id) uniqueParticipantIds.add(id);
          });
        }
      });
    }
    
    return uniqueParticipantIds.size;
  }, [event.participants, event.groups]);

  // Event handlers
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onEventSelect && !isDragging) {
      onEventSelect(event.id);
    }
  }, [onEventSelect, event.id, isDragging]);

  const handleMenuClick = useCallback((e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEdit = useCallback(() => {
    handleMenuClose();
    if (onEventEdit) {
      onEventEdit(event);
    }
  }, [onEventEdit, event, handleMenuClose]);

  const handleDelete = useCallback(() => {
    handleMenuClose();
    if (onEventDelete) {
      onEventDelete(event.id);
    }
  }, [onEventDelete, event.id, handleMenuClose]);

  const handleColorPickerOpen = useCallback(() => {
    handleMenuClose();
    setColorPickerOpen(true);
  }, [handleMenuClose]);

  const handleColorPickerClose = useCallback(() => {
    setColorPickerOpen(false);
  }, []);

  const handleColorSelect = useCallback((color) => {
    if (onColorChange) {
      onColorChange(event.id, color);
    }
    setColorPickerOpen(false);
  }, [onColorChange, event.id]);

  // Memoized styles
  const cardStyles = useMemo(() => ({
    cursor: isDraggable ? 'move' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: isDragging ? 0.5 : 1,
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    border: isSelected 
      ? `2px solid ${theme.palette.primary.main}` 
      : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    borderLeft: `4px solid ${eventColor.value}`,
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'scale(1.02)',
    },
    mb: 1,
    position: 'relative'
  }), [
    isDraggable, 
    isDragging, 
    isSelected, 
    theme.palette.primary.main, 
    theme.palette.divider, 
    eventColor.value, 
    theme.shadows
  ]);

  return (
    <>
      <Card
        ref={isDraggable ? drag : null}
        sx={cardStyles}
        onClick={handleClick}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header with title and menu */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                lineHeight: 1.2,
                flex: 1,
                mr: 1
              }}
              noWrap
            >
              {event.title || 'Untitled Event'}
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 'normal', 
                color: theme.palette.text.secondary,
                marginLeft: '8px'
              }}>
                (ID: {event.id})
              </span>
            </Typography>
            
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.action.hover, 0.08) 
                }
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Stack>

          {/* Event details */}
          {showDetails && (
            <Stack spacing={1}>
              {/* Time and duration */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTime sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  {formattedDuration && ` (${formattedDuration})`}
                </Typography>
              </Stack>

              {/* Location / Meeting Link */}
              {event.deliveryMode === 'remote' && event.meetingLink ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Videocam sx={{ fontSize: '1rem', color: theme.palette.info.main }} />
                  <Typography
                    variant="body2"
                    color="info.main"
                    noWrap
                    component="a"
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Meeting Link
                  </Typography>
                </Stack>
              ) : event.location ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOn sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {event.location}
                  </Typography>
                </Stack>
              ) : null}

              {/* Participants/Groups info */}
              {(totalParticipantCount > 0 || event.groups?.length > 0) && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Group sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary">
                    {totalParticipantCount} participant{totalParticipantCount !== 1 ? 's' : ''}
                    {event.groups?.length > 0 && (
                      <span style={{ marginLeft: 4 }}>
                        ({event.groups.map(g => g.name || 'Group').join(', ')})
                      </span>
                    )}
                  </Typography>
                </Stack>
              )}

              {/* Event type chip */}
              {event.event_type && (
                <Box>
                  <Chip
                    label={event.event_type.replace('_', ' ').toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.7rem',
                      height: 20,
                      borderColor: eventColor.value,
                      color: eventColor.value,
                      backgroundColor: alpha(eventColor.value, 0.08)
                    }}
                  />
                </Box>
              )}
              <Chip
                icon={event.deliveryMode === 'remote'
                  ? <Videocam sx={{ fontSize: 13 }} />
                  : <MeetingRoom sx={{ fontSize: 13 }} />
                }
                label={event.deliveryMode === 'remote' ? 'Remote' : 'In Person'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  color: event.deliveryMode === 'remote'
                    ? theme.palette.info.main
                    : theme.palette.success.main,
                  backgroundColor: event.deliveryMode === 'remote'
                    ? alpha(theme.palette.info.main, 0.1)
                    : alpha(theme.palette.success.main, 0.1),
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    ml: 0.5,
                    mr: -0.5
                  }
                }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1, fontSize: '1rem' }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleColorPickerOpen}>
          <ColorLens sx={{ mr: 1, fontSize: '1rem' }} />
          Change Color
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <Delete sx={{ mr: 1, fontSize: '1rem' }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Color Picker Dialog */}
      <EventColorPicker
        open={colorPickerOpen}
        onClose={handleColorPickerClose}
        onColorSelect={handleColorSelect}
        currentColor={eventColor.value}
      />
    </>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;