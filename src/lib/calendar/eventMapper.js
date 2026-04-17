/**
 * Event Mapper
 *
 * Transforms EDBAHN event data into Google Calendar and Microsoft Graph API formats.
 * Reuses description generation logic from the ICS generator.
 */

import { createEventDescription } from '../email/icsGenerator';

/**
 * Map an EDBAHN event to a Google Calendar API event payload
 * @param {Object} event - EDBAHN event with relations (course, room, project)
 * @returns {Object} Google Calendar event resource
 */
export function mapToGoogleEvent(event) {
  const description = buildDescription(event);
  const location = buildLocation(event);

  const googleEvent = {
    summary: event.title,
    description,
    start: buildGoogleDateTime(event.start, event.timezone),
    end: buildGoogleDateTime(event.end, event.timezone),
  };

  if (location) {
    googleEvent.location = location;
  }

  if (event.eventStatus === 'Cancelled') {
    googleEvent.status = 'cancelled';
  }

  return googleEvent;
}

/**
 * Map an EDBAHN event to a Microsoft Graph Calendar event payload
 * @param {Object} event - EDBAHN event with relations (course, room, project)
 * @returns {Object} Microsoft Graph event resource
 */
export function mapToMicrosoftEvent(event) {
  const description = buildDescription(event);
  const location = buildLocation(event);
  const timezone = event.timezone || 'UTC';

  const msEvent = {
    subject: event.title,
    body: {
      contentType: 'text',
      content: description,
    },
    start: {
      dateTime: new Date(event.start).toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: new Date(event.end).toISOString(),
      timeZone: timezone,
    },
    isAllDay: event.allDay || false,
  };

  if (location) {
    msEvent.location = {
      displayName: location,
    };
  }

  if (event.eventStatus === 'Cancelled') {
    msEvent.isCancelled = true;
  }

  return msEvent;
}

/**
 * Build a Google Calendar datetime object
 * @param {Date|string} date - Date value
 * @param {string} timezone - IANA timezone
 * @returns {Object} Google Calendar datetime
 */
function buildGoogleDateTime(date, timezone) {
  const dt = new Date(date);
  const tz = timezone || 'UTC';

  return {
    dateTime: dt.toISOString(),
    timeZone: tz,
  };
}

/**
 * Build event description from EDBAHN event data
 * Reuses createEventDescription from ICS generator where possible
 * @param {Object} event - EDBAHN event with relations
 * @returns {string} Plain text description
 */
function buildDescription(event) {
  const parts = [];

  if (event.project?.title) {
    parts.push(`Project: ${event.project.title}`);
  }

  // Use the ICS generator's description builder for course/room/group details
  const icsDescription = createEventDescription(event, {
    meetingLink: event.meetingLink,
    includeMeetingLink: true,
  });

  if (icsDescription) {
    parts.push(icsDescription.trim());
  } else {
    // Fallback if createEventDescription returns empty
    if (event.description) {
      parts.push(event.description);
    }
    if (event.meetingLink) {
      parts.push(`Join Meeting: ${event.meetingLink}`);
    }
  }

  if (event.deliveryMode) {
    parts.push(`Delivery: ${event.deliveryMode === 'in_person' ? 'In Person' : 'Remote'}`);
  }

  return parts.join('\n\n');
}

/**
 * Build location string from event data
 * @param {Object} event - EDBAHN event with relations
 * @returns {string|null} Location string
 */
function buildLocation(event) {
  if (event.room) {
    let loc = event.room.name;
    if (event.room.location) {
      loc += `, ${event.room.location}`;
    }
    return loc;
  }

  if (event.extendedProps?.location) {
    return event.extendedProps.location;
  }

  if (event.deliveryMode === 'remote' && event.meetingLink) {
    return event.meetingLink;
  }

  return null;
}
