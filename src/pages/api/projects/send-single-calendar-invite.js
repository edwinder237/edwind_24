import prisma from '../../../lib/prisma';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      projectId,
      eventId,
      participantEmail,
      participantFirstName,
      participantLastName,
      projectTitle,
      includeMeetingLink = true
    } = req.body;

    // Validate required fields
    if (!projectId || !eventId || !participantEmail || !participantFirstName || !participantLastName) {
      return res.status(400).json({
        message: 'Missing required fields: projectId, eventId, participantEmail, participantFirstName, participantLastName'
      });
    }

    // Fetch the specific event with all related data
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        course: true,
        event_groups: {
          include: {
            groups: true
          }
        },
        event_instructors: {
          include: {
            instructor: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch project for organization name
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        sub_organization: {
          select: { title: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Prepare event data
    const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
    const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : new Date(startDate.getTime() + 60 * 60 * 1000);

    // Get group names for this event
    const groupNames = event.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean) || [];

    // Get instructor name
    const firstInstructor = event.event_instructors?.[0]?.instructor;
    const instructorName = firstInstructor
      ? `${firstInstructor.firstName} ${firstInstructor.lastName}`.trim()
      : null;

    // Get meeting link
    const meetingLink = includeMeetingLink
      ? (event.meetingLink || event.zoomLink || null)
      : null;

    // Create event description
    let description = '';
    if (event.course) {
      description += `Course: ${event.course.title}\n\n`;
    }
    if (event.description) {
      description += `Description: ${event.description}\n\n`;
    }
    if (groupNames.length > 0) {
      description += `Groups: ${groupNames.join(', ')}\n\n`;
    }
    if (meetingLink) {
      description += `Join Meeting: ${meetingLink}\n\n`;
    }

    // Get location from event or extendedProps (location is stored in extendedProps JSON)
    const eventLocation = event.location || event.extendedProps?.location || null;

    // Get timezone from event (stored in DB) - default to UTC if not set
    const eventTimezone = event.timezone || 'UTC';

    const calendarEvent = {
      title: event.title || 'Training Event',
      description,
      startTime: startDate,
      endTime: endDate,
      location: includeMeetingLink ? (eventLocation || meetingLink) : (eventLocation || 'TBD'),
      course: event.course?.title || null,
      meetingLink,
      instructorName,
      timezone: eventTimezone
    };

    const participant = {
      email: participantEmail,
      firstName: participantFirstName,
      lastName: participantLastName
    };

    const organizerName = instructorName || project.sub_organization?.title || 'EDWIND Training';
    const eventIcal = generateSingleEventInvitation(calendarEvent, projectTitle || project.title, participant, organizerName);

    // Send the email
    const emailData = await resend.emails.send({
      from: 'Training Schedule <admin@edwind.ca>',
      to: [participantEmail],
      subject: `Training Session: ${calendarEvent.title} | ${projectTitle || project.title}`,
      html: generateEventInviteTemplate({
        participantName: `${participantFirstName} ${participantLastName}`,
        event: calendarEvent,
        projectTitle: projectTitle || project.title,
        groupName: groupNames.length > 0 ? groupNames.join(', ') : null
      }),
      attachments: [
        {
          filename: `${calendarEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_invite.ics`,
          content: Buffer.from(eventIcal).toString('base64'),
          type: 'text/calendar; method=REQUEST',
          disposition: 'attachment'
        }
      ]
    });

    if (emailData.error) {
      return res.status(500).json({
        success: false,
        message: emailData.error.message || 'Failed to send email'
      });
    }

    res.status(200).json({
      success: true,
      message: `Calendar invite sent to ${participantEmail}`,
      emailId: emailData.data?.id || emailData.id
    });

  } catch (error) {
    console.error('Error sending single calendar invite:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

function generateSingleEventInvitation(event, projectTitle, participant, organizationName = 'EDWIND Training') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${timestamp}-${Math.random().toString(36).substring(7)}@edwind.training`;

  // Format times with timezone support
  // If event has a timezone, use TZID format; otherwise use UTC
  const eventTimezone = event.timezone || 'UTC';
  let dtstart, dtend, vtimezone = '';

  if (eventTimezone && eventTimezone !== 'UTC') {
    // Convert UTC time to the target timezone and format for ICS
    // Use formatInTimeZone to get the correct local time in the specified timezone
    const formatForICS = (date, tz) => {
      return formatInTimeZone(date, tz, "yyyyMMdd'T'HHmmss");
    };

    dtstart = `DTSTART;TZID=${eventTimezone}:${formatForICS(event.startTime, eventTimezone)}`;
    dtend = `DTEND;TZID=${eventTimezone}:${formatForICS(event.endTime, eventTimezone)}`;

    // Add VTIMEZONE component for better compatibility
    vtimezone = `BEGIN:VTIMEZONE
TZID:${eventTimezone}
X-LIC-LOCATION:${eventTimezone}
END:VTIMEZONE
`;
  } else {
    // Use UTC format
    const startTime = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    dtstart = `DTSTART:${startTime}`;
    dtend = `DTEND:${endTime}`;
  }

  // Escape special characters in description and location
  const escapeIcal = (str) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

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
ATTENDEE;CN=${participant.firstName} ${participant.lastName};RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${participant.email}
ORGANIZER;CN=${organizationName}:mailto:admin@edwind.ca
REQUEST-STATUS:2.0;Success
END:VEVENT
END:VCALENDAR`;

  return ical;
}

function generateEventInviteTemplate({ participantName, event, projectTitle, groupName }) {
  const eventTimezone = event.timezone || 'UTC';

  // Format date and time in the event's timezone
  const startTime = eventTimezone !== 'UTC'
    ? formatInTimeZone(event.startTime, eventTimezone, 'EEEE, MMMM d, yyyy', { locale: enUS })
    : format(event.startTime, 'EEEE, MMMM d, yyyy', { locale: enUS });

  const timeRange = eventTimezone !== 'UTC'
    ? `${formatInTimeZone(event.startTime, eventTimezone, 'HH:mm')} - ${formatInTimeZone(event.endTime, eventTimezone, 'HH:mm')}`
    : `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Session - ${event.title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #6c757d; margin-bottom: 25px;">
          You are invited to attend the following training session${groupName ? ` as part of the <strong>${groupName}</strong> group` : ''}:
        </p>

        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #1976d2;">
          <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 24px;">${event.title}</h2>
          ${event.course && event.course !== event.title ? `<p style="margin: 0 0 10px 0; color: #6c757d; font-weight: 500;">Course: ${event.course}</p>` : ''}

          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${startTime}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeRange}</p>
            <p style="margin: 5px 0;"><strong>Time Zone:</strong> ${eventTimezone}</p>
            ${event.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.meetingLink ? `
              <p style="margin: 5px 0;"><strong>Join Meeting:</strong>
                <a href="${event.meetingLink}" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: 500;">
                  Click to Join
                </a>
              </p>
            ` : ''}
          </div>

          ${event.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d;">${event.description.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
        </div>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">Calendar Invitation Attached</h3>
          <p style="margin: 8px 0; color: #155724;">
            A calendar invitation (.ics file) is attached to this email. Click on it to add this event to your calendar and respond with Accept/Decline.
          </p>
        </div>

              </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          EDWIND Training Management System<br>
          <a href="mailto:support@edwind.ca" style="color: #1976d2;">support@edwind.ca</a>
        </p>
      </div>

    </body>
    </html>
  `;
}
