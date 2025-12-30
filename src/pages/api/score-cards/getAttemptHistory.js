import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { assessmentId, participantId } = req.query;

    if (!assessmentId || !participantId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID and Participant ID are required'
      });
    }

    // Get assessment details
    const assessment = await prisma.course_assessments.findUnique({
      where: { id: parseInt(assessmentId) },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get all attempts for this participant
    const attempts = await prisma.participant_assessment_scores.findMany({
      where: {
        courseAssessmentId: parseInt(assessmentId),
        participantId: parseInt(participantId)
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { attemptNumber: 'asc' }
    });

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attempts found for this participant and assessment'
      });
    }

    // Calculate statistics
    const scorePercentages = attempts.map(a => a.scorePercentage);
    const passedAttempts = attempts.filter(a => a.passed === true);
    const failedAttempts = attempts.filter(a => a.passed === false);
    const overriddenAttempts = attempts.filter(a => a.isOverridden);

    const statistics = {
      totalAttempts: attempts.length,
      passedAttempts: passedAttempts.length,
      failedAttempts: failedAttempts.length,
      overriddenAttempts: overriddenAttempts.length,
      bestScore: Math.max(...scorePercentages),
      worstScore: Math.min(...scorePercentages),
      averageScore: (scorePercentages.reduce((sum, score) => sum + score, 0) / attempts.length).toFixed(2),
      improvement: attempts.length > 1
        ? (attempts[attempts.length - 1].scorePercentage - attempts[0].scorePercentage).toFixed(2)
        : 0,
      currentAttempt: attempts.find(a => a.isCurrent),
      canRetake: assessment.allowRetakes &&
        (!assessment.maxAttempts || attempts.length < assessment.maxAttempts),
      remainingAttempts: assessment.maxAttempts
        ? Math.max(0, assessment.maxAttempts - attempts.length)
        : 'unlimited'
    };

    // Get participant details
    const participant = await prisma.project_participants.findUnique({
      where: { id: parseInt(participantId) },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      assessment,
      participant,
      attempts,
      statistics
    });

  } catch (error) {
    console.error('Error fetching attempt history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attempt history',
      error: error.message
    });
  }
}
