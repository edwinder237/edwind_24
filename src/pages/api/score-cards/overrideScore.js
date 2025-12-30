import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      scoreId,
      passed,
      overrideReason,
      updatedBy = 'system' // Should get from session/auth
    } = req.body;

    // Validation
    if (!scoreId || passed === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Score ID and passed status are required'
      });
    }

    if (!overrideReason || overrideReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Override reason is required when manually changing pass/fail status'
      });
    }

    // Check if score exists
    const existingScore = await prisma.participant_assessment_scores.findUnique({
      where: { id: parseInt(scoreId) },
      include: {
        courseAssessment: true
      }
    });

    if (!existingScore) {
      return res.status(404).json({
        success: false,
        message: 'Score record not found'
      });
    }

    // Calculate what the auto-calculated passed status would be
    const autoCalculatedPassed = existingScore.scorePercentage >= existingScore.courseAssessment.passingScore;

    // Check if this is actually an override
    if (autoCalculatedPassed === passed) {
      return res.status(400).json({
        success: false,
        message: `No override needed. Score ${existingScore.scorePercentage}% ${autoCalculatedPassed ? 'passes' : 'fails'} the ${existingScore.courseAssessment.passingScore}% threshold.`,
        autoCalculatedPassed
      });
    }

    // Update the score with override
    const updatedScore = await prisma.participant_assessment_scores.update({
      where: { id: parseInt(scoreId) },
      data: {
        passed,
        isOverridden: true,
        overrideReason: overrideReason.trim(),
        updatedBy
      },
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

    res.status(200).json({
      success: true,
      message: `Pass/fail status manually overridden to ${passed ? 'PASSED' : 'FAILED'}`,
      score: updatedScore,
      override: {
        previousStatus: autoCalculatedPassed ? 'PASSED' : 'FAILED',
        newStatus: passed ? 'PASSED' : 'FAILED',
        reason: overrideReason.trim()
      }
    });

  } catch (error) {
    console.error('Error overriding score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override score',
      error: error.message
    });
  }
}
