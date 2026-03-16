import prisma from '../../../lib/prisma';
import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';
import {
  sendSurvey,
  isValidEmail,
  delay
} from '../../../lib/email';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 600;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { participants, surveyUrl, surveyTitle, projectName, projectId, instructorName } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    if (!surveyUrl) {
      return res.status(400).json({ message: 'Survey URL is required' });
    }

    if (!surveyTitle) {
      return res.status(400).json({ message: 'Survey title is required' });
    }

    // Check email limit
    const userId = req.cookies?.workos_user_id;
    const organizationId = await getOrgIdFromUser(userId);
    if (organizationId) {
      const limitCheck = await enforceResourceLimit(organizationId, RESOURCES.EMAILS_PER_MONTH, participants.length);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
    }

    // Fetch organization logo and name
    let organizationLogoUrl = null;
    let organizationName = null;
    try {
      const organization = organizationId
        ? await prisma.organizations.findUnique({
            where: { id: organizationId },
            select: { logo_url: true, title: true }
          })
        : null;
      organizationLogoUrl = organization?.logo_url;
      organizationName = organization?.title || null;
    } catch (error) {
      console.error('Error fetching organization:', error);
    }

    // Get instructor email and name
    let instructorEmail = null;
    let resolvedInstructorName = instructorName || null;
    if (projectId) {
      try {
        const projectInstructor = await prisma.project_instructors.findFirst({
          where: {
            projectId: parseInt(projectId),
            instructorType: 'main'
          },
          include: {
            instructor: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });
        instructorEmail = projectInstructor?.instructor?.email || null;
        if (!resolvedInstructorName && projectInstructor?.instructor) {
          resolvedInstructorName = `${projectInstructor.instructor.firstName || ''} ${projectInstructor.instructor.lastName || ''}`.trim() || null;
        }
      } catch (error) {
        console.error('Error fetching instructor:', error);
      }
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

      try {
        const result = await sendSurvey({
          participant: {
            id: participant.id,
            email: participant.participant.email,
            firstName: participant.participant.firstName,
            lastName: participant.participant.lastName
          },
          surveyUrl,
          surveyTitle,
          projectName: projectName || 'Training Project',
          organizationLogoUrl,
          organizationName,
          instructorEmail,
          instructorName: resolvedInstructorName
        });

        // Rate limiting delay
        await delay(RATE_LIMIT_DELAY);

        if (result.success) {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName,
            emailId: result.emailId,
            status: 'sent'
          });
        } else {
          emailResults.push({
            participantId: participant.id,
            participantEmail: participant.participant.email,
            participantName,
            error: result.error?.message || 'Email service error',
            status: 'failed'
          });
        }
      } catch (emailError) {
        emailResults.push({
          participantId: participant.id,
          participantEmail: participant.participant.email,
          participantName,
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
      logUsage({
        provider: PROVIDERS.RESEND,
        action: 'send_survey_batch',
        organizationId: null,
        userId,
        projectId: parseInt(projectId),
        inputSize: successCount,
        success: successCount > 0,
        errorCode: failureCount > 0 ? 'PARTIAL_FAILURE' : null
      });
    }

    res.status(200).json({
      message: `Survey emails completed: ${successCount} sent, ${failureCount} failed, ${skippedCount} skipped`,
      results: emailResults,
      summary: {
        totalParticipants: participants.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        emailsSkipped: skippedCount
      }
    });

  } catch (error) {
    console.error('Survey email sending error:', error);
    res.status(500).json({
      message: 'Failed to send survey emails',
      error: error.message
    });
  }
}
