import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { courseId, includeInactive } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Build where clause
    const whereClause = {
      courseId: parseInt(courseId)
    };

    // Only show active assessments unless explicitly requested
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    // Fetch assessments
    const assessments = await prisma.course_assessments.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        },
        participant_scores: {
          select: {
            id: true,
            participantId: true,
            attemptNumber: true,
            scorePercentage: true,
            passed: true,
            isCurrent: true
          }
        },
        _count: {
          select: {
            participant_scores: true,
            curriculum_overrides: true,
            project_overrides: true
          }
        }
      },
      orderBy: [
        { assessmentOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Calculate statistics for each assessment
    const assessmentsWithStats = assessments.map(assessment => {
      const currentScores = assessment.participant_scores.filter(s => s.isCurrent);
      const passedCount = currentScores.filter(s => s.passed).length;
      const failedCount = currentScores.filter(s => s.passed === false).length;
      const totalParticipants = currentScores.length;

      return {
        ...assessment,
        statistics: {
          totalParticipants,
          passedCount,
          failedCount,
          passRate: totalParticipants > 0 ? ((passedCount / totalParticipants) * 100).toFixed(1) : 0,
          totalAttempts: assessment.participant_scores.length,
          averageAttempts: totalParticipants > 0
            ? (assessment.participant_scores.length / totalParticipants).toFixed(1)
            : 0
        }
      };
    });

    res.status(200).json({
      success: true,
      assessments: assessmentsWithStats,
      count: assessments.length
    });

  } catch (error) {
    console.error('Error fetching course assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course assessments',
      error: error.message
    });
  }
}
