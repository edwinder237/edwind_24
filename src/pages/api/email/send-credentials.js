import { Resend } from 'resend';

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
        const emailData = await resend.emails.send({
          from: 'CRM 360 access credentials <admin@edwind.ca>',
          to: [participant.participant.email],
          subject: `Your CRM 360 Access Credentials - ${projectName || 'Training Project'}`,
          html: generateEmailTemplate({
            participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
            credentials: participantCredentials,
            projectName: projectName || 'Training Project'
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

function generateEmailTemplate({ participantName, credentials, projectName }) {
  const credentialsHtml = credentials.map(credential => `
    <tr style="border-bottom: 1px solid #e1e5e9;">
      <td style="padding: 12px 8px; background-color: #f8f9fa;">
        <strong>${credential.tool}</strong>
        <br>
        <span style="color: #6c757d; font-size: 0.875rem;">${credential.toolType || 'Tool'}</span>
      </td>
      <td style="padding: 12px 8px;">
        <div style="margin-bottom: 4px;">
          <strong>Username:</strong> <code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${credential.username}</code>
        </div>
        <div style="margin-bottom: 4px;">
          <strong>Password:</strong> <code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${credential.accessCode}</code>
        </div>
        ${credential.toolUrl ? `
          <div style="margin-top: 8px;">
            <a href="${credential.toolUrl}" target="_blank" style="color: #007bff; text-decoration: none;">
              ${credential.toolUrl}
            </a>
          </div>
        ` : ''}
        ${credential.toolDescription ? `
          <div style="margin-top: 8px; color: #6c757d; font-size: 0.875rem;">
            ${credential.toolDescription}
          </div>
        ` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Access Credentials</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔐 Access Credentials</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${projectName}</p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>
        
        <p style="color: #6c757d; margin-bottom: 25px;">
          Your access credentials for the CRM 360 tool have been prepared. Please find your login information below:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Tool</th>
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Credentials</th>
            </tr>
          </thead>
          <tbody>
            ${credentialsHtml}
          </tbody>
        </table>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">🛡️ Security Reminder</h3>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0c5460;">
            <li>Keep your credentials secure and do not share them with others</li>
            <li>Change your password after first login if the system allows it</li>
            <li>Contact support if you have any access issues</li>
          </ul>
        </div>

        <p style="color: #6c757d; margin-top: 25px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
        
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}