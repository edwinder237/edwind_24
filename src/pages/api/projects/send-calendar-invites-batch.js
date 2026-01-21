import prisma from '../../../lib/prisma';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      projectId,
      eventId,
      projectTitle,
      includeMeetingLink = true,
      participantIds = [] // Optional array of participant IDs to filter who receives invites
    } = req.body;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Fetch the event with all related data including attendees
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
        },
        event_attendees: {
          include: {
            enrollee: {
              include: {
                participant: true
              }
            }
          },
          where: {
            enrollee: {
              status: {
                not: 'removed'
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!event.event_attendees || event.event_attendees.length === 0) {
      return res.status(400).json({ success: false, message: 'No participants assigned to this event' });
    }

    // Fetch project for organization name
    const project = projectId ? await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        sub_organization: {
          select: { title: true }
        }
      }
    }) : null;

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

    // Get location from event or extendedProps
    const eventLocation = event.location || event.extendedProps?.location || null;

    // Get timezone from event
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

    const organizerName = instructorName || project?.sub_organization?.title || 'EDWIND Training';
    const finalProjectTitle = projectTitle || project?.title || 'Training Project';

    // Filter attendees if participantIds is provided
    let attendeesToSend = event.event_attendees;
    if (participantIds && participantIds.length > 0) {
      const participantIdSet = new Set(participantIds.map(id => parseInt(id)));
      attendeesToSend = event.event_attendees.filter(attendee => {
        const participantId = attendee.enrollee?.participant?.id;
        return participantId && participantIdSet.has(participantId);
      });
    }

    if (attendeesToSend.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid participants found to send invites to' });
    }

    // Send emails to selected participants
    const emailResults = [];

    for (const attendee of attendeesToSend) {
      const participant = attendee.enrollee?.participant;

      if (!participant?.email) {
        emailResults.push({
          participantId: participant?.id,
          participantName: participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown',
          error: 'No email address',
          status: 'skipped'
        });
        continue;
      }

      try {
        const participantData = {
          email: participant.email,
          firstName: participant.firstName || 'Participant',
          lastName: participant.lastName || ''
        };

        const eventIcal = generateEventInvitation(calendarEvent, finalProjectTitle, participantData, organizerName);

        const emailData = await resend.emails.send({
          from: 'Training Schedule <admin@edwind.ca>',
          to: [participant.email],
          subject: `Training Session: ${calendarEvent.title} | ${finalProjectTitle}`,
          html: generateEventInviteTemplate({
            participantName: `${participant.firstName} ${participant.lastName}`,
            event: calendarEvent,
            projectTitle: finalProjectTitle,
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
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.email,
            participantName: `${participant.firstName} ${participant.lastName}`,
            error: emailData.error.message || 'Email service error',
            status: 'failed'
          });
        } else {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.email,
            participantName: `${participant.firstName} ${participant.lastName}`,
            emailId: emailData.data?.id || emailData.id,
            status: 'sent'
          });
        }
      } catch (emailError) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          error: emailError.message,
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failureCount = emailResults.filter(r => r.status === 'failed').length;
    const skippedCount = emailResults.filter(r => r.status === 'skipped').length;

    res.status(200).json({
      success: true,
      message: `Calendar invites sent to ${successCount} participant(s)`,
      results: emailResults,
      summary: {
        totalParticipants: attendeesToSend.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        emailsSkipped: skippedCount
      }
    });

  } catch (error) {
    console.error('Error sending batch calendar invites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

function generateEventInvitation(event, projectTitle, participant, organizationName = 'EDWIND Training') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${timestamp}-${Math.random().toString(36).substring(7)}@edwind.training`;

  const eventTimezone = event.timezone || 'UTC';
  let dtstart, dtend, vtimezone = '';

  if (eventTimezone && eventTimezone !== 'UTC') {
    const formatForICS = (date, tz) => {
      return formatInTimeZone(date, tz, "yyyyMMdd'T'HHmmss");
    };

    dtstart = `DTSTART;TZID=${eventTimezone}:${formatForICS(event.startTime, eventTimezone)}`;
    dtend = `DTEND;TZID=${eventTimezone}:${formatForICS(event.endTime, eventTimezone)}`;

    vtimezone = `BEGIN:VTIMEZONE
TZID:${eventTimezone}
X-LIC-LOCATION:${eventTimezone}
END:VTIMEZONE
`;
  } else {
    const startTime = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    dtstart = `DTSTART:${startTime}`;
    dtend = `DTEND:${endTime}`;
  }

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
              <p style="margin: 0; color: #6c757d;">${event.description.replace(/\\n/g, '<br>')}</p>
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
