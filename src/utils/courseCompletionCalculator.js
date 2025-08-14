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