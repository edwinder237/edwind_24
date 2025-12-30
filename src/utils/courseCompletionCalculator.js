/**
 * Course Completion Calculator
 * Handles the logic for determining course completion status for participants
 */

/**
 * Calculate course completion status for a group
 * @param {Array} groupEvents - Events assigned to the group for this course
 * @param {Array} groupParticipantIds - Array of participant IDs in the group
 * @returns {Object} Completion statistics
 */
export function calculateCourseCompletion(groupEvents, groupParticipantIds) {
  let isCompleted = false;
  let completedParticipants = 0;
  const totalParticipants = groupParticipantIds.length;
  
  if (groupEvents.length > 0 && totalParticipants > 0) {
    // For each participant, check if they attended all events in this course
    const participantCompletionStatus = groupParticipantIds.map(participantId => {
      const attendedEvents = groupEvents.filter(event => 
        event.event_attendees && event.event_attendees.some(attendee => {
          // Check if the attendee matches this participant and has attended (present or late)
          const hasAttended = attendee.enrolleeId === participantId && 
            isAttendanceValid(attendee.attendance_status);
          return hasAttended;
        })
      );
      return attendedEvents.length === groupEvents.length;
    });
    
    completedParticipants = participantCompletionStatus.filter(Boolean).length;
    isCompleted = completedParticipants === totalParticipants;
  }
  
  return {
    isCompleted,
    completedParticipants,
    totalParticipants,
    completionPercentage: totalParticipants > 0 
      ? Math.round((completedParticipants / totalParticipants) * 100) 
      : 0
  };
}

/**
 * Check if attendance status counts as valid attendance
 * @param {string} status - The attendance status
 * @returns {boolean} Whether the status counts as attended
 */
export function isAttendanceValid(status) {
  const validStatuses = ['present', 'late'];
  return validStatuses.includes(status);
}

/**
 * Filter events that are relevant to a specific group
 * @param {Array} events - All events for a course
 * @param {Array} groupParticipantIds - Array of participant IDs in the group
 * @returns {Array} Filtered events for the group
 */
export function filterGroupEvents(events, groupParticipantIds) {
  return events.filter(event => {
    // Check if this event is directly assigned to this group
    const hasDirectGroupAssignment = event.event_groups && event.event_groups.length > 0;
    
    // Check if this event has any attendees from this group
    const hasGroupParticipants = event.event_attendees && 
      event.event_attendees.some(attendee => 
        groupParticipantIds.includes(attendee.enrolleeId)
      );
    
    return hasDirectGroupAssignment || hasGroupParticipants;
  });
}

/**
 * Transform course data with completion status
 * @param {Object} course - Course object with events
 * @param {Array} groupParticipantIds - Array of participant IDs in the group
 * @returns {Object} Transformed course data with completion info
 */
export function transformCourseWithCompletion(course, groupParticipantIds) {
  // Filter events that are assigned to this specific group
  const groupEvents = filterGroupEvents(course.events || [], groupParticipantIds);

  // Calculate completion status
  const completionData = calculateCourseCompletion(groupEvents, groupParticipantIds);

  return {
    id: course.id,
    title: course.title,
    summary: course.summary,
    eventCount: groupEvents.length,
    ...completionData,
    events: groupEvents.map(event => ({
      id: event.id,
      title: event.title
    }))
  };
}

/**
 * Calculate overall course completion rate for a project
 * Based on participant-course completion (attended ALL events in course)
 * Matches the logic from Course Completion Tracker
 *
 * @param {Array} events - All project events
 * @param {Array} participants - All project participants (active only)
 * @returns {number} - Completion percentage (0-100)
 */
export function calculateProjectCourseCompletion(events, participants) {
  // Filter active participants only
  const activeParticipants = participants.filter(p => p.status !== 'removed');

  if (activeParticipants.length === 0 || events.length === 0) {
    return 0;
  }

  // Group events by courseId
  const eventsByCourse = {};
  events.forEach(event => {
    if (event.courseId) {
      if (!eventsByCourse[event.courseId]) {
        eventsByCourse[event.courseId] = [];
      }
      eventsByCourse[event.courseId].push(event);
    }
  });

  const courseIds = Object.keys(eventsByCourse);
  if (courseIds.length === 0) return 0;

  let totalObjectives = 0;
  let completedObjectives = 0;

  // For each course, check each participant's completion
  courseIds.forEach(courseId => {
    const courseEvents = eventsByCourse[courseId];
    const totalEventsInCourse = courseEvents.length;

    activeParticipants.forEach(participant => {
      // This is a participant-course objective
      totalObjectives++;

      // Count how many events this participant attended in this course
      let eventsAttended = 0;
      courseEvents.forEach(event => {
        const attendee = event.event_attendees?.find(
          a => a.enrolleeId === participant.id
        );
        if (attendee && isAttendanceValid(attendee.attendance_status)) {
          eventsAttended++;
        }
      });

      // Completed = attended ALL events in the course
      if (eventsAttended === totalEventsInCourse && totalEventsInCourse > 0) {
        completedObjectives++;
      }
    });
  });

  return totalObjectives > 0
    ? Math.round((completedObjectives / totalObjectives) * 100)
    : 0;
}