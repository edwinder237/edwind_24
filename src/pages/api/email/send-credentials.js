import prisma from '../../../lib/prisma';
import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';
import {
  sendCredentials,
  fetchOrganizationLogo,
  isValidEmail
} from '../../../lib/email';
import { logEmailBatch } from '../../../lib/email/emailLogger';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { participants, credentials, projectName } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({ message: 'Credentials array is required' });
    }

    // Get user's organization for usage tracking and logo
    const userId = req.cookies?.workos_user_id;
    const organizationId = await getOrgIdFromUser(userId);

    // Check email limit
    if (organizationId) {
      const limitCheck = await enforceResourceLimit(organizationId, RESOURCES.EMAILS_PER_MONTH, participants.length);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
    }

    const organizationLogoUrl = await fetchOrganizationLogo(organizationId);

    const emailResults = [];

    // Send individual emails to each participant
    for (const participant of participants) {
      if (!participant.participant?.email || !isValidEmail(participant.participant.email)) {
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

      // Use centralized email service
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

      if (result.success) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
          credentialsCount: participantCredentials.length,
          emailId: result.emailId,
          status: 'sent'
        });
      } else {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName: `${participant.participant.firstName} ${participant.participant.lastName}`,
          credentialsCount: participantCredentials.length,
          error: result.error?.message || 'Email service error',
          status: 'failed'
        });
      }
    }

    const successCount = emailResults.filter(result => result.status === 'sent').length;
    const failureCount = emailResults.filter(result => result.status === 'failed').length;

    // Log email usage (fire-and-forget)
    logUsage({
      provider: PROVIDERS.RESEND,
      action: 'send_credentials',
      organizationId,
      userId,
      inputSize: successCount,
      success: successCount > 0,
      errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
    });

    // Log individual emails (fire-and-forget)
    const subOrgId = req.orgContext?.subOrganizationIds?.[0];
    if (subOrgId) {
      logEmailBatch(emailResults.map(r => ({
        sub_organizationId: subOrgId,
        recipientEmail: r.participantEmail,
        recipientName: r.participantName,
        recipientType: 'participant',
        subject: `Access Credentials - ${r.participantName}`,
        emailType: 'credentials',
        status: r.status === 'sent' ? 'sent' : 'failed',
        errorMessage: r.error || null,
        resendEmailId: r.emailId || null,
        projectTitle: projectName || null,
        participantId: r.participantId ? String(r.participantId) : null,
        sentByUserId: userId || null,
      })));
    }

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
  }
});