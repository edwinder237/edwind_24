import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      courseAssessmentId,
      participantId,
      instructorId,
      scoreEarned,
      scoreMaximum,
      feedback,
      assessmentDate,
      createdBy = 'system' // Should get from session/auth
    } = req.body;

    // Validation
    if (!courseAssessmentId || !participantId || scoreEarned === undefined || scoreMaximum === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Course assessment ID, participant ID, score earned, and score maximum are required'
      });
    }

    if (scoreEarned < 0 || scoreMaximum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score values'
      });
    }

    if (scoreEarned > scoreMaximum) {
      return res.status(400).json({
        success: false,
        message: 'Score earned cannot exceed score maximum'
      });
    }

    // Get assessment details
    const assessment = await prisma.course_assessments.findUnique({
      where: { id: parseInt(courseAssessmentId) },
      include: {
        course: {
          select: {
            id: true,
            title: true
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

    // Check if participant exists
    const participant = await prisma.project_participants.findUnique({
      where: { id: parseInt(participantId) }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Get previous attempts
    const previousAttempts = await prisma.participant_assessment_scores.findMany({
      where: {
        courseAssessmentId: parseInt(courseAssessmentId),
        participantId: parseInt(participantId)
      },
      orderBy: { attemptNumber: 'desc' }
    });

    const attemptNumber = previousAttempts.length > 0 ? previousAttempts[0].attemptNumber + 1 : 1;

    // Check if retakes are allowed
    if (attemptNumber > 1) {
      if (!assessment.allowRetakes) {
        return res.status(400).json({
          success: false,
          message: 'Retakes are not allowed for this assessment'
        });
      }

      if (assessment.maxAttempts && attemptNumber > assessment.maxAttempts) {
        return res.status(400).json({
          success: false,
          message: `Maximum attempts (${assessment.maxAttempts}) exceeded`,
          currentAttempts: previousAttempts.length
        });
      }
    }

    // Calculate percentage
    const scorePercentage = (parseFloat(scoreEarned) / parseFloat(scoreMaximum)) * 100;

    // Determine if passed (auto-calculate)
    const passed = scorePercentage >= assessment.passingScore;

    // Create the score record
    const score = await prisma.participant_assessment_scores.create({
      data: {
        courseAssessmentId: parseInt(courseAssessmentId),
        participantId: parseInt(participantId),
        instructorId: instructorId ? parseInt(instructorId) : null,
        attemptNumber,
        scoreEarned: parseFloat(scoreEarned),
        scoreMaximum: parseFloat(scoreMaximum),
        scorePercentage: parseFloat(scorePercentage.toFixed(2)),
        passed,
        isOverridden: false,
        feedback: feedback || null,
        assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
        isCurrent: false, // Will be updated by recalculateCurrentScore
        createdBy
      }
    });

    // Recalculate which score should be current based on strategy
    await recalculateCurrentScore(
      parseInt(courseAssessmentId),
      parseInt(participantId),
      assessment.scoreStrategy
    );

    // Fetch the created score with relations
    const createdScore = await prisma.participant_assessment_scores.findUnique({
      where: { id: score.id },
      include: {
        courseAssessment: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        participant: {
          include: {
            participant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Get all attempts for context
    const allAttempts = await prisma.participant_assessment_scores.findMany({
      where: {
        courseAssessmentId: parseInt(courseAssessmentId),
        participantId: parseInt(participantId)
      },
      orderBy: { attemptNumber: 'asc' }
    });

    res.status(201).json({
      success: true,
      message: `Score recorded successfully (Attempt ${attemptNumber})`,
      score: createdScore,
      attemptNumber,
      totalAttempts: allAttempts.length,
      allAttempts
    });

  } catch (error) {
    console.error('Error recording score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record score',
      error: error.message
    });
  }
}

// Helper function to recalculate current score based on strategy
async function recalculateCurrentScore(courseAssessmentId, participantId, strategy) {
  const allAttempts = await prisma.participant_assessment_scores.findMany({
    where: {
      courseAssessmentId,
      participantId
    },
    orderBy: { attemptNumber: 'asc' }
  });

  if (allAttempts.length === 0) return;

  let currentScoreId;

  switch (strategy) {
    case 'latest':
      currentScoreId = allAttempts[allAttempts.length - 1].id;
      break;
    case 'highest':
      currentScoreId = allAttempts.reduce((max, curr) =>
        curr.scorePercentage > max.scorePercentage ? curr : max
      ).id;
      break;
    case 'first':
      currentScoreId = allAttempts[0].id;
      break;
    case 'average':
      // For average, mark the latest as current but percentage calculation happens in queries
      currentScoreId = allAttempts[allAttempts.length - 1].id;
      break;
    default:
      currentScoreId = allAttempts[allAttempts.length - 1].id;
  }

  // Update all to isCurrent: false
  await prisma.participant_assessment_scores.updateMany({
    where: {
      courseAssessmentId,
      participantId
    },
    data: { isCurrent: false }
  });

  // Mark the selected one as current
  await prisma.participant_assessment_scores.update({
    where: { id: currentScoreId },
    data: { isCurrent: true }
  });
}
