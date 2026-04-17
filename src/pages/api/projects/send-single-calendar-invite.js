import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';
import { parseISO } from 'date-fns';
import {
  isValidEmail,
  cleanEmail,
  sendCalendarInvite,
  formatRecipientName
} from '../../../lib/email';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';
import { logEmail } from '../../../lib/email/emailLogger';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
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
    if (!projectId || !eventId || !participantFirstName || !participantLastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, eventId, participantFirstName, participantLastName'
      });
    }

    // Validate email format using centralized validator
    const recipientName = formatRecipientName(participantFirstName, participantLastName);
    if (!participantEmail || !isValidEmail(participantEmail)) {
      return res.status(400).json({
        success: false,
        message: `Invalid email address for ${recipientName}. Please ensure a valid email is configured.`,
        field: 'participantEmail',
        providedValue: participantEmail || '(empty)'
      });
    }

    const cleanedEmail = cleanEmail(participantEmail);

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

    // Fetch project for organization name and org ID
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        sub_organization: {
          select: { title: true, organizationId: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check email limit
    if (project.sub_organization?.organizationId) {
      const limitCheck = await enforceResourceLimit(project.sub_organization.organizationId, RESOURCES.EMAILS_PER_MONTH, 1);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
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

    // Get location from event
    const eventLocation = event.location || event.extendedProps?.location || null;
    const eventTimezone = event.timezone || 'UTC';

    // Prepare calendar event data
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

    const organizerName = instructorName || project.sub_organization?.title || 'EDBAHN Training';

    // Send calendar invite using centralized email service
    const result = await sendCalendarInvite({
      event: calendarEvent,
      recipient: {
        email: cleanedEmail,
        firstName: participantFirstName,
        lastName: participantLastName
      },
      projectTitle: projectTitle || project.title,
      organizerName,
      groupName: groupNames.length > 0 ? groupNames.join(', ') : null
    });

    // Log individual email (fire-and-forget)
    const subOrgId = req.orgContext?.subOrganizationIds?.[0];
    const emailLogData = {
      sub_organizationId: subOrgId,
      recipientEmail: cleanedEmail,
      recipientName: recipientName,
      recipientType: 'participant',
      subject: `Training Session: ${calendarEvent.title} | ${projectTitle || project.title}`,
      emailType: 'calendar_invite',
      projectId: parseInt(projectId),
      projectTitle: projectTitle || project.title || null,
      eventId: parseInt(eventId),
      sentByUserId: req.orgContext?.userId || null,
    };

    if (!result.success) {
      console.error('Email send error:', result.error);

      if (subOrgId) {
        logEmail({ ...emailLogData, status: 'failed', errorMessage: result.error?.message || 'Email service error' });
      }

      // Provide user-friendly error messages
      let userMessage = `Failed to send calendar invite to ${recipientName}.`;

      if (result.error?.code === 'INVALID_EMAIL') {
        userMessage = `Invalid email address for ${recipientName}. Please verify the email is correct.`;
      } else if (result.error?.code === 'RATE_LIMIT_EXCEEDED') {
        userMessage = 'Too many emails sent. Please wait a moment and try again.';
      } else if (result.error?.message) {
        userMessage = `Email error: ${result.error.message}`;
      }

      return res.status(400).json({
        success: false,
        message: userMessage,
        email: cleanedEmail
      });
    }

    if (subOrgId) {
      logEmail({ ...emailLogData, status: 'sent', resendEmailId: result.emailId || null });
    }

    res.status(200).json({
      success: true,
      message: `Calendar invite sent to ${recipientName} (${cleanedEmail})`,
      emailId: result.emailId
    });

  }
});
