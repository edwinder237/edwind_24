import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  Select,
  FormControl,
  Tooltip,
  CircularProgress,
  useMediaQuery,
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
  Add,
  Remove,
  Info,
  MeetingRoom,
  Share,
  ChevronRight,
  Email,
  PersonAdd,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useDispatch, useSelector } from 'store';
import { deleteEvent, updateEvent, duplicateEvent, addGroupToEvent } from 'store/commands/eventCommands';
import { fetchProjectAgenda } from 'store/reducers/project/agenda';
import { openSnackbar } from 'store/reducers/snackbar';
import EventDetailsSection from './EventDetailsSection';
import EmailAccessDialog from 'components/EmailAccessDialog';
import SendInviteDialog from 'components/SendInviteDialog';
import { APP_COLOR_OPTIONS } from 'constants/eventColors';
import { useTimeRangeInput } from 'hooks/useTimeRangeInput';
import { getTimezoneOffset, convertTimezone } from 'utils/timezone';

// Drag types
const ItemTypes = {
  EVENT: 'event'
};

const DraggableEventCard = ({ event, isSelected, isConflicting = false, onSelect, onTimeEdit, onMoveToNextDay, allEvents, project, isCompact = false, onEventUpdate, onEditEvent }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use new Redux architecture - get data from projectAgenda store
  // IMPORTANT: Use shallow equality to prevent unnecessary re-renders
  const { events, groups, participants, loading: agendaLoading } = useSelector(
    (state) => state.projectAgenda,
    (left, right) => {
      // Only re-render if the actual data changed, not just the reference
      return left.events === right.events &&
             left.groups === right.groups &&
             left.participants === right.participants &&
             left.loading === right.loading;
    }
  );
  const groupsLoading = agendaLoading;
  const project_participants = participants;
  
  
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    reset: resetTimes,
    endTimeError,
    endTimeHelperText,
    canSave: canSaveTime,
    _setStartTimeRaw,
    _setEndTimeRaw
  } = useTimeRangeInput({ minDurationMinutes: 60 });
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Edit dialog state removed - now managed at parent level (AgendaTimeline)
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [groupDropdownAnchorEl, setGroupDropdownAnchorEl] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [manageEventDialogOpen, setManageEventDialogOpen] = useState(false);
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
  const [shareMenuAnchorEl, setShareMenuAnchorEl] = useState(null);
  const [emailAccessDialogOpen, setEmailAccessDialogOpen] = useState(false);
  const [emailAccessParticipants, setEmailAccessParticipants] = useState([]);
  const [loadingEmailAccess, setLoadingEmailAccess] = useState(false);
  const [sendInviteDialogOpen, setSendInviteDialogOpen] = useState(false);
  const [sendInviteParticipants, setSendInviteParticipants] = useState([]);
  const [loadingSendInvite, setLoadingSendInvite] = useState(false);
  const menuOpen = Boolean(menuAnchorEl);
  const colorPickerOpen = Boolean(colorPickerAnchorEl);
  const shareMenuOpen = Boolean(shareMenuAnchorEl);

  // Use standard color options from constants
  const colorOptions = APP_COLOR_OPTIONS;

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

  // Calculate total unique participant count from event attendees only
  const totalParticipantCount = useMemo(() => {
    const uniqueParticipants = new Set();
    
    // Count only direct attendees (includes both individual and group-based attendees)
    if (event.event_attendees?.length > 0) {
      event.event_attendees.forEach(attendee => {
        if (attendee.enrolleeId) {
          uniqueParticipants.add(attendee.enrolleeId);
        }
      });
    }
    
    // Note: We don't count from event_groups anymore since participants 
    // should be in event_attendees after sync-event-attendees runs
    
    return uniqueParticipants.size;
  }, [event.event_attendees]);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = (e) => {
    e?.stopPropagation();
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Close dialog first
      setDeleteDialogOpen(false);
      
      // Use semantic command for delete with proper state management
      await dispatch(deleteEvent({
        eventId: parseInt(event.id),
        eventTitle: event.title || 'Event',
        projectId: project?.id
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
      // Error notification is handled by the semantic command
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

  // Share submenu handlers
  const handleShareMenuOpen = (e) => {
    e.stopPropagation();
    setShareMenuAnchorEl(e.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchorEl(null);
  };

  const handleShareAction = async (action, e) => {
    e?.stopPropagation();
    handleShareMenuClose();
    handleMenuClose();

    switch (action) {
      case 'sendAccessToParticipants':
        // Open Email Access dialog to select which tool credentials to send
        try {
          const attendeeCount = event.event_attendees?.length || 0;
          if (attendeeCount === 0) {
            dispatch(
              openSnackbar({
                open: true,
                message: 'No participants in this event. Please add participants first.',
                variant: 'alert',
                alert: { color: 'warning' },
                close: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
              })
            );
            return;
          }

          // Fetch participants with their tool accesses for the dialog
          setLoadingEmailAccess(true);
          const response = await fetch('/api/participants/fetch-event-participants-with-tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: event.id
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load participant data');
          }

          // Set participants for the dialog and open it
          setEmailAccessParticipants(result.participants || []);
          setEmailAccessDialogOpen(true);
        } catch (error) {
          console.error('Error loading participant data:', error);
          dispatch(
            openSnackbar({
              open: true,
              message: error.message || 'Failed to load participant data',
              variant: 'alert',
              alert: { color: 'error' },
              close: false,
              anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
            })
          );
        } finally {
          setLoadingEmailAccess(false);
        }
        break;

      case 'sendInviteToInstructor':
        // Send calendar invite to lead instructor for this specific event
        try {
          // Get lead instructor - check multiple sources:
          // 1. event_instructors relation (from fetchProjectAgenda)
          // 2. event.instructor direct field
          // 3. Fall back to project's lead instructor if no event-specific instructor
          let leadInstructor = event.event_instructors?.[0]?.instructor || event.instructor;

          // If no event-specific instructor, try to get from project instructors
          if (!leadInstructor && project?.project_instructors?.length > 0) {
            const projectLeadInstructor = project.project_instructors.find(
              pi => pi.instructorType === 'lead' || pi.instructorType === 'primary'
            ) || project.project_instructors[0];
            leadInstructor = projectLeadInstructor?.instructor;
          }

          if (!leadInstructor || !leadInstructor.email) {
            dispatch(
              openSnackbar({
                open: true,
                message: 'No instructor assigned to this event. Please assign an instructor first.',
                variant: 'alert',
                alert: { color: 'warning' },
                close: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
              })
            );
            return;
          }

          // Send calendar invite using the single-invite API
          const response = await fetch('/api/projects/send-single-calendar-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project?.id,
              eventId: event.id,
              participantEmail: leadInstructor.email,
              participantFirstName: leadInstructor.firstName || 'Instructor',
              participantLastName: leadInstructor.lastName || '',
              projectTitle: project?.title || 'Training Project',
              includeMeetingLink: true
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to send invite');
          }

          const instructorName = `${leadInstructor.firstName || ''} ${leadInstructor.lastName || ''}`.trim() || leadInstructor.email;
          dispatch(
            openSnackbar({
              open: true,
              message: `Calendar invite sent to ${instructorName}`,
              variant: 'alert',
              alert: { color: 'success' },
              close: false,
              anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
            })
          );
        } catch (error) {
          console.error('Error sending invite to instructor:', error);
          dispatch(
            openSnackbar({
              open: true,
              message: error.message || 'Failed to send instructor invite',
              variant: 'alert',
              alert: { color: 'error' },
              close: false,
              anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
            })
          );
        }
        break;

      case 'sendInviteToParticipants':
        // Open dialog to select participants and send calendar invites
        try {
          const participantCount = event.event_attendees?.length || 0;
          if (participantCount === 0) {
            dispatch(
              openSnackbar({
                open: true,
                message: 'No participants in this event. Please add participants first.',
                variant: 'alert',
                alert: { color: 'warning' },
                close: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
              })
            );
            return;
          }

          setLoadingSendInvite(true);

          // Fetch participants with their data for the dialog
          const response = await fetch('/api/participants/fetch-event-participants-with-tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: event.id })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load participant data');
          }

          // Set participants for the dialog and open it
          setSendInviteParticipants(result.participants || []);
          setSendInviteDialogOpen(true);
        } catch (error) {
          console.error('Error loading participant data:', error);
          dispatch(
            openSnackbar({
              open: true,
              message: error.message || 'Failed to load participants',
              variant: 'alert',
              alert: { color: 'error' },
              close: false,
              anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
            })
          );
        } finally {
          setLoadingSendInvite(false);
        }
        break;

      default:
        break;
    }
  };

  // Handler for sending credentials via EmailAccessDialog
  const handleSendEmailCredentials = async ({ participants: emailParticipants, credentials }) => {
    try {
      const response = await fetch('/api/email/send-credentials-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: emailParticipants,
          credentials: credentials,
          projectName: project?.title || 'Training Project'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails');
      }

      const { summary } = result;
      let message = `Email sending completed!\n`;
      message += `Emails sent: ${summary.emailsSent}\n`;
      if (summary.emailsFailed > 0) {
        message += `Failed: ${summary.emailsFailed}\n`;
      }
      message += `Credential types: ${summary.credentialTypes}`;

      dispatch(openSnackbar({
        open: true,
        message: message,
        variant: 'alert',
        alert: { color: summary.emailsFailed > 0 ? 'warning' : 'success' },
        close: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
      }));

    } catch (error) {
      console.error('Failed to send email:', error);
      dispatch(openSnackbar({
        open: true,
        message: `Failed to send emails: ${error.message}`,
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
      }));
      throw error;
    }
  };

  // Handler for sending calendar invites via SendInviteDialog
  const handleSendCalendarInvites = async (selectedParticipants) => {
    try {
      const response = await fetch('/api/projects/send-calendar-invites-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project?.id,
          eventId: event.id,
          projectTitle: project?.title || 'Training Project',
          includeMeetingLink: true,
          participantIds: selectedParticipants.map(p => p.participant?.id || p.id)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send calendar invites');
      }

      const { summary } = result;
      let message = `Calendar invites sent to ${summary?.emailsSent || 0} participant(s)`;
      if (summary?.emailsFailed > 0) {
        message += ` (${summary.emailsFailed} failed)`;
      }

      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: summary?.emailsFailed > 0 ? 'warning' : 'success' },
        close: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
      }));

    } catch (error) {
      console.error('Failed to send calendar invites:', error);
      dispatch(openSnackbar({
        open: true,
        message: `Failed to send invites: ${error.message}`,
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
      }));
      throw error;
    }
  };

  const handleColorChange = async (newColor) => {
    try {
      handleColorPickerClose();
      
      // Use semantic command for updating event color
      // IMPORTANT: Preserve existing event data to prevent losing course association
      await dispatch(updateEvent({
        eventId: parseInt(event.id),
        updates: {
          // Core event data (preserve existing values)
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          location: event.location,
          description: event.description,
          eventType: event.eventType,
          
          // Course data (preserve existing course association)
          courseId: event.courseId,
          course: event.course,
          
          // Instructor data (preserve existing instructor)
          instructorId: event.instructorId,
          instructor: event.instructor,
          instructors: event.instructors,
          
          // Color data (new values)
          color: newColor,
          backgroundColor: newColor,
          
          // Other metadata (preserve existing values)
          notes: event.notes,
          status: event.status,
          capacity: event.capacity,
          isPublic: event.isPublic
        },
        projectId: project?.id
      }));
    } catch (error) {
      console.error('Error updating event color:', error);
      // Error notification is handled by the semantic command
    }
  };

  // Handle quick group assignment using new Redux architecture
  const handleQuickGroupAssign = async (groupId, e) => {
    e?.stopPropagation();
    
    // Set loading state
    setIsLoadingGroups(true);
    
    try {
      // Use semantic command for adding group to event
      await dispatch(addGroupToEvent({
        eventId: parseInt(event.id),
        groupId: parseInt(groupId),
        projectId: project?.id
      }));
      
      // Success notification and cache invalidation are handled automatically by RTK Query
      // No need for manual refresh - the RTK Query mutation handles this via onQueryStarted
    } catch (error) {
      console.error('Error assigning group to event:', error);
      // Error notification is handled by the semantic command
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Handle quick participant assignment
  const handleQuickParticipantAssign = async (participantId, e) => {
    e?.stopPropagation();
    
    try {
      const response = await fetch('/api/projects/addEventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, participantId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign participant to event');
      }

      // Refresh project agenda data to ensure consistency with database
      if (project?.id) {
        await dispatch(fetchProjectAgenda(project.id, true)); // Force refresh
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Participant assigned to event successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error assigning participant to event:', error);
      
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to assign participant to event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  };

  const handleMenuAction = async (action, e) => {
    e?.stopPropagation();

    switch (action) {
      case 'edit':
        handleMenuClose();
        if (onEditEvent) {
          onEditEvent(event);
        }
        break;
      case 'duplicate':
        handleMenuClose();
        try {
          // Use semantic command for duplicating event
          await dispatch(duplicateEvent({
            originalEventId: parseInt(event.id),
            projectId: project?.id,
            duplicateData: {
              // Add one hour to the original event time for the duplicate
              start: new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString(),
              end: new Date(new Date(event.end).getTime() + 60 * 60 * 1000).toISOString()
            }
          }));
        } catch (error) {
          console.error('Error duplicating event:', error);
        }
        break;
      case 'time':
        handleMenuClose();
        setIsEditingTime(true);
        break;
      case 'moveToNextDay':
        handleMenuClose();
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
        handleMenuClose();
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
        // Don't close menu here since we're opening color picker
        break;
      case 'manage':
        handleMenuClose();
        setEventDetailsLoading(true);
        setManageEventDialogOpen(true);
        // Simulate loading time and then show content
        setTimeout(() => {
          setEventDetailsLoading(false);
        }, 800);
        break;
      case 'delete':
        // Don't close menu here - handleDeleteClick will do it
        handleDeleteClick(e);
        break;
      default:
        handleMenuClose();
        break;
    }
  };

  React.useEffect(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      _setStartTimeRaw(start.toTimeString().slice(0, 5));
      _setEndTimeRaw(end.toTimeString().slice(0, 5));
    }
  }, [event, _setStartTimeRaw, _setEndTimeRaw]);


  // Group dropdown handlers
  const handleGroupClick = (e) => {
    e.stopPropagation();
    setGroupDropdownAnchorEl(e.currentTarget);
    setGroupDropdownOpen(true);
  };

  const handleGroupDropdownClose = () => {
    setGroupDropdownOpen(false);
    setGroupDropdownAnchorEl(null);
  };

  const handleGroupChange = async (newGroupId) => {
    // Set loading state
    setIsLoadingGroups(true);
    
    try {
      // Update the event with the new group assignment
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: {
            ...event,
            selectedGroups: [newGroupId] // Replace with single group selection
          }
        })
      });

      if (response.ok) {
        
        // Update the local event state immediately for instant UI feedback
        const selectedGroup = groups.find(g => g.id === parseInt(newGroupId));
        if (onEventUpdate && selectedGroup) {
          const updatedEventData = {
            event_groups: [{
              groups: selectedGroup
            }]
          };
          onEventUpdate(event.id, updatedEventData);
        }
        
        // Refresh project agenda data to ensure consistency with database
        if (project?.id) {
          await dispatch(fetchProjectAgenda(project.id, true)); // Force refresh
        }
        
        dispatch(
          openSnackbar({
            open: true,
            message: 'Group assignment updated successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: false
          })
        );
      }
    } catch (error) {
      console.error('Error updating group assignment:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update group assignment',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setIsLoadingGroups(false);
    }
    handleGroupDropdownClose();
  };

  // Handle group removal
  const handleRemoveGroup = async () => {
    // Set loading state
    setIsLoadingGroups(true);
    
    try {
      // Update the event to remove all group assignments
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: {
            ...event,
            selectedGroups: [] // Remove all groups
          }
        })
      });

      if (response.ok) {
        // Update the local event state immediately for instant UI feedback
        if (onEventUpdate) {
          const updatedEventData = {
            event_groups: [] // Remove all groups
          };
          onEventUpdate(event.id, updatedEventData);
        }
        
        // Refresh project agenda data to ensure consistency with database
        if (project?.id) {
          await dispatch(fetchProjectAgenda(project.id, true)); // Force refresh
        }
        
        dispatch(
          openSnackbar({
            open: true,
            message: 'Group removed from event successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: false
          })
        );
      }
    } catch (error) {
      console.error('Error removing group from event:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to remove group from event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setIsLoadingGroups(false);
    }
    handleGroupDropdownClose();
  };

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
      id={`event-card-${event.id}`}
      ref={drag}
      onClick={() => onSelect(event.id)}
      sx={{
        p: 2,
        flex: 1,
        mb: isCompact ? 0 : 3,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.3s ease',
        border: isConflicting 
          ? `2px solid ${theme.palette.error.main}` 
          : `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
        borderLeftWidth: 4,
        borderLeftColor: isConflicting ? theme.palette.error.main : getEventTypeColor(event),
        boxShadow: isConflicting 
          ? `0 0 8px ${alpha(theme.palette.error.main, 0.3)}`
          : isSelected ? theme.shadows[3] : theme.shadows[0],
        bgcolor: isConflicting
          ? alpha(theme.palette.error.main, 0.1)
          : isSelected ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        position: 'relative',
        ...(isConflicting && {
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.02)' },
            '100%': { transform: 'scale(1)' }
          }
        }),
        '&:hover': {
          boxShadow: isConflicting
            ? `0 0 12px ${alpha(theme.palette.error.main, 0.4)}`
            : theme.shadows[2],
          transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
          bgcolor: isConflicting
            ? alpha(theme.palette.error.main, 0.15)
            : isSelected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.08)
        }
      }}
    >
      <CardContent >
        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConflicting ? theme.palette.error.main : getEventTypeColor(event),
                  flexShrink: 0
                }}
              />
              {isConflicting && (
                <Tooltip title="Scheduling Conflict!" arrow>
                  <Box sx={{ 
                    fontSize: '1rem',
                    color: theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    animation: 'blink 1.5s infinite',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 }
                    }
                  }}>
                    ⚠️
                  </Box>
                </Tooltip>
              )}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1 }}>
                  {event.title}
                  {!matchDownSM && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 'normal', 
                      color: theme.palette.text.secondary,
                      marginLeft: '6px'
                    }}>
                      (ID: {event.id})
                    </span>
                  )}
                </Typography>
                
                {/* Course title or missing course warning */}
                {event.eventType === 'course' && (
                  <>
                    {event.course?.title ? (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          fontStyle: 'italic',
                          fontSize: '0.75rem',
                          mt: 0.25,
                          display: 'block'
                        }}
                      >
                        {event.course.title}
                      </Typography>
                    ) : (
                      <Typography 
                        variant="caption" 
                        color="error.main" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          mt: 0.25,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        ⚠️ No Course Linked
                      </Typography>
                    )}
                  </>
                )}
              </Box>
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

              {event.room && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <MeetingRoom sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.room.name}
                    {event.room.location && (
                      <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                        ({event.room.location})
                      </Typography>
                    )}
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

              {totalParticipantCount > 0 && !matchDownSM && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {totalParticipantCount} participant{totalParticipantCount !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              )}

              {/* Group chips or quick assignment dropdown - only for course events */}
              {event.eventType === 'course' && (() => {
                // Check if event has any actual groups assigned
                const hasActualGroups = event.event_groups && 
                  event.event_groups.length > 0 && 
                  event.event_groups.some(eg => eg.groups);
                
                
                const hasIndividualParticipants = event.event_participants && 
                  event.event_participants.length > 0;

                if (hasActualGroups || hasIndividualParticipants) {
                  return (
                    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                      {/* Group chips */}
                      {hasActualGroups && event.event_groups.map((eventGroup, index) => 
                        eventGroup.groups ? (
                          <Chip
                            key={`group-${eventGroup.groups.id}-${index}`}
                            label={eventGroup.groups.groupName}
                            size="small"
                            onClick={handleGroupClick}
                            sx={{
                              backgroundColor: alpha(eventGroup.groups.chipColor || theme.palette.primary.main, 0.1),
                              color: eventGroup.groups.chipColor || theme.palette.primary.main,
                              border: `1px solid ${alpha(eventGroup.groups.chipColor || theme.palette.primary.main, 0.3)}`,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              height: 22,
                              cursor: 'pointer',
                              '& .MuiChip-label': {
                                px: 1
                              },
                              '&:hover': {
                                backgroundColor: alpha(eventGroup.groups.chipColor || theme.palette.primary.main, 0.2),
                                boxShadow: 1
                              }
                            }}
                          />
                        ) : null
                      )}
                      
                      {/* Individual participant chips */}
                      {hasIndividualParticipants && event.event_participants.map((eventParticipant, index) => 
                        eventParticipant.participant ? (
                          <Chip
                            key={`participant-${eventParticipant.participant_id}-${index}`}
                            label={`${eventParticipant.participant.firstName} ${eventParticipant.participant.lastName}`}
                            size="small"
                            icon={<Person sx={{ fontSize: '14px !important' }} />}
                            onClick={handleGroupClick}
                            sx={{
                              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              height: 22,
                              cursor: 'pointer',
                              '& .MuiChip-label': {
                                px: 1
                              },
                              '& .MuiChip-icon': {
                                fontSize: 14,
                                color: 'inherit'
                              },
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                                boxShadow: 1
                              }
                            }}
                          />
                        ) : null
                      )}
                    </Stack>
                  );
                } else {
                  return (
                    <Box sx={{ 
                      mt: 0.5
                    }}>
                      {/* Add Groups Dropdown */}
                      {(() => {
                        const hasGroups = groups.length > 0;

                        if (isLoadingGroups || groupsLoading) {
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CircularProgress size={12} />
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Loading...
                              </Typography>
                            </Box>
                          );
                        }

                        if (!hasGroups) {
                          return (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              No groups available
                            </Typography>
                          );
                        }

                        return (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              displayEmpty
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const [type, id] = e.target.value.split('-');
                                  if (type === 'group') {
                                    handleQuickGroupAssign(id, e);
                                  }
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              variant="outlined"
                              sx={{
                                fontSize: '0.7rem',
                                bgcolor: 'transparent',
                                border: `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
                                borderRadius: 1,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none'
                                },
                                '& .MuiSelect-select': {
                                  py: 0.25,
                                  px: 0.75,
                                  fontSize: '0.7rem',
                                  fontWeight: 400,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: 'text.secondary'
                                },
                                '&:hover': {
                                  border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
                                  '& .MuiSelect-select': {
                                    color: 'primary.main'
                                  }
                                }
                              }}
                              renderValue={() => (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Add sx={{ fontSize: 12, color: 'inherit', opacity: 0.7 }} />
                                  <Typography sx={{ fontSize: '0.7rem', color: 'inherit' }}>
                                    Add Group
                                  </Typography>
                                </Box>
                              )}
                            >
                              {/* Groups Section */}
                              {hasGroups && groups.map((group) => (
                                <MenuItem key={`group-${group.id}`} value={`group-${group.id}`}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Group sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: group.chipColor || theme.palette.primary.main
                                      }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                        {group.groupName}
                                      </Typography>
                                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                        Group • {group.participants?.length || 0} members
                                      </Typography>
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      })()}
                    </Box>
                  );
                }
              })()}
            </Stack>
          </Box>

          <Stack spacing={0.5} alignItems="flex-end" sx={{ mr: matchDownSM ? 1.5 : 3, flexShrink: 0 }}>
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
                  fontSize: matchDownSM ? '0.7rem' : '0.75rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                {formatTime(event.start)} - {formatTime(event.end)}
              </Typography>
              {/* Show timezone conversion if different from project - show what time it is for participants in event timezone */}
              {event.timezone && event.timezone !== project?.project_settings?.timezone && project?.project_settings?.timezone && (
                <Tooltip
                  title={`Event is in ${getTimezoneOffset(event.timezone)}. For participants in that timezone, the project time of ${formatTime(event.start)} ${getTimezoneOffset(project.project_settings.timezone)} is ${convertTimezone(event.start, project.project_settings.timezone, event.timezone)} ${getTimezoneOffset(event.timezone)}`}
                  arrow
                >
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      color: 'text.disabled',
                      ml: 0.5,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ({convertTimezone(event.start, project.project_settings.timezone, event.timezone)} {getTimezoneOffset(event.timezone)})
                  </Typography>
                </Tooltip>
              )}
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
          {matchDownSM && (
            <MenuItem onClick={(e) => handleMenuAction('manage', e)}>
              <ListItemIcon>
                <Info fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Event</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={(e) => handleMenuAction('edit', e)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={(e) => handleMenuAction('time', e)}>
            <ListItemIcon>
              <Schedule fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Time</ListItemText>
          </MenuItem>
          <MenuItem onClick={(e) => handleMenuAction('duplicate', e)}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={(e) => handleMenuAction('moveToPreviousDay', e)}
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
          <MenuItem onClick={(e) => handleMenuAction('moveToNextDay', e)}>
            <ListItemIcon>
              <ArrowForward fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move to Next Day</ListItemText>
          </MenuItem>
          <MenuItem onClick={(e) => handleMenuAction('color', e)}>
            <ListItemIcon>
              <Palette fontSize="small" />
            </ListItemIcon>
            <ListItemText>Change Color</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleShareMenuOpen}
            sx={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListItemIcon>
                <Share fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share</ListItemText>
            </Box>
            <ChevronRight fontSize="small" sx={{ color: 'text.secondary' }} />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={(e) => handleMenuAction('delete', e)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Share Submenu */}
        <Menu
          anchorEl={shareMenuAnchorEl}
          open={shareMenuOpen}
          onClose={handleShareMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              boxShadow: theme.shadows[3],
              minWidth: 200,
              ml: 0.5
            }
          }}
        >
          <MenuItem
            onClick={(e) => handleShareAction('sendAccessToParticipants', e)}
            disabled={loadingEmailAccess}
          >
            <ListItemIcon>
              {loadingEmailAccess ? <CircularProgress size={20} /> : <Email fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary="Email Access"
              secondary={event.event_attendees?.length > 0
                ? `${event.event_attendees.length} participant(s)`
                : 'No participants'}
              secondaryTypographyProps={{
                variant: 'caption',
                sx: { fontSize: '0.7rem', opacity: 0.8 }
              }}
            />
          </MenuItem>
          <MenuItem onClick={(e) => handleShareAction('sendInviteToInstructor', e)}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Send Invite to Instructor"
              secondary={(() => {
                // Check event-specific instructor first
                let leadInstructor = event.event_instructors?.[0]?.instructor || event.instructor;
                let isProjectInstructor = false;

                // Fall back to project lead instructor
                if (!leadInstructor && project?.project_instructors?.length > 0) {
                  const projectLeadInstructor = project.project_instructors.find(
                    pi => pi.instructorType === 'lead' || pi.instructorType === 'primary'
                  ) || project.project_instructors[0];
                  leadInstructor = projectLeadInstructor?.instructor;
                  isProjectInstructor = true;
                }

                if (leadInstructor) {
                  const name = `${leadInstructor.firstName || ''} ${leadInstructor.lastName || ''}`.trim() || leadInstructor.email || 'Lead Instructor';
                  return isProjectInstructor ? `${name} (Project Lead)` : name;
                }
                return 'No instructor assigned';
              })()}
              secondaryTypographyProps={{
                variant: 'caption',
                sx: { fontSize: '0.7rem', opacity: 0.8 }
              }}
            />
          </MenuItem>
          <MenuItem onClick={(e) => handleShareAction('sendInviteToParticipants', e)}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Send Invite to Participants"
              secondary={event.event_attendees?.length > 0
                ? `${event.event_attendees.length} participant(s)`
                : 'No participants'}
              secondaryTypographyProps={{
                variant: 'caption',
                sx: { fontSize: '0.7rem', opacity: 0.8 }
              }}
            />
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
                        color: color.textColor || 'white', 
                        fontSize: 16, 
                        fontWeight: 'bold',
                        textShadow: color.textColor === '#000000' ? '1px 1px 2px rgba(255,255,255,0.5)' : '1px 1px 2px rgba(0,0,0,0.5)'
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


        {/* Time Edit Section */}
        <Collapse in={isEditingTime} timeout={300}>
          <Divider sx={{ my: 1, opacity: 0.6 }} />
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            p: 1,
            flexWrap: 'nowrap'
          }}>
            {/* Time inputs */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TextField
                type="time"
                size="small"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={allDay}
                sx={{
                  width: 95,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.75rem',
                    height: 28,
                    '& input': {
                      px: 0.5
                    }
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ px: 0.25 }}>-</Typography>
              <TextField
                type="time"
                size="small"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={allDay}
                error={endTimeError}
                helperText={endTimeHelperText}
                sx={{
                  width: 95,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.75rem',
                    height: 28,
                    '& input': {
                      px: 0.5
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.65rem',
                    mx: 0,
                    mt: 0.25
                  }
                }}
              />
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setIsEditingTime(false);
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  resetTimes(start.toTimeString().slice(0, 5), end.toTimeString().slice(0, 5));
                  setAllDay(false);
                }}
                sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={!canSaveTime}
                onClick={() => {
                  if (startTime && endTime) {
                    const eventDate = new Date(event.start);
                    const [startHour, startMin] = startTime.split(':');
                    const [endHour, endMin] = endTime.split(':');

                    const newStart = new Date(eventDate);
                    newStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

                    const newEnd = new Date(eventDate);
                    newEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

                    onTimeEdit({
                      ...event,
                      start: newStart.toISOString(),
                      end: newEnd.toISOString()
                    });
                  }
                  setIsEditingTime(false);
                }}
                sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
              >
                Save
              </Button>
            </Stack>
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
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          borderRadius: 0,
          minWidth: 400
        }
      }}
    >
      <DialogTitle 
        id="delete-dialog-title"
        sx={{
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        Delete Event
      </DialogTitle>
      <DialogContent sx={{ pb: 3, px: 3 }}>
        <DialogContentText 
          id="delete-dialog-description"
          sx={{
            color: theme.palette.text.secondary,
            mt: 3
          }}
        >
          Are you sure you want to delete "{event.title}"? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleDeleteCancel}
          variant="outlined"
          sx={{
            color: theme.palette.primary.main,
            borderColor: theme.palette.divider,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDeleteConfirm}
          variant="contained"
          color="error"
          autoFocus
          sx={{
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>

    {/* Edit Event Dialog - Now managed at parent level (AgendaTimeline) */}

    {/* Group Selection Popover */}
    <Popover
      open={groupDropdownOpen}
      anchorEl={groupDropdownAnchorEl}
      onClose={handleGroupDropdownClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: isLoadingGroups || groupsLoading ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
            pointerEvents: isLoadingGroups || groupsLoading ? 'all' : 'none'
          }
        }
      }}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 200,
          maxWidth: 300,
          borderRadius: 2,
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
          Change Group Assignment
        </Typography>
        <Divider />
        <Box sx={{ mt: 1 }}>
          {(() => {
            // Show loading state
            if (isLoadingGroups || groupsLoading) {
              return (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  py: 3,
                  px: 2
                }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
                    Loading groups...
                  </Typography>
                </Box>
              );
            }
            
            // Show no groups available
            if (!groups || groups.length === 0) {
              return (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No groups available
                  </Typography>
                </MenuItem>
              );
            }
            
            // Show groups list
            const menuItems = [
              // Add remove group option at the top if event has groups
              ...(event.event_groups && event.event_groups.length > 0 ? [{
                id: 'remove',
                isRemove: true
              }] : []),
              // Add all available groups
              ...groups.map(group => ({ ...group, isRemove: false }))
            ];

            return menuItems.map((item, index) => {
              if (item.isRemove) {
                return (
                  <React.Fragment key="remove-group-fragment">
                    <MenuItem
                      onClick={handleRemoveGroup}
                      sx={{
                        borderRadius: 1,
                        mx: 0.5,
                        my: 0.25,
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <Remove sx={{ fontSize: 16, color: 'error.main' }} />
                        <Typography variant="body2" fontWeight={500} color="error.main">
                          Remove Group
                        </Typography>
                      </Stack>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                  </React.Fragment>
                );
              } else {
                return (
                  <MenuItem
                    key={item.id}
                    onClick={() => handleGroupChange(item.id)}
                    sx={{
                      borderRadius: 1,
                      mx: 0.5,
                      my: 0.25,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: item.chipColor || theme.palette.primary.main
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {item.groupName || `Group ${item.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.participants?.length || 0} participants
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                );
              }
            });
          })()}
        </Box>
      </Box>
    </Popover>

    {/* Manage Event Dialog - Mobile Only */}
    <Dialog
      open={manageEventDialogOpen}
      onClose={() => {
        setManageEventDialogOpen(false);
        setEventDetailsLoading(false);
      }}
      fullScreen={matchDownSM}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...(matchDownSM && {
            margin: 0,
            maxHeight: '100%',
            borderRadius: 0
          }),
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: getEventTypeColor(event),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Info />
        Event Details
        {eventDetailsLoading && (
          <Box sx={{ ml: 'auto' }}>
            <CircularProgress 
              size={20} 
              sx={{ 
                color: 'white',
                opacity: 0.8
              }} 
            />
          </Box>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: matchDownSM ? '100%' : 'auto', position: 'relative' }}>
        {eventDetailsLoading ? (
          // Loading State
          <Box sx={{ 
            height: matchDownSM ? 'calc(100vh - 140px)' : '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            bgcolor: 'background.default'
          }}>
            <CircularProgress 
              size={60} 
              sx={{ 
                color: getEventTypeColor(event),
                mb: 2
              }} 
            />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Loading Event Details...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 3 }}>
              Fetching participants, modules, and session information
            </Typography>
            
            {/* Skeleton placeholders for better UX */}
            <Stack spacing={2} sx={{ width: '100%', px: 3, mt: 3 }}>
              <Box sx={{ 
                height: 60, 
                bgcolor: alpha(getEventTypeColor(event), 0.1), 
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }} />
              <Box sx={{ 
                height: 40, 
                bgcolor: alpha(getEventTypeColor(event), 0.08), 
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite 0.2s'
              }} />
              <Box sx={{ 
                height: 80, 
                bgcolor: alpha(getEventTypeColor(event), 0.06), 
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite 0.4s'
              }} />
            </Stack>
          </Box>
        ) : (
          // Actual Content
          <Box sx={{ 
            height: matchDownSM ? 'calc(100vh - 140px)' : 'auto',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(getEventTypeColor(event), 0.3),
              borderRadius: '3px',
              '&:hover': {
                background: alpha(getEventTypeColor(event), 0.5),
              },
            },
          }}>
            <EventDetailsSection
              selectedDate={new Date(event.start)}
              selectedEventId={event.id}
              project={project}
              availableRoles={[]}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{
        p: 2,
        px: 3,
        pb: matchDownSM ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : 2,
        bgcolor: 'background.paper',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: matchDownSM ? 'sticky' : 'relative',
        bottom: 0,
        zIndex: 10,
        gap: 1.5,
        flexDirection: matchDownSM ? 'row' : 'row',
        '& > button': {
          minHeight: 48,
          fontSize: '1rem'
        }
      }}>
        <Button
          onClick={() => {
            setManageEventDialogOpen(false);
            setEventDetailsLoading(false);
          }}
          variant="outlined"
          fullWidth={matchDownSM}
          disabled={eventDetailsLoading}
          sx={{
            borderColor: alpha(getEventTypeColor(event), 0.3),
            color: getEventTypeColor(event),
            '&:hover': {
              borderColor: getEventTypeColor(event),
              bgcolor: alpha(getEventTypeColor(event), 0.05)
            }
          }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setManageEventDialogOpen(false);
            setEventDetailsLoading(false);
            if (onEditEvent) {
              onEditEvent(event);
            }
          }}
          variant="contained"
          fullWidth={matchDownSM}
          disabled={eventDetailsLoading}
          sx={{
            bgcolor: getEventTypeColor(event),
            '&:hover': {
              bgcolor: getEventTypeColor(event),
              filter: 'brightness(0.9)'
            },
            '&:disabled': {
              bgcolor: alpha(getEventTypeColor(event), 0.3)
            }
          }}
        >
          Edit Event
        </Button>
      </DialogActions>
    </Dialog>

    {/* Email Access Dialog for sending tool credentials */}
    <EmailAccessDialog
      open={emailAccessDialogOpen}
      onClose={() => {
        setEmailAccessDialogOpen(false);
        setEmailAccessParticipants([]);
      }}
      selectedParticipants={emailAccessParticipants}
      onSend={handleSendEmailCredentials}
    />

    {/* Send Invite Dialog for sending calendar invites to selected participants */}
    <SendInviteDialog
      open={sendInviteDialogOpen}
      onClose={() => {
        setSendInviteDialogOpen(false);
        setSendInviteParticipants([]);
      }}
      participants={sendInviteParticipants}
      eventTitle={event?.title || 'Event'}
      onSend={handleSendCalendarInvites}
    />
    </>
  );
};

export default DraggableEventCard;