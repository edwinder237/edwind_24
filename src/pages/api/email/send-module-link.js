import { Resend } from 'resend';
import prisma from '../../../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { eventId, moduleTitle, moduleUrl, activityTitle } = req.body;

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

    // Get organization logo URL from the event data
    const organizationLogoUrl = event?.project?.sub_organization?.organization?.logo_url;

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.event_attendees || event.event_attendees.length === 0) {
      return res.status(400).json({ message: 'No participants found for this event' });
    }

    const emailResults = [];

    // Send emails to all participants
    for (const eventAttendee of event.event_attendees) {
      const participant = eventAttendee.enrollee.participant;
      
      if (!participant?.email) {
        emailResults.push({
          participantId: participant.id,
          participantName: `${participant.firstName} ${participant.lastName}`,
          error: 'No email address',
          status: 'skipped'
        });
        continue;
      }

      try {
        const uniqueMessageId = `module-${participant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@edwind.ca`;
        
        const emailData = await resend.emails.send({
          from: 'EDWIND Training <admin@edwind.ca>',
          to: [participant.email],
          subject: `Module Content: ${moduleTitle} - ${event.project?.title || 'Training Project'} - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
          headers: {
            'Message-ID': uniqueMessageId,
            'X-Entity-Ref-ID': uniqueMessageId
          },
          html: generateModuleEmailTemplate({
            participantName: `${participant.firstName} ${participant.lastName}`,
            moduleTitle,
            activityTitle,
            moduleUrl,
            projectName: event.project?.title || 'Training Project',
            eventTitle: event.title,
            organizationLogoUrl
          })
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
    const skippedCount = emailResults.filter(result => result.status === 'skipped').length;

    res.status(200).json({
      message: `Module link sent to ${successCount} participant(s)`,
      results: emailResults,
      summary: {
        totalParticipants: event.event_attendees.length,
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

function generateModuleEmailTemplate({ participantName, moduleTitle, activityTitle, moduleUrl, projectName, eventTitle, organizationLogoUrl }) {
  // Generate unique content to prevent Gmail collapsing
  const timestamp = new Date().toISOString();
  const uniqueId = Math.random().toString(36).substring(2, 15);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Module Content Link</title>
      <!-- Unique identifier to prevent email collapsing -->
      <meta name="x-unique-id" content="${uniqueId}">
      <meta name="x-timestamp" content="${timestamp}">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      
      <!-- Unique content to prevent Gmail threading/collapsing -->
      <div style="display: none; opacity: 0; color: transparent; height: 0; width: 0; font-size: 0; line-height: 0; max-height: 0; max-width: 0; mso-hide: all;">
        Module-${participantName.replace(/\s+/g, '')}-${moduleTitle.replace(/\s+/g, '')}-${uniqueId}-${timestamp}-${Math.random().toString(36).substring(2, 15)}
      </div>
      
      <!-- Additional unique preheader text -->
      <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        Module content for ${participantName} - ${moduleTitle} - Generated on ${new Date().toLocaleString()} - ID: ${uniqueId}
      </div>
      
      <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px;">
        ${organizationLogoUrl ? `
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${organizationLogoUrl}" alt="Organization Logo" style="height: 50px; width: auto; max-width: 180px; object-fit: contain;">
          </div>
        ` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: normal; text-align: center;">📚 Module Content</h1>
      </div>

      <div style="padding: 0 0 30px 0;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>
        
        <p style="color: #333333; margin-bottom: 25px;">
          Your instructor has shared module content with you for the following session:
        </p>

        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 3px solid #666666;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">📅 ${eventTitle}</p>
          <p style="margin: 8px 0; color: #333333;">
            <strong>Module:</strong> ${moduleTitle}
          </p>
          <p style="margin: 8px 0; color: #333333;">
            <strong>Activity:</strong> ${activityTitle}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${moduleUrl}" target="_blank" style="display: inline-block; background: #4a4a4a; color: white; text-decoration: none; padding: 12px 30px; font-weight: normal; font-size: 16px;">
            🔗 Access Module Content
          </a>
        </div>

        <div style="background-color: #f0f0f0; border: 1px solid #d0d0d0; padding: 16px; margin: 25px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">ℹ️ Important Notes</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #333333; font-size: 14px;">
            <li>This link will open the content in a new browser tab</li>
            <li>Make sure you have a stable internet connection</li>
            <li>Contact your instructor if you have trouble accessing the content</li>
          </ul>
        </div>

        <p style="color: #666666; margin-top: 25px; font-size: 14px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
        </p>
        <div style="background: #f8f8f8; padding: 12px; word-break: break-all; font-family: monospace; font-size: 13px; border: 1px solid #e0e0e0;">
          ${moduleUrl}
        </div>
      </div>

      <div style="text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p style="margin: 0;">
          This is an automated message from EDWIND Training System.
          <br>
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}