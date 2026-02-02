/**
 * ICS Calendar File Generator
 *
 * Generates ICS calendar files for event invitations
 * with proper timezone support and RFC 5545 compliance
 */

import { formatInTimeZone } from 'date-fns-tz';

/**
 * Escape special characters for ICS format
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeIcal(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format a date for ICS in UTC format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateUTC(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format a date for ICS with timezone
 * @param {Date} date - Date to format
 * @param {string} timezone - Timezone identifier
 * @returns {string} Formatted date string
 */
function formatDateWithTimezone(date, timezone) {
  return formatInTimeZone(date, timezone, "yyyyMMdd'T'HHmmss");
}

/**
 * Generate a unique UID for calendar events
 * @returns {string} Unique identifier
 */
function generateUID() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const random = Math.random().toString(36).substring(7);
  return `${timestamp}-${random}@edwind.training`;
}

/**
 * Generate VTIMEZONE component for non-UTC timezones
 * @param {string} timezone - Timezone identifier
 * @returns {string} VTIMEZONE component or empty string
 */
function generateVTimezone(timezone) {
  if (!timezone || timezone === 'UTC') return '';

  return `BEGIN:VTIMEZONE
TZID:${timezone}
X-LIC-LOCATION:${timezone}
END:VTIMEZONE
`;
}

/**
 * Generate an ICS calendar file for a single event
 *
 * @param {Object} event - Event data
 * @param {string} event.title - Event title
 * @param {string} event.description - Event description
 * @param {Date} event.startTime - Event start time
 * @param {Date} event.endTime - Event end time
 * @param {string} event.location - Event location
 * @param {string} [event.timezone='UTC'] - Event timezone
 * @param {Object} attendee - Attendee data
 * @param {string} attendee.email - Attendee email
 * @param {string} attendee.firstName - Attendee first name
 * @param {string} attendee.lastName - Attendee last name
 * @param {string} [organizerName='EDWIND Training'] - Organizer name
 * @param {string} [organizerEmail='admin@edwind.ca'] - Organizer email
 * @returns {string} ICS file content
 */
export function generateSingleEventICS(event, attendee, organizerName = 'EDWIND Training', organizerEmail = 'admin@edwind.ca') {
  const now = new Date();
  const timestamp = formatDateUTC(now);
  const uid = generateUID();

  const eventTimezone = event.timezone || 'UTC';
  let dtstart, dtend;
  const vtimezone = generateVTimezone(eventTimezone);

  if (eventTimezone && eventTimezone !== 'UTC') {
    dtstart = `DTSTART;TZID=${eventTimezone}:${formatDateWithTimezone(event.startTime, eventTimezone)}`;
    dtend = `DTEND;TZID=${eventTimezone}:${formatDateWithTimezone(event.endTime, eventTimezone)}`;
  } else {
    dtstart = `DTSTART:${formatDateUTC(event.startTime)}`;
    dtend = `DTEND:${formatDateUTC(event.endTime)}`;
  }

  const attendeeName = `${attendee.firstName} ${attendee.lastName}`.trim();

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EDWIND//Training Event Invitation//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
${vtimezone}BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
${dtstart}
${dtend}
SUMMARY:${escapeIcal(event.title)}
DESCRIPTION:${escapeIcal(event.description)}
LOCATION:${escapeIcal(event.location)}
STATUS:CONFIRMED
SEQUENCE:0
ATTENDEE;CN=${attendeeName};RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${attendee.email}
ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}
REQUEST-STATUS:2.0;Success
END:VEVENT
END:VCALENDAR`;

  return ical;
}

/**
 * Generate ICS content for multiple events (combined calendar)
 *
 * @param {Array} events - Array of event objects
 * @param {Object} attendee - Attendee data
 * @param {string} [organizerName='EDWIND Training'] - Organizer name
 * @returns {string} ICS file content with all events
 */
export function generateMultiEventICS(events, attendee, organizerName = 'EDWIND Training') {
  const now = new Date();
  const timestamp = formatDateUTC(now);
  const attendeeName = `${attendee.firstName} ${attendee.lastName}`.trim();

  // Collect unique timezones
  const timezones = new Set();
  events.forEach(event => {
    if (event.timezone && event.timezone !== 'UTC') {
      timezones.add(event.timezone);
    }
  });

  // Generate VTIMEZONE components for all timezones
  const vtimezoneComponents = Array.from(timezones).map(tz => generateVTimezone(tz)).join('');

  // Generate VEVENT components for each event
  const vevents = events.map(event => {
    const uid = generateUID();
    const eventTimezone = event.timezone || 'UTC';
    let dtstart, dtend;

    if (eventTimezone && eventTimezone !== 'UTC') {
      dtstart = `DTSTART;TZID=${eventTimezone}:${formatDateWithTimezone(event.startTime, eventTimezone)}`;
      dtend = `DTEND;TZID=${eventTimezone}:${formatDateWithTimezone(event.endTime, eventTimezone)}`;
    } else {
      dtstart = `DTSTART:${formatDateUTC(event.startTime)}`;
      dtend = `DTEND:${formatDateUTC(event.endTime)}`;
    }

    return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
${dtstart}
${dtend}
SUMMARY:${escapeIcal(event.title)}
DESCRIPTION:${escapeIcal(event.description)}
LOCATION:${escapeIcal(event.location)}
STATUS:CONFIRMED
SEQUENCE:0
ATTENDEE;CN=${attendeeName};RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${attendee.email}
ORGANIZER;CN=${organizerName}:mailto:admin@edwind.ca
REQUEST-STATUS:2.0;Success
END:VEVENT`;
  }).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EDWIND//Training Event Invitation//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
${vtimezoneComponents}${vevents}
END:VCALENDAR`;
}

/**
 * Create event description from event data
 *
 * @param {Object} event - Event object with optional fields
 * @param {Object} options - Options for description generation
 * @param {string} [options.dailyFocus] - Daily focus text
 * @param {string[]} [options.groupNames] - Array of group names
 * @param {string} [options.meetingLink] - Meeting URL
 * @param {boolean} [options.includeMeetingLink=true] - Whether to include meeting link
 * @returns {string} Formatted description
 */
export function createEventDescription(event, options = {}) {
  const {
    dailyFocus,
    groupNames = [],
    meetingLink,
    includeMeetingLink = true
  } = options;

  let description = '';

  if (event.course?.title) {
    description += `Course: ${event.course.title}\n\n`;
  }

  if (event.description) {
    description += `Description: ${event.description}\n\n`;
  }

  if (event.room) {
    description += `Room: ${event.room.name}`;
    if (event.room.location) {
      description += ` (${event.room.location})`;
    }
    if (event.room.capacity) {
      description += ` - Capacity: ${event.room.capacity}`;
    }
    description += '\n\n';
  }

  if (groupNames.length > 0) {
    description += `Groups: ${groupNames.join(', ')}\n\n`;
  }

  if (dailyFocus) {
    description += `Daily Focus: ${dailyFocus}\n\n`;
  }

  if (includeMeetingLink && meetingLink) {
    description += `Join Meeting: ${meetingLink}\n\n`;
  }

  return description;
}

/**
 * Generate a filename for the ICS attachment
 * @param {string} eventTitle - Event title
 * @returns {string} Safe filename
 */
export function generateICSFilename(eventTitle) {
  const safeName = (eventTitle || 'event')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
  return `${safeName}_invite.ics`;
}

/**
 * Convert ICS content to base64 for email attachment
 * @param {string} icsContent - ICS file content
 * @returns {string} Base64 encoded content
 */
export function icsToBase64(icsContent) {
  return Buffer.from(icsContent).toString('base64');
}

/**
 * Create an ICS attachment object for Resend
 * @param {string} icsContent - ICS file content
 * @param {string} eventTitle - Event title for filename
 * @returns {Object} Attachment object for Resend API
 */
export function createICSAttachment(icsContent, eventTitle) {
  return {
    filename: generateICSFilename(eventTitle),
    content: icsToBase64(icsContent),
    type: 'text/calendar; method=REQUEST',
    disposition: 'attachment'
  };
}
