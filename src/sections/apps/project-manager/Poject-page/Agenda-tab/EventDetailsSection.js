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
            enrolleeId: attendee.enrolleeId, // Include the enrollee ID for API calls
            isDirect: true // Mark as direct attendee
          });
        }
      }
    });
    
    // Add participants from groups
    if (event_groups?.length > 0) {
      event_groups.forEach(eventGroup => {
        // Find the full group data from the project
        const fullGroup = Project.groups?.find(g => g.id === eventGroup.groupId);
        
        if (fullGroup?.participants) {
          fullGroup.participants.forEach(groupParticipant => {
            const participantId = groupParticipant.participant?.id || groupParticipant.participantId;
            
            // Only add if not already in the map (avoid duplicates)
            if (participantId && !participantMap.has(participantId) && groupParticipant.participant) {
              // Use the role directly from the participant data
              const participantRole = groupParticipant.participant.participant?.role;
              
              
              participantMap.set(participantId, {
                ...groupParticipant.participant.participant, // The actual participant data (nested structure)
                role: participantRole, // Include role from participant data
                attendance_status: 'scheduled', // Default status for group members
                enrolleeId: groupParticipant.participantId, // Use participantId as enrolleeId
                fromGroup: fullGroup.groupName, // Track which group they're from
                isDirect: false // Mark as group member
              });
            }
          });
        }
      });
    }
    
    // Convert map to array
    const allParticipants = Array.from(participantMap.values());
    
    return { participants: allParticipants, selectedEvent: updatedEvent };
  }, [Project?.events, Project?.groups, scheduleState.selectedEvent?.id, availableRoles]);

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
    
    // Add participants from groups
    if (event_groups?.length > 0) {
      event_groups.forEach(eventGroup => {
        // Find the full group data from the project
        const fullGroup = Project.groups?.find(g => g.id === eventGroup.groupId);
        
        if (fullGroup?.participants) {
          fullGroup.participants.forEach(groupParticipant => {
            const participantId = groupParticipant.participant?.id || groupParticipant.participantId;
            
            // Only add if not already in the map (avoid duplicates)
            if (participantId && !participantMap.has(participantId) && groupParticipant.participant) {
              // Use the role directly from the participant data
              const participantRole = groupParticipant.participant.participant?.role;
              
              
              participantMap.set(participantId, {
                ...groupParticipant.participant.participant, // The actual participant data (nested structure)
                role: participantRole, // Include role from participant data
                attendance_status: 'scheduled', // Default status for group members
                enrolleeId: groupParticipant.participantId, // Use participantId as enrolleeId
                fromGroup: fullGroup.groupName, // Track which group they're from
                isDirect: false // Mark as group member
              });
            }
          });
        }
      });
    }
    
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
  }, [Project?.events, Project?.groups, availableRoles]);

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