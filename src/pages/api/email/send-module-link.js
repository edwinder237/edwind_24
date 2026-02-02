import prisma from '../../../lib/prisma';
import { logUsage, PROVIDERS } from '../../../lib/usage/usageLogger';
import { sendModuleLink, isValidEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { eventId, moduleTitle, moduleUrl, activityTitle, participantIds = [] } = req.body;

    if (!eventId || !moduleTitle || !moduleUrl || !activityTitle) {
      return res.status(400).json({ message: 'Event ID, module title, module URL, and activity title are required' });
    }

    // Fetch event with participants and project details
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        project: {
          include: {
            sub_organization: {
              include: {
                organization: true
              }
            }
          }
        },
        event_attendees: {
          where: {
            enrollee: {
              status: {
                not: 'removed'
              }
            }
          },
          include: {
            enrollee: {
              include: {
                participant: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get organization logo URL from the event data
    const organizationLogoUrl = event?.project?.sub_organization?.organization?.logo_url;

    if (!event.event_attendees || event.event_attendees.length === 0) {
      return res.status(400).json({ message: 'No participants found for this event' });
    }

    // Filter attendees if participantIds is provided
    let attendeesToSend = event.event_attendees;
    if (participantIds && participantIds.length > 0) {
      const participantIdArray = participantIds.map(id => parseInt(id, 10));
      const participantIdSet = new Set(participantIdArray);

      attendeesToSend = event.event_attendees.filter(attendee => {
        const participantId = attendee.enrollee?.participant?.id;
        return participantId && participantIdSet.has(parseInt(participantId, 10));
      });
    }

    if (attendeesToSend.length === 0) {
      return res.status(400).json({ message: 'No valid participants found to send to' });
    }

    const emailResults = [];

    // Send emails to selected participants using centralized email service
    for (const eventAttendee of attendeesToSend) {
      const participant = eventAttendee.enrollee.participant;

      if (!participant?.email || !isValidEmail(participant.email)) {
        emailResults.push({
          participantId: participant?.id,
          participantName: `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim(),
          error: 'No valid email address',
          status: 'skipped'
        });
        continue;
      }

      const result = await sendModuleLink({
        participant: {
          id: participant.id,
          email: participant.email,
          firstName: participant.firstName,
          lastName: participant.lastName
        },
        moduleTitle,
        activityTitle,
        moduleUrl,
        projectName: event.project?.title || 'Training Project',
        eventTitle: event.title,
        organizationLogoUrl
      });

      if (result.success) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          emailId: result.emailId,
          status: 'sent'
        });
      } else {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          error: result.error?.message || 'Email service error',
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;
    const skippedCount = emailResults.filter(result => result.status === 'skipped').length;

    // Log email usage (fire-and-forget)
    const orgId = event?.project?.sub_organization?.organizationId;
    const userId = req.cookies?.workos_user_id;
    logUsage({
      provider: PROVIDERS.RESEND,
      action: 'send_module_link',
      organizationId: orgId,
      userId,
      projectId: event?.project?.id,
      inputSize: successCount,
      success: successCount > 0,
      errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
    });

    res.status(200).json({
      message: `Module link sent to ${successCount} participant(s)`,
      results: emailResults,
      summary: {
        totalParticipants: attendeesToSend.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        emailsSkipped: skippedCount
      }
    });

  } catch (error) {
    console.error('Module link sending error:', error);
    res.status(500).json({
      message: 'Failed to send module links',
      error: error.message
    });
  }
}
