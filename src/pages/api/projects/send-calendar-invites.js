import prisma from '../../../lib/prisma';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG');

// Rate limiting: 2 requests per second = 500ms delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 600; // 600ms to be safe (slightly more than 500ms)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, groupIds, events, projectTitle, dailyFocusData } = req.body;

    if (!projectId || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: projectId and groupIds' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events to send invites for' });
    }

    // Fetch project details and groups with participants
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        groups: {
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
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all participants from selected groups
    const allParticipants = [];
    project.groups.forEach(group => {
      group.participants.forEach(groupParticipant => {
        let participant = null;
        
        if (groupParticipant.participant?.participant) {
          participant = groupParticipant.participant.participant;
        } else if (groupParticipant.participant) {
          participant = groupParticipant.participant;
        }
        
        if (participant && participant.email && participant.firstName && participant.lastName) {
          // Avoid duplicates
          if (!allParticipants.find(p => p.email === participant.email)) {
            allParticipants.push({
              email: participant.email,
              firstName: participant.firstName,
              lastName: participant.lastName,
              groupName: group.groupName
            });
          }
        }
      });
    });

    if (allParticipants.length === 0) {
      return res.status(400).json({ message: 'No participants with valid email addresses found in selected groups' });
    }

    // Create calendar events data
    const calendarEvents = events.map(event => {
      const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
      const dateKey = format(startDate, 'yyyy-MM-dd');
      const dailyFocus = dailyFocusData[dateKey];

      // Get group names for this event
      const eventGroups = event.event_groups || [];
      const groupNames = eventGroups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);

      // Mock Zoom meeting link for testing
      const zoomLink = `https://us02web.zoom.us/j/${Math.floor(Math.random() * 900000000) + 100000000}?pwd=${Math.random().toString(36).substring(2, 15)}`;

      return {
        title: event.title || 'Training Event',
        description: createEventDescription(event, dailyFocus, groupNames, zoomLink),
        startTime: startDate,
        endTime: endDate || new Date(startDate.getTime() + 60 * 60 * 1000), // Default 1 hour if no end time
        location: event.location || zoomLink,
        course: event.course?.title || null,
        zoomLink: zoomLink
      };
    });

    // Send individual calendar event invites to each participant
    const inviteResults = [];
    
    for (const participant of allParticipants) {
      const participantResults = [];
      
      // Send separate invitation for each event
      for (const event of calendarEvents) {
        try {
          const eventIcal = generateSingleEventInvitation(event, projectTitle, participant);
          
          // Send individual event invitation with rate limiting
          const emailData = await resend.emails.send({
            from: 'EDWIND Training Schedule <admin@edwind.ca>',
            to: [participant.email],
            subject: `Calendar Invitation: ${event.title} - ${projectTitle}`,
            html: generateEventInviteTemplate({
              participantName: `${participant.firstName} ${participant.lastName}`,
              event,
              projectTitle,
              groupName: participant.groupName
            }),
            attachments: [
              {
                filename: `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_invite.ics`,
                content: Buffer.from(eventIcal).toString('base64'),
                type: 'text/calendar; method=REQUEST',
                disposition: 'attachment'
              }
            ]
          });

          // Rate limiting delay - wait before next email
          await delay(RATE_LIMIT_DELAY);

          // Check if Resend returned an error
          if (emailData.error) {
            participantResults.push({
              eventTitle: event.title,
              status: 'failed',
              error: emailData.error.message || 'Email service error'
            });
          } else {
            participantResults.push({
              eventTitle: event.title,
              status: 'sent',
              emailId: emailData.data?.id || emailData.id
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

    res.status(200).json({
      success: successCount > 0,
      message: `Calendar invites processed: ${successCount} sent, ${failureCount} failed`,
      results: inviteResults,
      summary: {
        totalParticipants: allParticipants.length,
        totalEvents: calendarEvents.length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error('Error sending calendar invites:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function createEventDescription(event, dailyFocus, groupNames, zoomLink) {
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
  
  if (dailyFocus) {
    description += `Daily Focus: ${dailyFocus}\n\n`;
  }
  
  if (zoomLink) {
    description += `Join Zoom Meeting: ${zoomLink}\n\n`;
    description += `Meeting ID: ${zoomLink.match(/\/j\/(\d+)/)?.[1] || 'N/A'}\n`;
    description += `Passcode: Available in meeting link\n\n`;
  }
  
  description += 'Generated by EDWIND Training Management System';
  
  return description;
}

function generateSingleEventInvitation(event, projectTitle, participant) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const startTime = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endTime = event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${timestamp}-${Math.random().toString(36).substring(7)}@edwind.training`;
  
  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EDWIND//Training Event Invitation//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${event.title}${event.course ? ` - ${event.course}` : ''}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
ATTENDEE;CN=${participant.firstName} ${participant.lastName};RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${participant.email}
ORGANIZER;CN=EDWIND Training:mailto:crm360accesses@lumiversa.com
REQUEST-STATUS:2.0;Success
END:VEVENT
END:VCALENDAR`;
  
  return ical;
}

function generateEventInviteTemplate({ participantName, event, projectTitle, groupName }) {
  const startTime = format(event.startTime, 'EEEE, MMMM d, yyyy', { locale: fr });
  const timeRange = `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendar Invitation - ${event.title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Training Invitation</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${projectTitle}</p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>
        
        <p style="color: #6c757d; margin-bottom: 25px;">
          You are invited to attend the following training session${groupName ? ` as part of the <strong>${groupName}</strong> group` : ''}:
        </p>

        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #1976d2;">
          <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 24px;">${event.title}</h2>
          ${event.course ? `<p style="margin: 0 0 10px 0; color: #6c757d; font-weight: 500;">Course: ${event.course}</p>` : ''}
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${startTime}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${timeRange}</p>
            ${event.location && !event.zoomLink ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location}</p>` : ''}
            ${event.zoomLink ? `
              <p style="margin: 5px 0;"><strong>💻 Join Zoom Meeting:</strong> 
                <a href="${event.zoomLink}" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: 500;">
                  Click to Join Meeting
                </a>
              </p>
              <p style="margin: 5px 0; font-size: 0.9em; color: #6c757d;">
                <strong>Meeting ID:</strong> ${event.zoomLink.match(/\/j\/(\d+)/)?.[1] || 'N/A'}
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
          <h3 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">📎 Calendar Invitation Attached</h3>
          <p style="margin: 8px 0; color: #155724;">
            A calendar invitation (.ics file) is attached to this email. Click on it to add this event to your calendar and respond with Accept/Decline.
          </p>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">📋 Important Notes</h3>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0c5460;">
            <li>Please respond to this calendar invitation (Accept/Decline)</li>
            <li>Arrive 15 minutes before the session starts</li>
            <li>Bring any required materials as specified in your course documentation</li>
            <li>Contact your instructor if you need to reschedule or have questions</li>
          </ul>
        </div>

        <p style="color: #6c757d; margin-top: 25px;">
          If you have any questions about this training session, please don't hesitate to contact our training support team.
        </p>
      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          Generated by EDWIND Training Management System<br>
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}

function generateEmailTemplate({ participantName, projectTitle, calendarEvents, groupName }) {
  const eventsHtml = calendarEvents.map(event => {
    const startTime = format(event.startTime, 'EEEE, MMMM d, yyyy', { locale: fr });
    const timeRange = `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`;
    
    return `
      <tr style="border-bottom: 1px solid #e1e5e9;">
        <td style="padding: 12px 8px; background-color: #f8f9fa;">
          <strong>${event.title}</strong>
          ${event.course ? `<br><span style="color: #6c757d; font-size: 0.875rem;">${event.course}</span>` : ''}
        </td>
        <td style="padding: 12px 8px;">
          <div style="margin-bottom: 4px;">
            <strong>Date:</strong> ${startTime}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Time:</strong> ${timeRange}
          </div>
          ${event.location ? `
            <div style="margin-bottom: 4px;">
              <strong>Location:</strong> ${event.location}
            </div>
          ` : ''}
          ${event.description ? `
            <div style="margin-top: 8px; color: #6c757d; font-size: 0.875rem;">
              ${event.description.replace(/\n/g, '<br>')}
            </div>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Schedule Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Training Schedule</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${projectTitle}</p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>
        
        <p style="color: #6c757d; margin-bottom: 25px;">
          You have been invited to participate in the <strong>${projectTitle}</strong> training program${groupName ? ` as part of the <strong>${groupName}</strong> group` : ''}. Please find your training schedule below:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Event</th>
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Schedule Details</th>
            </tr>
          </thead>
          <tbody>
            ${eventsHtml}
          </tbody>
        </table>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">📎 Calendar File Attached</h3>
          <p style="margin: 8px 0; color: #155724;">
            A calendar file (.ics) is attached to this email. You can import it directly into your calendar application (Outlook, Google Calendar, Apple Calendar, etc.) to add all training events at once.
          </p>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">📋 Important Notes</h3>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0c5460;">
            <li>Please arrive 15 minutes before each session</li>
            <li>Bring any required materials as specified in your course documentation</li>
            <li>Contact your instructor if you need to reschedule or have questions</li>
            <li>All training sessions are mandatory unless otherwise noted</li>
          </ul>
        </div>

        <p style="color: #6c757d; margin-top: 25px;">
          If you have any questions about your training schedule or need assistance, please don't hesitate to contact our training support team.
        </p>
      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          Generated by EDWIND Training Management System<br>
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}