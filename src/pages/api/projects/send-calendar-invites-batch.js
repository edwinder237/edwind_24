import prisma from '../../../lib/prisma';
import { parseISO } from 'date-fns';
import { logUsage, getOrgIdFromProject, PROVIDERS } from '../../../lib/usage/usageLogger';
import {
  isValidEmail,
  cleanEmail,
  sendWithRetry,
  delay,
  generateSingleEventICS,
  createICSAttachment,
  createEventDescription,
  generateEventInviteTemplate,
  EMAIL_SENDERS
} from '../../../lib/email';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 600;

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

    // Get location from event or extendedProps
    const eventLocation = event.location || event.extendedProps?.location || null;

    // Get timezone from event
    const eventTimezone = event.timezone || 'UTC';

    // Create event description using centralized helper
    const description = createEventDescription(
      { ...event, course: event.course },
      { groupNames, meetingLink, includeMeetingLink }
    );

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
    const invalidEmailRecipients = [];

    if (participantIds && participantIds.length > 0) {
      // Use strings directly - participant IDs can be UUIDs or integers
      const participantIdSet = new Set(participantIds.map(id => String(id)));

      attendeesToSend = event.event_attendees.filter(attendee => {
        const participantId = attendee.enrollee?.participant?.id;
        // Compare as strings to handle both UUID and integer IDs
        return participantId && participantIdSet.has(String(participantId));
      });
    }

    if (attendeesToSend.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid participants found to send invites to' });
    }

    // Check email limit
    if (projectId) {
      const orgIdForLimit = await getOrgIdFromProject(parseInt(projectId));
      if (orgIdForLimit) {
        const limitCheck = await enforceResourceLimit(orgIdForLimit, RESOURCES.EMAILS_PER_MONTH, attendeesToSend.length);
        if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
      }
    }

    // Send emails to selected participants
    const emailResults = [];

    for (const attendee of attendeesToSend) {
      const participant = attendee.enrollee?.participant;
      const participantName = participant ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim() : 'Unknown';

      if (!participant?.email) {
        emailResults.push({
          participantId: participant?.id,
          participantName,
          error: 'No email address',
          status: 'skipped'
        });
        continue;
      }

      // Validate email format
      if (!isValidEmail(participant.email)) {
        invalidEmailRecipients.push({
          name: participantName,
          email: participant.email || '(no email)',
          type: 'participant'
        });
        emailResults.push({
          participantId: participant.id,
          participantName,
          error: 'Invalid email address',
          status: 'skipped'
        });
        continue;
      }

      try {
        const participantData = {
          email: cleanEmail(participant.email),
          firstName: participant.firstName || 'Participant',
          lastName: participant.lastName || ''
        };

        // Generate ICS using centralized generator
        const eventIcal = generateSingleEventICS(calendarEvent, participantData, organizerName);

        // Send email using centralized service with retry logic
        const emailResponse = await sendWithRetry({
          from: EMAIL_SENDERS.training,
          to: [participantData.email],
          subject: `Training Session: ${calendarEvent.title} | ${finalProjectTitle}`,
          html: generateEventInviteTemplate({
            participantName: `${participant.firstName} ${participant.lastName}`,
            event: calendarEvent,
            projectTitle: finalProjectTitle,
            groupName: groupNames.length > 0 ? groupNames.join(', ') : null
          }),
          attachments: [createICSAttachment(eventIcal, calendarEvent.title)]
        });

        // Rate limiting delay
        await delay(RATE_LIMIT_DELAY);

        if (emailResponse.error) {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participantData.email,
            participantName,
            error: emailResponse.error.message || 'Email service error',
            status: 'failed'
          });
        } else {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participantData.email,
            participantName,
            emailId: emailResponse.data?.id || emailResponse.id,
            status: 'sent'
          });
        }
      } catch (emailError) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.email,
          participantName,
          error: emailError.message,
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failureCount = emailResults.filter(r => r.status === 'failed').length;
    const skippedCount = emailResults.filter(r => r.status === 'skipped').length;

    // Log email usage (fire-and-forget)
    if (projectId) {
      const orgId = await getOrgIdFromProject(parseInt(projectId));
      const userId = req.cookies?.workos_user_id;

      logUsage({
        provider: PROVIDERS.RESEND,
        action: 'send_calendar_invites_batch',
        organizationId: orgId,
        userId,
        projectId: parseInt(projectId),
        inputSize: successCount,
        success: successCount > 0,
        errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
      });
    }

    res.status(200).json({
      success: successCount > 0,
      message: `Calendar invites sent to ${successCount} participant(s)`,
      results: emailResults,
      summary: {
        totalParticipants: attendeesToSend.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        emailsSkipped: skippedCount,
        invalidEmailRecipients: invalidEmailRecipients.length > 0 ? invalidEmailRecipients : undefined
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
