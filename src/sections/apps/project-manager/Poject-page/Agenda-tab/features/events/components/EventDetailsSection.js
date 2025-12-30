import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "store";
import { fetchProjectAgenda } from "store/reducers/project/agenda";

// Child components
import { Attendees } from "../../participants/components";
import { ModulesWidget } from "../../modules/components";
import { SessionNotes } from "../../../shared/components";

// Material-UI
import { Box, Stack, Typography } from "@mui/material";

// Project imports
import MainCard from "components/MainCard";
import { calculateCourseDurationFromModules } from 'utils/durationCalculations';

// Debounce utility function for API calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const EventDetailsSection = ({ selectedDate, selectedEventId, project, availableRoles = [] }) => {
  const dispatch = useDispatch();
  
  // Get data from the agenda store
  const { 
    events: agendaEvents, 
    groups: agendaGroups,
    participants: agendaParticipants,
    projectInfo,
    loading: agendaLoading 
  } = useSelector((state) => state.projectAgenda);
  
  // Use projectInfo from agenda or fallback to passed project prop
  const Project = project || projectInfo;

  const [scheduleState, setScheduleState] = useState({ participants: [] });
  const [isGroupOperationLoading, setIsGroupOperationLoading] = useState(false);

  // Centralized participant management functions - memoized to prevent re-renders
  const handleAddParticipants = useCallback(async (participants, groups) => {
    if (!scheduleState.selectedEvent?.id) {
      console.error('No event selected');
      return;
    }

    try {
      // Add individual participants
      for (const participant of participants) {
        try {
          const response = await fetch('/api/projects/addEventParticipant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: scheduleState.selectedEvent.id,
              participantId: participant.id,
              attendance_status: 'scheduled'
            }),
          });
          
          if (!response.ok && response.status !== 400) {
            const errorData = await response.json();
            console.error('Error adding participant:', errorData.error);
          }
        } catch (error) {
          console.error('Error adding participant:', error);
        }
      }

      // Add groups
      for (const group of groups) {
        try {
          const response = await fetch('/api/projects/addEventGroup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: scheduleState.selectedEvent.id,
              groupId: group.id,
            }),
          });
          
          if (!response.ok && response.status !== 400) {
            const errorData = await response.json();
            console.error('Error adding group:', errorData.error);
          }
        } catch (error) {
          console.error('Error adding group:', error);
        }
      }

      // Refresh agenda data
      await dispatch(fetchProjectAgenda(Project.id, true));
    } catch (error) {
      console.error('Error in handleAddParticipants:', error);
    }
  }, [scheduleState.selectedEvent?.id, dispatch, Project?.id]);

  const handleRemoveParticipant = useCallback(async (participant) => {
    if (!scheduleState.selectedEvent?.id) return;

    try {
      const response = await fetch('/api/projects/removeEventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: scheduleState.selectedEvent.id,
          participantId: participant.id
        }),
      });

      if (response.ok) {
        await dispatch(fetchProjectAgenda(Project.id, true));
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }, [scheduleState.selectedEvent?.id, dispatch, Project?.id]);

  const handleMoveParticipant = useCallback(async (participant, targetEventId) => {
    if (!scheduleState.selectedEvent?.id) return;

    try {
      // Remove from current event
      await fetch('/api/projects/removeEventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: scheduleState.selectedEvent.id,
          participantId: participant.id
        }),
      });

      // Add to target event
      await fetch('/api/projects/addEventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: targetEventId,
          participantId: participant.id,
          attendance_status: 'scheduled'
        }),
      });

      await dispatch(fetchProjectAgenda(Project.id, true));
    } catch (error) {
      console.error('Error moving participant:', error);
    }
  }, [scheduleState.selectedEvent?.id, dispatch, Project?.id]);

  // Debounced refresh to prevent excessive API calls
  const refreshProjectData = useCallback(
    debounce(async () => {
      try {
        await dispatch(fetchProjectAgenda(Project?.id, true));
      } catch (error) {
        console.error('Error refreshing project data:', error);
      }
    }, 300), // 300ms debounce
    [Project?.id]
  );

  // Memoize participants calculation to prevent unnecessary re-computations
  const participantsData = useMemo(() => {
    if (!scheduleState.selectedEvent || !Project) return { participants: [], selectedEvent: null };
    
    const eventId = scheduleState.selectedEvent.id;
    const updatedEvent = agendaEvents?.find(e => e.id === eventId);
    
    if (!updatedEvent) return { participants: [], selectedEvent: null };
    
    const { event_attendees, event_groups } = updatedEvent;
    
    // Use a Map to track unique participants by their ID
    const participantMap = new Map();
    
    
    // Add direct event attendees first
    event_attendees?.forEach(attendee => {
      if (attendee.enrollee) {
        const participantId = attendee.enrollee.id || attendee.enrolleeId;
        if (participantId && !participantMap.has(participantId)) {
          // Use the role directly from the participant data
          const participantRole = attendee.enrollee.participant?.role;
          
          
          participantMap.set(participantId, {
            ...attendee.enrollee, // This contains the participant data
            role: participantRole, // Include role from participant data
            attendance_status: attendee.attendance_status, // Include the attendance status from event_attendees
            id: attendee.id, // Include the event_attendee record ID
            enrolleeId: attendee.enrollee.id, // Include the enrollee ID for API calls
            isDirect: true // Mark as direct attendee
          });
        }
      }
    });
    
    // Note: We don't add participants from groups here anymore
    // After sync-event-attendees runs, all group participants who should attend
    // are already in the event_attendees table with attendanceType: 'group'
    // This prevents showing stale group membership data
    
    // Convert map to array
    const allParticipants = Array.from(participantMap.values());
    
    return { participants: allParticipants, selectedEvent: updatedEvent };
  }, [agendaEvents, agendaGroups, scheduleState.selectedEvent?.id, availableRoles]);

  // Update participants when project data changes
  useEffect(() => {
    if (participantsData.selectedEvent) {
      setScheduleState(prevState => ({
        ...prevState,
        selectedEvent: participantsData.selectedEvent,
        participants: participantsData.participants,
      }));
    }
  }, [participantsData]);

  // Monitor agenda loading state for group operations
  useEffect(() => {
    setIsGroupOperationLoading(agendaLoading);
  }, [agendaLoading]);

  // Memoized event details calculation
  const getSelectedEventDetails = useCallback((event) => {
    if (!agendaEvents) {
      console.log('Agenda events not yet loaded');
      return;
    }
    
    const { title: eventTitle, extendedProps, id } = event;
    const eventId = parseInt(id);
    
    // Find the full event details from the agenda
    const selectedEvent = agendaEvents?.find(e => e.id === eventId);
    
    if (!selectedEvent) {
      console.warn('Event not found in project data');
      return;
    }

    const { eventType, course, event_attendees, event_groups } = selectedEvent;

    // Use a Map to track unique participants by their ID
    const participantMap = new Map();
    
    // Add direct event attendees first
    event_attendees?.forEach(attendee => {
      if (attendee.enrollee) {
        const participantId = attendee.enrollee.id || attendee.enrolleeId;
        if (participantId && !participantMap.has(participantId)) {
          // Find the role using roleId
          const participantRole = availableRoles.find(role => 
            role.id === attendee.enrollee.roleId
          );
          
          participantMap.set(participantId, {
            ...attendee.enrollee, // This contains the participant data
            role: participantRole, // Include role from availableRoles lookup
            attendance_status: attendee.attendance_status, // Include the attendance status from event_attendees
            id: attendee.id, // Include the event_attendee record ID
            enrolleeId: attendee.enrolleeId, // Include the enrollee ID for API calls
            isDirect: true // Mark as direct attendee
          });
        }
      }
    });
    
    // Note: We don't add participants from groups here anymore
    // After sync-event-attendees runs, all group participants who should attend
    // are already in the event_attendees table with attendanceType: 'group'
    // This prevents showing stale group membership data
    
    // Convert map to array
    const allParticipants = Array.from(participantMap.values());

    const baseState = {
      selectedEvent: selectedEvent,
      participants: allParticipants,
      instructorNotes: selectedEvent.extendedProps?.notes || "",
    };

    switch (eventType) {
      case "course":
        if (course) {
          const calculatedDuration = calculateCourseDurationFromModules(course.modules || []);
          setScheduleState(prevState => ({
            ...prevState,
            ...baseState,
            courseTitle: `${calculatedDuration}min | ${eventTitle} | ${course.title}`,
            course: course,
            modules: course.modules || [],
            activities: course.modules?.flatMap(m => m.activities || []) || [],
          }));
        } else {
          // Event marked as course but no course linked
          setScheduleState(prevState => ({
            ...prevState,
            ...baseState,
            courseTitle: `${eventTitle} | No Course Linked`,
            course: null,
            modules: [],
            activities: [],
          }));
        }
        break;
        
      case "other":
      default:
        setScheduleState(prevState => ({
          ...prevState,
          ...baseState,
          courseTitle: `${eventTitle} | General Event`,
          course: null,
          modules: [],
          activities: [],
        }));
        break;
    }
  }, [agendaEvents, agendaGroups, availableRoles]);

  // Handle selectedEventId changes from parent component
  useEffect(() => {
    if (selectedEventId && agendaEvents) {
      const selectedEvent = agendaEvents.find(event => event.id === selectedEventId);
      if (selectedEvent) {
        // Create a mock calendar event object similar to what Schedule tab expects
        const mockCalendarEvent = {
          id: selectedEvent.id.toString(),
          title: selectedEvent.title,
          extendedProps: selectedEvent.extendedProps || {}
        };
        
        // Trigger the event details calculation
        getSelectedEventDetails(mockCalendarEvent);
      }
    }
  }, [selectedEventId, agendaEvents, getSelectedEventDetails]);

  return (
    <Stack spacing={3}>
      {scheduleState.selectedEvent ? (
        <>
          {/* Participants - Only show for course and supportActivity event types */}
          {scheduleState.selectedEvent.eventType === 'course' || scheduleState.selectedEvent.eventType === 'supportActivity' ? (
            <Attendees
              eventParticipants={scheduleState.participants || []}
              eventCourse={scheduleState.courseTitle}
              groupName={
                scheduleState.groupName &&
                scheduleState.groupName.groupName
              }
              selectedEvent={scheduleState.selectedEvent}
              onAddParticipants={handleAddParticipants}
              onRemoveParticipant={handleRemoveParticipant}
              onMoveParticipant={handleMoveParticipant}
              isGroupOperationLoading={isGroupOperationLoading}
              course={scheduleState.course}
              projectId={Project?.id} // Enable RTK Query with project ID
            />
          ) : (
            /* For "other" event types, show a simple placeholder */
            <MainCard title="Event Details">
              <Box sx={{ p: 0 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {scheduleState.selectedEvent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {scheduleState.selectedEvent.eventType === 'other' 
                    ? 'This is a general event that does not require participant management.' 
                    : 'This event type does not support participant management.'
                  }
                </Typography>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: (theme) => theme.palette.background.default,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Time:</strong> {new Date(scheduleState.selectedEvent.start).toLocaleString()} - {new Date(scheduleState.selectedEvent.end).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </MainCard>
          )}
          
          {/* Course Modules - Only show for course event types */}
          {scheduleState.selectedEvent.eventType === 'course' && (
            <ModulesWidget eventState={scheduleState} />
          )}

          {/* Session Notes - Available for all event types */}
          <SessionNotes
            notes={scheduleState.instructorNotes}
            selectedEvent={scheduleState.selectedEvent}
            events={agendaEvents}
          />
        </>
      ) : (
        <MainCard
          title="Event Details"
          sx={{ height: 'fit-content' }}
        >
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6" gutterBottom>
              Select an Event
            </Typography>
            <Typography variant="body2">
              Click on an event in the calendar to view participants, course modules, and session notes.
            </Typography>
          </Box>
        </MainCard>
      )}
    </Stack>
  );
};

export default EventDetailsSection;