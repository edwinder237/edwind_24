import { useCallback } from 'react';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import eventBus from 'store/events/EventBus';

/**
 * Custom hook for sending satisfaction survey emails to participants
 * Handles domain events, API calls, and user notifications
 */
export const useSendSatisfactionSurvey = () => {
  const dispatch = useDispatch();
  const projectId = useSelector(state => state.projectSettings?.projectId);
  const projectTitle = useSelector(state => state.projectSettings?.title);

  const handleSendSurvey = useCallback(async ({ participants: surveyParticipants, surveyUrl, surveyTitle }) => {
    try {
      // Publish domain event
      eventBus.publish('participants.survey.send.started', {
        projectId,
        participantsCount: surveyParticipants.length,
        surveyTitle,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/email/send-survey-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: surveyParticipants,
          surveyUrl,
          surveyTitle,
          projectName: projectTitle || 'Training Project',
          projectId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send survey emails');
      }

      const { summary } = result;
      let message = `Survey emails completed!\n\n`;
      message += `Emails sent: ${summary.emailsSent}\n`;
      message += `Failed: ${summary.emailsFailed}\n`;
      if (summary.emailsSkipped > 0) {
        message += `Skipped: ${summary.emailsSkipped}\n`;
      }
      message += `Total participants: ${summary.totalParticipants}`;

      if (summary.emailsFailed > 0) {
        const failures = result.results.filter(r => r.status === 'failed');
        message += `\n\nEmail Failures:\n`;
        failures.forEach(failure => {
          message += `- ${failure.participantName} (${failure.participantEmail}): ${failure.error}\n`;
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
      eventBus.publish('participants.survey.send.completed', {
        projectId,
        emailsSent: summary.emailsSent,
        emailsFailed: summary.emailsFailed,
        emailsSkipped: summary.emailsSkipped,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send survey emails:', error);

      dispatch(openSnackbar({
        open: true,
        message: `Failed to send survey emails: ${error.message}`,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      // Publish error event
      eventBus.publish('participants.survey.send.failed', {
        projectId,
        error: error.message,
        participantsCount: surveyParticipants.length,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }, [projectTitle, projectId, dispatch]);

  return { handleSendSurvey };
};
