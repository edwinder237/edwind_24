import prisma from '../../../lib/prisma';
import { parseISO } from 'date-fns';
import {
  isValidEmail,
  cleanEmail,
  sendCalendarInvite,
  formatRecipientName
} from '../../../lib/email';

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

    const organizerName = instructorName || project.sub_organization?.title || 'EDWIND Training';

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

    if (!result.success) {
      console.error('Email send error:', result.error);

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

    res.status(200).json({
      success: true,
      message: `Calendar invite sent to ${recipientName} (${cleanedEmail})`,
      emailId: result.emailId
    });

  } catch (error) {
    console.error('Error sending single calendar invite:', error);

    // Provide more specific error messages based on error type
    let message = 'An unexpected error occurred while sending the calendar invite.';

    if (error.message?.includes('email')) {
      message = 'There was an issue with the email address. Please verify it is correct.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      message = 'Network error. Please check your connection and try again.';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
}
