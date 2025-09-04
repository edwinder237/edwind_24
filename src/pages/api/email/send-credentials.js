import { Resend } from 'resend';
import prisma from '../../../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { participants, credentials, projectName } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({ message: 'Credentials array is required' });
    }

    // Fetch organization logo URL
    let organizationLogoUrl = null;
    try {
      const organization = await prisma.organizations.findFirst({
        select: {
          logo_url: true,
          title: true
        }
      });
      organizationLogoUrl = organization?.logo_url;
    } catch (error) {
      console.error('Error fetching organization logo:', error);
    }

    const emailResults = [];

    // Send individual emails to each participant
    for (const participant of participants) {
      if (!participant.participant?.email) {
        continue;
      }

      // Filter credentials for this specific participant
      const participantCredentials = participant.participant.toolAccesses?.filter(toolAccess =>
        credentials.some(selectedCred => 
          selectedCred.tool === toolAccess.tool && 
          selectedCred.toolType === toolAccess.toolType
        )
      ) || [];

      if (participantCredentials.length === 0) {
        continue;
      }

      try {
        const uniqueMessageId = `credentials-${participant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@edwind.ca`;
        
        const emailData = await resend.emails.send({
          from: 'CRM 360 access credentials <admin@edwind.ca>',
          to: [participant.participant.email],
          subject: `Your CRM 360 Access Credentials - ${projectName || 'Training Project'} - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
          headers: {
            'Message-ID': uniqueMessageId,
            'X-Entity-Ref-ID': uniqueMessageId
          },
          html: generateEmailTemplate({
            participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
            credentials: participantCredentials,
            projectName: projectName || 'Training Project',
            organizationLogoUrl
          })
        });

        // Check if Resend returned an error in the response
        if (emailData.error) {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
            credentialsCount: participantCredentials.length,
            error: emailData.error.error || emailData.error.message || 'Email service error',
            status: 'failed'
          });
        } else {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
            credentialsCount: participantCredentials.length,
            emailId: emailData.data?.id || emailData.id,
            status: 'sent'
          });
        }

      } catch (emailError) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
          credentialsCount: participantCredentials.length,
          error: emailError.message,
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;

    res.status(200).json({
      message: `Email sending completed: ${successCount} sent, ${failureCount} failed`,
      results: emailResults,
      summary: {
        totalParticipants: participants.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        credentialTypes: credentials.length
      }
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      message: 'Failed to send emails', 
      error: error.message 
    });
  }
}

function generateEmailTemplate({ participantName, credentials, projectName, organizationLogoUrl }) {
  const credentialsHtml = credentials.map(credential => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px 8px; background-color: #f8f8f8;">
        <strong>${credential.tool}</strong>
        <br>
        <span style="color: #666666; font-size: 0.875rem;">${credential.toolType || 'Tool'}</span>
      </td>
      <td style="padding: 12px 8px;">
        <div style="margin-bottom: 4px;">
          <strong>Username:</strong> <code style="background-color: #f8f8f8; padding: 2px 6px; font-family: monospace;">${credential.username}</code>
        </div>
        <div style="margin-bottom: 4px;">
          <strong>Password:</strong> <code style="background-color: #f8f8f8; padding: 2px 6px; font-family: monospace;">${credential.accessCode}</code>
        </div>
        ${credential.toolUrl ? `
          <div style="margin-top: 8px;">
            <a href="${credential.toolUrl}" target="_blank" style="color: #333333; text-decoration: underline;">
              ${credential.toolUrl}
            </a>
          </div>
        ` : ''}
        ${credential.toolDescription ? `
          <div style="margin-top: 8px; color: #666666; font-size: 0.875rem;">
            ${credential.toolDescription}
          </div>
        ` : ''}
      </td>
    </tr>
  `).join('');

  // Generate unique content to prevent Gmail collapsing
  const timestamp = new Date().toISOString();
  const uniqueId = Math.random().toString(36).substring(2, 15);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Access Credentials</title>
      <!-- Unique identifier to prevent email collapsing -->
      <meta name="x-unique-id" content="${uniqueId}">
      <meta name="x-timestamp" content="${timestamp}">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      
      <!-- Unique content to prevent Gmail threading/collapsing -->
      <div style="display: none; opacity: 0; color: transparent; height: 0; width: 0; font-size: 0; line-height: 0; max-height: 0; max-width: 0; mso-hide: all;">
        Credentials-${participantName.replace(/\s+/g, '')}-${uniqueId}-${timestamp}-${Math.random().toString(36).substring(2, 15)}
      </div>
      
      <!-- Additional unique preheader text -->
      <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        Access credentials for ${participantName} - Generated on ${new Date().toLocaleString()} - ID: ${uniqueId}
      </div>
      
      <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px;">
        ${organizationLogoUrl ? `
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${organizationLogoUrl}" alt="Organization Logo" style="height: 50px; width: auto; max-width: 180px; object-fit: contain;">
          </div>
        ` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: normal; text-align: center;">🔐 Access Credentials</h1>
      </div>

      <div style="padding: 0 0 30px 0;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>
        
        <p style="color: #333333; margin-bottom: 25px;">
          Your access credentials for the CRM 360 tool have been prepared. Please find your login information below:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e0e0e0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 15px 8px; text-align: left; font-weight: normal; color: #000000; border-bottom: 2px solid #d0d0d0;">Tool</th>
              <th style="padding: 15px 8px; text-align: left; font-weight: normal; color: #000000; border-bottom: 2px solid #d0d0d0;">Credentials</th>
            </tr>
          </thead>
          <tbody>
            ${credentialsHtml}
          </tbody>
        </table>

        <div style="background-color: #f0f0f0; border: 1px solid #d0d0d0; padding: 16px; margin: 25px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">🛡️ Security Reminder</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #333333; font-size: 14px;">
            <li>Keep your credentials secure and do not share them with others</li>
            <li>Change your password after first login if the system allows it</li>
            <li>Contact support if you have any access issues</li>
          </ul>
        </div>

        <p style="color: #666666; margin-top: 25px; font-size: 14px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>

      <div style="text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p style="margin: 0;">
        
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}