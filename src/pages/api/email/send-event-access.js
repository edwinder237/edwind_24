import { Resend } from 'resend';
import prisma from '../../../lib/prisma';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { eventId, projectId, projectTitle } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Fetch event with attendees (participants assigned to the event)
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        course: {
          select: {
            id: true,
            title: true
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
        },
        event_groups: {
          include: {
            groups: {
              select: {
                groupName: true
              }
            }
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

    if (!event.event_attendees || event.event_attendees.length === 0) {
      return res.status(400).json({ message: 'No participants assigned to this event' });
    }

    // Collect all unique participants from event attendees
    const participantsMap = new Map();

    for (const attendee of event.event_attendees) {
      const participant = attendee.enrollee?.participant;
      if (participant && participant.email && !participantsMap.has(participant.id)) {
        participantsMap.set(participant.id, participant);
      }
    }

    const participants = Array.from(participantsMap.values());

    // Get group names for context in email
    const groupNames = event.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean) || [];

    if (participants.length === 0) {
      return res.status(400).json({ message: 'No participants with email addresses found' });
    }

    // Format event details
    const eventTimezone = event.timezone || 'UTC';
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;

    const formattedDate = eventTimezone !== 'UTC'
      ? formatInTimeZone(startDate, eventTimezone, 'EEEE, MMMM d, yyyy')
      : format(startDate, 'EEEE, MMMM d, yyyy');

    const formattedStartTime = eventTimezone !== 'UTC'
      ? formatInTimeZone(startDate, eventTimezone, 'HH:mm')
      : format(startDate, 'HH:mm');

    const formattedEndTime = endDate
      ? (eventTimezone !== 'UTC'
        ? formatInTimeZone(endDate, eventTimezone, 'HH:mm')
        : format(endDate, 'HH:mm'))
      : null;

    const timeRange = formattedEndTime
      ? `${formattedStartTime} - ${formattedEndTime}`
      : formattedStartTime;

    // Get instructor name
    const leadInstructor = event.event_instructors?.[0]?.instructor;
    const instructorName = leadInstructor
      ? `${leadInstructor.firstName || ''} ${leadInstructor.lastName || ''}`.trim()
      : null;

    // Get location from extendedProps
    const eventLocation = event.location || event.extendedProps?.location || null;

    // Get meeting link
    const meetingLink = event.meetingLink || event.zoomLink || event.extendedProps?.meetingLink || null;

    const emailResults = [];

    // Send plain text emails to all participants
    for (const participant of participants) {
      try {
        const uniqueMessageId = `event-access-${participant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@edwind.ca`;

        // Build plain text email content
        const textContent = buildPlainTextEmail({
          participantName: `${participant.firstName} ${participant.lastName}`,
          eventTitle: event.title,
          courseName: event.course?.title,
          date: formattedDate,
          timeRange,
          timezone: eventTimezone,
          location: eventLocation,
          meetingLink,
          instructorName,
          groupNames: groupNames.join(', '),
          projectTitle: projectTitle || 'Training Project'
        });

        const emailData = await resend.emails.send({
          from: 'EDWIND Training <admin@edwind.ca>',
          to: [participant.email],
          subject: `Training Session: ${event.title} - ${formattedDate}`,
          headers: {
            'Message-ID': uniqueMessageId,
            'X-Entity-Ref-ID': uniqueMessageId
          },
          text: textContent
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

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;

    res.status(200).json({
      success: true,
      message: `Event access sent to ${successCount} participant(s)`,
      results: emailResults,
      summary: {
        totalParticipants: participants.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        groupsNotified: groupNames
      }
    });

  } catch (error) {
    console.error('Event access sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send event access notifications',
      error: error.message
    });
  }
}

function buildPlainTextEmail({
  participantName,
  eventTitle,
  courseName,
  date,
  timeRange,
  timezone,
  location,
  meetingLink,
  instructorName,
  groupNames,
  projectTitle
}) {
  let text = `Hello ${participantName},

You have been scheduled for the following training session:

EVENT DETAILS
-------------
Title: ${eventTitle}
${courseName && courseName !== eventTitle ? `Course: ${courseName}\n` : ''}Date: ${date}
Time: ${timeRange}
Time Zone: ${timezone}
${location ? `Location: ${location}\n` : ''}${instructorName ? `Instructor: ${instructorName}\n` : ''}${groupNames ? `Group: ${groupNames}\n` : ''}
Project: ${projectTitle}`;

  if (meetingLink) {
    text += `

JOIN ONLINE
-----------
Meeting Link: ${meetingLink}`;
  }

  text += `

---
This is an automated message from EDWIND Training Management System.
If you have questions, please contact your instructor or training coordinator.`;

  return text;
}
