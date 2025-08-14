import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "store";
import { getSingleProject } from "store/reducers/projects";

// Child components
import Attendees from "./components/attendees/attendees";
import Moduleswidget from "./components/moduleswidget";
import SessionNotes from "./components/SessionNotes";
import DailyFocus from "./components/DailyFocus";

// Material-UI
import { Box, Stack, Typography } from "@mui/material";

// Project imports
import MainCard from "components/MainCard";

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

const EventDetailsSection = ({ selectedDate, selectedEventId, project }) => {
  const dispatch = useDispatch();
  const Project = project || useSelector((state) => state.projects.singleProject);
  const { calendarView } = useSelector((state) => state.calendar);

  const [scheduleState, setScheduleState] = useState({ participants: [] });

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

      // Refresh data
      await dispatch(getSingleProject(Project.id));
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
        await dispatch(getSingleProject(Project.id));
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

      await dispatch(getSingleProject(Project.id));
    } catch (error) {
      console.error('Error moving participant:', error);
    }
  }, [scheduleState.selectedEvent?.id, dispatch, Project?.id]);

  // Debounced refresh to prevent excessive API calls
  const refreshProjectData = useCallback(
    debounce(async () => {
      try {
        await dispatch(getSingleProject(Project.id));
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
    const updatedEvent = Project.events?.find(e => e.id === eventId);
    
    if (!updatedEvent) return { participants: [], selectedEvent: null };
    
    const { event_attendees, event_groups } = updatedEvent;
    const eventAttendees = event_attendees || [];
    const eventGroupParticipants = event_groups?.flatMap(eventGroup => {
      // Find the actual group data from the project
      const groupData = Project.groups?.find(g => g.id === eventGroup.groupId);
      // Extract participants from group data
      return groupData?.participants?.map(p => ({
        ...p.participant,
        // Add attendance status (groups don't have individual attendance tracking)
        attendance_status: 'scheduled',
        // Mark as from group for identification
        fromGroupId: groupData.id,
        fromGroupName: groupData.groupName
      })) || [];
    }) || [];
    const allParticipants = [...eventAttendees, ...eventGroupParticipants];
    
    return { participants: allParticipants, selectedEvent: updatedEvent };
  }, [Project?.events, Project?.groups, scheduleState.selectedEvent?.id]);

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

  // Memoized event details calculation
  const getSelectedEventDetails = useCallback((event) => {
    const { title: eventTitle, extendedProps, id } = event;
    const eventId = parseInt(id);
    
    // Find the full event details from the project
    const selectedEvent = Project.events?.find(e => e.id === eventId);
    
    if (!selectedEvent) {
      console.warn('Event not found in project data');
      return;
    }

    const { eventType, course, event_attendees, event_groups } = selectedEvent;

    // Get participants from attendees and groups
    const eventAttendees = event_attendees || [];
    const eventGroupParticipants = event_groups?.flatMap(eventGroup => {
      // Find the actual group data from the project
      const groupData = Project.groups?.find(g => g.id === eventGroup.groupId);
      // Extract participants from group data
      return groupData?.participants?.map(p => ({
        ...p.participant,
        // Add attendance status (groups don't have individual attendance tracking)
        attendance_status: 'scheduled',
        // Mark as from group for identification
        fromGroupId: groupData.id,
        fromGroupName: groupData.groupName
      })) || [];
    }) || [];
    
    const allParticipants = [...eventAttendees, ...eventGroupParticipants];

    const baseState = {
      selectedEvent: selectedEvent,
      participants: allParticipants,
      instructorNotes: selectedEvent.extendedProps?.notes || "",
    };

    switch (eventType) {
      case "course":
        if (course) {
          setScheduleState(prevState => ({
            ...prevState,
            ...baseState,
            courseTitle: `${course.duration || 0}min | ${eventTitle} | ${course.title}`,
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
  }, [Project?.events, Project?.groups]);

  // Handle selectedEventId changes from parent component
  useEffect(() => {
    if (selectedEventId && Project?.events) {
      const selectedEvent = Project.events.find(event => event.id === selectedEventId);
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
  }, [selectedEventId, Project?.events, getSelectedEventDetails]);

  return (
    <Stack spacing={3}>
      {/* Daily Focus Component - Only show in day view */}
      {calendarView === 'timeGridDay' && (
        <DailyFocus selectedDate={selectedDate} />
      )}
      
      {scheduleState.selectedEvent ? (
        <>
          {/* Participants */}
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
            course={scheduleState.course}
          />
          
          {/* Course Modules */}
          <Moduleswidget eventState={scheduleState} />
          
          {/* Session Notes */}
          <SessionNotes 
            notes={scheduleState.instructorNotes || ""} 
            selectedEvent={scheduleState.selectedEvent}
            events={Project?.events || []}
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