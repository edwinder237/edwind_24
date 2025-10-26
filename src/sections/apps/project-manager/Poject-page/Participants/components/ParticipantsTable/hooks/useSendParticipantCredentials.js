import { useCallback } from 'react';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import eventBus from 'store/events/EventBus';

/**
 * Custom hook for sending participant credential emails
 * Handles domain events, API calls, and user notifications
 * Specific to participant access credentials (not general email sending)
 */
export const useSendParticipantCredentials = () => {
  const dispatch = useDispatch();
  const projectId = useSelector(state => state.projectSettings?.projectId);
  const projectTitle = useSelector(state => state.projectSettings?.title);

  const handleSendEmail = useCallback(async ({ participants: emailParticipants, credentials }) => {
    try {
      // Publish domain event
      eventBus.publish('participants.email.send.started', {
        projectId,
        participantsCount: emailParticipants.length,
        credentialTypes: Object.keys(credentials),
        timestamp: new Date().toISOString()
      });

      console.log('Sending email to participants:', emailParticipants.length);
      console.log('Selected credentials:', credentials);

      const response = await fetch('/api/email/send-credentials-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: emailParticipants,
          credentials: credentials,
          projectName: projectTitle || 'Training Project'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails');
      }

      const { summary } = result;
      let message = `✅ Email sending completed!\n\n`;
      message += `📧 Emails sent: ${summary.emailsSent}\n`;
      message += `❌ Failed: ${summary.emailsFailed}\n`;
      if (summary.emailsSkipped > 0) {
        message += `⏭️ Skipped: ${summary.emailsSkipped}\n`;
      }
      message += `👥 Total participants: ${summary.totalParticipants}\n`;
      message += `🔑 Credential types: ${summary.credentialTypes}`;

      if (summary.emailsFailed > 0) {
        const failures = result.results.filter(r => r.status === 'failed');
        message += `\n\n⚠️ Email Failures:\n`;
        failures.forEach(failure => {
          message += `• ${failure.participantName} (${failure.participantEmail}): ${failure.error}\n`;
        });
      }

      dispatch(openSnackbar({
        open: true,
        message: message,
        variant: 'alert',
        alert: { color: summary.emailsFailed > 0 ? 'warning' : 'success' },
        close: false
      }));

      // Publish success event
      eventBus.publish('participants.email.send.completed', {
        projectId,
        emailsSent: summary.emailsSent,
        emailsFailed: summary.emailsFailed,
        emailsSkipped: summary.emailsSkipped,
        timestamp: new Date().toISOString()
      });

      console.log('Email sending result:', result);

    } catch (error) {
      console.error('Failed to send email:', error);

      dispatch(openSnackbar({
        open: true,
        message: `❌ Failed to send emails: ${error.message}`,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      // Publish error event
      eventBus.publish('participants.email.send.failed', {
        projectId,
        error: error.message,
        participantsCount: emailParticipants.length,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }, [projectTitle, projectId, dispatch]);

  return { handleSendEmail };
};
