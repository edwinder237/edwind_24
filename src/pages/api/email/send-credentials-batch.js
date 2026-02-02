import prisma from '../../../lib/prisma';
import { logUsage, PROVIDERS } from '../../../lib/usage/usageLogger';
import {
  sendCredentials,
  isValidEmail,
  delay
} from '../../../lib/email';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 600;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { participants, credentials, projectName, projectId } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({ message: 'Credentials array is required' });
    }

    // Fetch organization logo
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

    for (const participant of participants) {
      const participantName = `${participant.participant?.firstName || ''} ${participant.participant?.lastName || ''}`.trim();

      if (!participant.participant?.email) {
        emailResults.push({
          participantId: participant.id,
          participantName,
          error: 'No email address',
          status: 'skipped'
        });
        continue;
      }

      // Validate email
      if (!isValidEmail(participant.participant.email)) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName,
          error: 'Invalid email address',
          status: 'skipped'
        });
        continue;
      }

      const participantCredentials = participant.participant.toolAccesses?.filter(toolAccess =>
        credentials.some(selectedCred =>
          selectedCred.tool === toolAccess.tool &&
          selectedCred.toolType === toolAccess.toolType
        )
      ) || [];

      if (participantCredentials.length === 0) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName,
          error: 'No matching credentials',
          status: 'skipped'
        });
        continue;
      }

      try {
        // Use centralized sendCredentials function
        const result = await sendCredentials({
          participant: {
            id: participant.id,
            email: participant.participant.email,
            firstName: participant.participant.firstName,
            lastName: participant.participant.lastName
          },
          credentials: participantCredentials,
          projectName: projectName || 'Training Project',
          organizationLogoUrl
        });

        // Rate limiting delay
        await delay(RATE_LIMIT_DELAY);

        if (result.success) {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName,
            credentialsCount: participantCredentials.length,
            emailId: result.emailId,
            status: 'sent'
          });
        } else {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName,
            credentialsCount: participantCredentials.length,
            error: result.error?.message || 'Email service error',
            status: 'failed'
          });
        }
      } catch (emailError) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName,
          credentialsCount: participantCredentials.length,
          error: emailError.message,
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;
    const skippedCount = emailResults.filter(result => result.status === 'skipped').length;

    // Log email usage (fire-and-forget)
    if (projectId) {
      const userId = req.cookies?.workos_user_id;
      logUsage({
        provider: PROVIDERS.RESEND,
        action: 'send_credentials_batch',
        organizationId: null, // Could be fetched if needed
        userId,
        projectId: parseInt(projectId),
        inputSize: successCount,
        success: successCount > 0,
        errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
      });
    }

    res.status(200).json({
      message: `Email sending completed: ${successCount} sent, ${failureCount} failed, ${skippedCount} skipped`,
      results: emailResults,
      summary: {
        totalParticipants: participants.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        emailsSkipped: skippedCount,
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
