import prisma from '../../../lib/prisma';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
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
const RATE_LIMIT_DELAY = 600; // 600ms to be safe (slightly more than 500ms)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, groupIds = [], events, projectTitle, dailyFocusData, includeMeetingLink = true, customMeetingLink = null, customTemplate, templateType, instructorEmails = [], timezone = 'UTC' } = req.body;

    // Require either groups or instructors to send to
    if ((!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) && (!instructorEmails || !Array.isArray(instructorEmails) || instructorEmails.length === 0)) {
      return res.status(400).json({ message: 'Missing required fields: at least one of groupIds or instructorEmails must be provided' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events to send invites for' });
    }

    // Fetch project details and groups with participants
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        sub_organization: {
          select: {
            title: true
          }
        },
        groups: groupIds.length > 0 ? {
          where: {
            id: { in: groupIds.map(id => parseInt(id)) }
          },
          include: {
            participants: {
              include: {
                participant: {
                  include: {
                    participant: true
                  }
                }
              }
            }
          }
        } : false,
        // Also fetch project instructors for instructor emails
        project_instructors: instructorEmails.length > 0 ? {
          include: {
            instructor: true
          }
        } : false
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all participants from selected groups
    const allParticipants = [];
    const invalidEmailRecipients = []; // Track recipients with invalid emails

    // Add participants from groups
    if (project.groups && Array.isArray(project.groups)) {
      project.groups.forEach(group => {
        group.participants.forEach(groupParticipant => {
          let participant = null;

          if (groupParticipant.participant?.participant) {
            participant = groupParticipant.participant.participant;
          } else if (groupParticipant.participant) {
            participant = groupParticipant.participant;
          }

          if (participant && participant.firstName && participant.lastName) {
            const recipientName = `${participant.firstName} ${participant.lastName}`.trim();

            // Validate email format
            if (!isValidEmail(participant.email)) {
              invalidEmailRecipients.push({
                name: recipientName,
                email: participant.email || '(no email)',
                groupName: group.groupName,
                type: 'participant'
              });
              return;
            }

            const cleanedEmail = cleanEmail(participant.email);
            // Avoid duplicates
            if (!allParticipants.find(p => p.email === cleanedEmail)) {
              allParticipants.push({
                email: cleanedEmail,
                firstName: participant.firstName,
                lastName: participant.lastName,
                groupName: group.groupName,
                isInstructor: false
              });
            }
          }
        });
      });
    }

    // Add instructors if instructorEmails were provided
    if (instructorEmails.length > 0 && project.project_instructors) {
      project.project_instructors.forEach(pi => {
        const instructor = pi.instructor;
        if (instructor && instructorEmails.includes(instructor.email)) {
          const recipientName = `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim();

          // Validate email format
          if (!isValidEmail(instructor.email)) {
            invalidEmailRecipients.push({
              name: recipientName,
              email: instructor.email || '(no email)',
              groupName: null,
              type: 'instructor'
            });
            return;
          }

          const cleanedEmail = cleanEmail(instructor.email);
          // Avoid duplicates (instructor might also be a participant)
          if (!allParticipants.find(p => p.email === cleanedEmail)) {
            allParticipants.push({
              email: cleanedEmail,
              firstName: instructor.firstName || 'Instructor',
              lastName: instructor.lastName || '',
              groupName: null,
              isInstructor: true
            });
          }
        }
      });
    }

    // Log invalid emails for debugging
    if (invalidEmailRecipients.length > 0) {
      console.warn('[send-calendar-invites] Skipped recipients with invalid emails:', invalidEmailRecipients);
    }

    if (allParticipants.length === 0) {
      const invalidList = invalidEmailRecipients.map(r => `${r.name} (${r.email})`).join(', ');
      return res.status(400).json({
        success: false,
        message: invalidEmailRecipients.length > 0
          ? `No valid email addresses found. The following recipients have invalid emails: ${invalidList}`
          : 'No recipients with valid email addresses found',
        invalidEmails: invalidEmailRecipients
      });
    }

    // Check email limit (one email per participant per event)
    const totalEmailsToSend = allParticipants.length * events.length;
    const orgIdForLimit = await getOrgIdFromProject(parseInt(projectId));
    if (orgIdForLimit) {
      const limitCheck = await enforceResourceLimit(orgIdForLimit, RESOURCES.EMAILS_PER_MONTH, totalEmailsToSend);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
    }

    // Create calendar events data
    const calendarEvents = events.map(event => {
      const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
      const dateKey = format(startDate, 'yyyy-MM-dd');
      const dailyFocus = dailyFocusData?.[dateKey];

      // Get group names for this event
      const eventGroups = event.event_groups || [];
      const groupNames = eventGroups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);

      // Get instructor name from event
      const eventInstructors = event.event_instructors || [];
      const firstInstructor = eventInstructors[0]?.instructor;
      const instructorName = firstInstructor
        ? `${firstInstructor.firstName} ${firstInstructor.lastName}`.trim()
        : null;

      // Use custom meeting link if provided, otherwise use event's existing meeting link
      const meetingLink = includeMeetingLink
        ? (customMeetingLink || event.meetingLink || event.zoomLink || null)
        : null;

      // Get room information
      const room = event.room || null;
      const roomLocation = room ? `${room.name}${room.location ? ` - ${room.location}` : ''}` : null;

      // Determine location: prefer room, then event location, then meeting link
      let eventLocation = 'TBD';
      if (roomLocation) {
        eventLocation = roomLocation;
      } else if (event.location) {
        eventLocation = event.location;
      } else if (includeMeetingLink && meetingLink) {
        eventLocation = meetingLink;
      }

      return {
        title: event.title || 'Training Event',
        description: createEventDescription(
          { ...event, room },
          { dailyFocus, groupNames, meetingLink, includeMeetingLink }
        ),
        startTime: startDate,
        endTime: endDate || new Date(startDate.getTime() + 60 * 60 * 1000), // Default 1 hour if no end time
        location: eventLocation,
        course: event.course?.title || null,
        meetingLink: meetingLink,
        instructorName: instructorName,
        room: room,
        // Use event-specific timezone, or fall back to project timezone
        // Check for both null and empty string
        timezone: (event.timezone && event.timezone.trim()) || timezone
      };
    });

    // Send individual calendar event invites to each participant
    const inviteResults = [];
    
    for (const participant of allParticipants) {
      const participantResults = [];
      
      // Send separate invitation for each event
      for (const event of calendarEvents) {
        try {
          const organizerName = event.instructorName || project.sub_organization?.title || 'EDWIND Training';
          const eventIcal = generateSingleEventICS(event, participant, organizerName);

          // Send individual event invitation with retry logic for rate limits
          const emailResponse = await sendWithRetry({
            from: EMAIL_SENDERS.training,
            to: [participant.email],
            subject: `Training Session: ${event.title} | ${projectTitle}`,
            html: customTemplate ? generateCustomTemplate({
              template: customTemplate,
              participantName: `${participant.firstName} ${participant.lastName}`,
              event,
              projectTitle,
              groupName: participant.groupName,
              events: templateType === 'summary' ? calendarEvents : [event],
              templateType,
              project
            }) : generateEventInviteTemplate({
              participantName: `${participant.firstName} ${participant.lastName}`,
              event,
              projectTitle,
              groupName: participant.groupName
            }),
            attachments: [createICSAttachment(eventIcal, event.title)]
          });

          // Rate limiting delay - wait before next email
          await delay(RATE_LIMIT_DELAY);

          // Check if Resend returned an error
          if (emailResponse.error) {
            const errorInfo = emailResponse.error;
            participantResults.push({
              eventTitle: event.title,
              status: 'failed',
              error: errorInfo.message || 'Email service error',
              errorCode: errorInfo.code || errorInfo.statusCode || null,
              isRateLimited: errorInfo.code === 'RATE_LIMIT_EXCEEDED' || errorInfo.statusCode === 429
            });
          } else {
            participantResults.push({
              eventTitle: event.title,
              status: 'sent',
              emailId: emailResponse.data?.id || emailResponse.id
            });
          }
          
        } catch (error) {
          console.error(`Failed to send event invite to ${participant.email} for ${event.title}:`, error);
          participantResults.push({
            eventTitle: event.title,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      const successCount = participantResults.filter(r => r.status === 'sent').length;
      const failureCount = participantResults.filter(r => r.status === 'failed').length;
      
      inviteResults.push({
        email: participant.email,
        name: `${participant.firstName} ${participant.lastName}`,
        groupName: participant.groupName,
        eventsCount: calendarEvents.length,
        successfulInvites: successCount,
        failedInvites: failureCount,
        eventResults: participantResults,
        status: failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'partial')
      });
    }

    const successCount = inviteResults.filter(r => r.status === 'sent').length;
    const failureCount = inviteResults.filter(r => r.status === 'failed').length;
    const partialCount = inviteResults.filter(r => r.status === 'partial').length;

    // Check for rate limit errors across all results
    const rateLimitErrors = inviteResults.flatMap(r =>
      r.eventResults?.filter(er => er.isRateLimited) || []
    );
    const hasRateLimitErrors = rateLimitErrors.length > 0;

    // Build detailed error summary for the frontend
    const errorSummary = {};
    inviteResults.forEach(r => {
      r.eventResults?.forEach(er => {
        if (er.status === 'failed' && er.error) {
          const errorKey = er.errorCode || 'UNKNOWN';
          if (!errorSummary[errorKey]) {
            errorSummary[errorKey] = { count: 0, message: er.error };
          }
          errorSummary[errorKey].count++;
        }
      });
    });

    // Log email usage (fire-and-forget)
    const orgId = await getOrgIdFromProject(parseInt(projectId));
    const totalEmailsSent = inviteResults.reduce((sum, r) => sum + (r.successfulInvites || 0), 0);
    const userId = req.cookies?.workos_user_id;

    logUsage({
      provider: PROVIDERS.RESEND,
      action: 'send_calendar_invites',
      organizationId: orgId,
      userId,
      projectId: parseInt(projectId),
      inputSize: totalEmailsSent,
      success: successCount > 0,
      errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
    });

    // Build response message
    let responseMessage = `Calendar invites processed: ${successCount} sent, ${failureCount} failed`;
    if (hasRateLimitErrors) {
      responseMessage += ' (rate limit reached - please wait and retry failed invites)';
    }
    if (invalidEmailRecipients.length > 0) {
      responseMessage += `. ${invalidEmailRecipients.length} recipient(s) skipped due to invalid email addresses.`;
    }

    res.status(200).json({
      success: successCount > 0,
      message: responseMessage,
      results: inviteResults,
      summary: {
        totalParticipants: allParticipants.length,
        totalEvents: calendarEvents.length,
        successCount,
        failureCount,
        partialCount,
        hasRateLimitErrors,
        rateLimitedCount: rateLimitErrors.length,
        skippedInvalidEmails: invalidEmailRecipients.length,
        invalidEmailRecipients: invalidEmailRecipients,
        errorSummary
      }
    });

  } catch (error) {
    console.error('Error sending calendar invites:', error);

    // Provide more specific error messages
    let message = 'An unexpected error occurred while sending calendar invites.';

    if (error.message?.includes('email')) {
      message = 'There was an issue with one or more email addresses. Please verify all recipients have valid emails.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      message = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('rate')) {
      message = 'Too many requests. Please wait a moment and try again.';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
}

// Custom template function for advanced email customization (kept local as it's specific to this route)
function generateCustomTemplate({ template, participantName, event, events, projectTitle, groupName, templateType, project }) {
  let processedTemplate = template;
  
  // Template variables
  const variables = {
    '{{PROJECT_TITLE}}': projectTitle,
    '{{PARTICIPANT_NAME}}': participantName,
    '{{GROUP_NAME}}': groupName,
    '{{EVENT_TITLE}}': event?.title || '',
    '{{COURSE_TITLE}}': event?.course?.title || '',
    '{{EVENT_DATE}}': event ? format(new Date(event.startTime), 'EEEE, MMMM d, yyyy', { locale: enUS }) : '',
    '{{EVENT_TIME}}': event ? `${format(new Date(event.startTime), 'HH:mm')} - ${format(new Date(event.endTime), 'HH:mm')}` : '',
    '{{EVENT_LOCATION}}': event?.location || '',
    '{{EVENT_DESCRIPTION}}': event?.description || '',
    '{{MEETING_LINK}}': event?.meetingLink || ''
  };

  // Handle conditional blocks (e.g., {{#COURSE_TITLE}}...{{/COURSE_TITLE}})
  processedTemplate = processedTemplate.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, variable, content) => {
    const value = variables[`{{${variable}}}`];
    return value ? content.replace(new RegExp(`{{${variable}}}`, 'g'), value) : '';
  });

  // Replace regular variables
  Object.entries(variables).forEach(([variable, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Handle events list for summary template
  if (templateType === 'summary' && events) {
    // Group events by date for the new template format
    const eventsByDate = events.reduce((acc, evt) => {
      const date = format(new Date(evt.startTime), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(evt);
      return acc;
    }, {});

    // Generate schedule days HTML in the proper email template format
    const scheduleDaysHtml = Object.entries(eventsByDate).map(([dateKey, dayEvents], index, array) => {
      const date = new Date(dateKey + 'T12:00:00');
      const month = format(date, 'MMM', { locale: enUS }).toUpperCase();
      const day = format(date, 'dd');
      const dayName = format(date, 'EEEE', { locale: enUS }).toUpperCase();
      
      const eventsHtml = dayEvents.map(evt => {
        const timeRange = `${format(new Date(evt.startTime), 'HH:mm')}`;
        const groups = evt.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean).join(', ');
        
        return `
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>${timeRange}</strong> ${evt.title}${evt.course?.title ? ` ${evt.course.title}` : ''} ${groups ? `<strong>${groups}</strong>` : ''}</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>`;
      }).join('');
      
      return `
                    <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 20px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="divider_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
                                                                <div class="alignment" align="center">
                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                                        <tr>
                                                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #2D2D2D;"><span>&#8202;</span></td>
                                                                        </tr>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-top:10px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">${month}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 42px;"><span style="font-size:28px;"><strong>${day}</strong></span></p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:5px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">${dayName}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td class="column column-2" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-left: 15px; padding-right: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#cc0a0a;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Agenda</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    ${eventsHtml}
                                                </td>
                                                <td class="column column-3" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:10px;padding-right:10px;padding-top:15px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Focus of the day</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;">Sample focus content</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
    }).join('');
    
    processedTemplate = processedTemplate.replace(/{{#SCHEDULE_DAYS}}.*?{{\/SCHEDULE_DAYS}}/gs, scheduleDaysHtml);
  }

  // Handle groups section
  if (project?.groups) {
    const groupsHtml = project.groups.map((group, index) => {
      const participantsHtml = (group.participants || []).map(groupParticipant => {
        let participant = null;
        if (groupParticipant.participant?.participant) {
          participant = groupParticipant.participant.participant;
        } else if (groupParticipant.participant) {
          participant = groupParticipant.participant;
        }
        
        if (participant && participant.firstName && participant.lastName) {
          return `
                                                                <ul start="1" style="margin: 0; padding: 0; margin-left: 20px; list-style-type: revert; color: #000000; direction: ltr; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                                                                    <li style="margin-bottom: 0px;">${participant.firstName} ${participant.lastName}</li>
                                                                </ul>`;
        }
        return '';
      }).join('');

      return `
                                                <td class="column column-${index + 1}" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:20px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;"><strong>${group.groupName}</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="list_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:60px;padding-right:10px;">
                                                                ${participantsHtml}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>`;
    }).join('');
    
    // Handle the full groups section wrapper
    const fullGroupsSection = `
                    <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                ${groupsHtml}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
    
    processedTemplate = processedTemplate.replace(/{{#GROUPS_SECTION}}.*?{{\/GROUPS_SECTION}}/gs, fullGroupsSection);
    processedTemplate = processedTemplate.replace(/{{#GROUPS}}.*?{{\/GROUPS}}/gs, groupsHtml);
  }

  return processedTemplate;
}