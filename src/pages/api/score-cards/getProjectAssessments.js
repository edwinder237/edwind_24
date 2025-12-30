import prisma from '../../../lib/prisma';

/**
 * Get project-level assessment data aggregated across all participants
 *
 * @route GET /api/score-cards/getProjectAssessments
 * @query {number} projectId - The project ID
 * @returns {Object} Aggregated assessment data with participant scores
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const parsedProjectId = parseInt(projectId);

    // Fetch project with curriculum courses and their assessments
    const project = await prisma.projects.findUnique({
      where: { id: parsedProjectId },
      include: {
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                curriculum_courses: {
                  include: {
                    course: {
                      include: {
                        course_assessments: {
                          where: {
                            isActive: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project-level assessment overrides
    const projectOverrides = await prisma.project_assessment_config.findMany({
      where: {
        projectId: parsedProjectId
      }
    });

    // Create override map for quick lookup
    const overrideMap = {};
    projectOverrides.forEach(override => {
      overrideMap[override.courseAssessmentId] = override.isActive;
    });

    // Get all active participants for this project
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parsedProjectId,
        status: { not: 'removed' }
      },
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
    });

    const totalParticipants = projectParticipants.length;

    // Collect all assessments from project's curriculum courses
    const allAssessments = [];
    project.project_curriculums.forEach(projCurr => {
      projCurr.curriculum.curriculum_courses.forEach(currCourse => {
        currCourse.course.course_assessments.forEach(assessment => {
          // Check if there's a project-level override
          const hasOverride = overrideMap.hasOwnProperty(assessment.id);
          const isActiveForProject = hasOverride
            ? overrideMap[assessment.id]
            : assessment.isActive;

          allAssessments.push({
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            maxScore: assessment.maxScore,
            passingScore: assessment.passingScore,
            isActive: isActiveForProject,
            hasProjectOverride: hasOverride,
            courseId: currCourse.course.id,
            courseTitle: currCourse.course.title,
            courseCuid: currCourse.course.cuid
          });
        });
      });
    });

    // If no assessments found, return empty array
    if (allAssessments.length === 0) {
      return res.status(200).json({
        success: true,
        projectAssessments: [],
        totalParticipants
      });
    }

    // Get all current assessment scores for participants in this project
    const participantIds = projectParticipants.map(p => p.id);

    const assessmentScores = await prisma.participant_assessment_scores.findMany({
      where: {
        participantId: { in: participantIds },
        isCurrent: true
      },
      include: {
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
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      }
    });

    // Get all attempts (not just current) for attempt counting
    const allAttempts = await prisma.participant_assessment_scores.findMany({
      where: {
        participantId: { in: participantIds }
      },
      select: {
        participantId: true,
        courseAssessmentId: true,
        attemptNumber: true
      }
    });

    // Create attempt count map
    const attemptCountMap = {};
    allAttempts.forEach(attempt => {
      const key = `${attempt.participantId}-${attempt.courseAssessmentId}`;
      attemptCountMap[key] = Math.max(
        attemptCountMap[key] || 0,
        attempt.attemptNumber
      );
    });

    // Group scores by assessment ID
    const scoresByAssessment = {};
    assessmentScores.forEach(score => {
      if (!scoresByAssessment[score.courseAssessmentId]) {
        scoresByAssessment[score.courseAssessmentId] = [];
      }
      scoresByAssessment[score.courseAssessmentId].push(score);
    });

    // Build aggregated assessment data
    const projectAssessments = allAssessments.map(assessment => {
      const scores = scoresByAssessment[assessment.id] || [];
      const completed = scores.length;

      // Calculate average score
      let averageScore = 0;
      if (completed > 0) {
        const totalScore = scores.reduce((sum, score) => sum + score.scorePercentage, 0);
        averageScore = Math.round(totalScore / completed);
      }

      // Calculate passing rate
      let passingRate = 0;
      if (completed > 0) {
        const passedCount = scores.filter(score => score.passed).length;
        passingRate = Math.round((passedCount / completed) * 100);
      }

      // Determine assessment type from title
      let type = 'Assessment';
      if (assessment.title.toLowerCase().includes('quiz')) {
        type = 'Quiz';
      } else if (assessment.title.toLowerCase().includes('exam')) {
        type = 'Exam';
      } else if (assessment.title.toLowerCase().includes('practical')) {
        type = 'Practical';
      }

      // Build participant scores array for expandable rows
      const participantScores = projectParticipants.map(participant => {
        const score = scores.find(s => s.participantId === participant.id);
        const attemptKey = `${participant.id}-${assessment.id}`;
        const attempts = attemptCountMap[attemptKey] || 0;

        let status = 'Not Started';
        let scoreValue = null;
        let completionDate = null;

        if (score) {
          scoreValue = Math.round(score.scorePercentage);
          status = score.passed ? 'Passed' : 'Failed';
          completionDate = score.assessmentDate.toISOString().split('T')[0];
        } else if (attempts > 0) {
          status = 'In Progress';
        }

        return {
          participantId: participant.id,
          name: `${participant.participant.firstName} ${participant.participant.lastName}`,
          email: participant.participant.email,
          score: scoreValue,
          status,
          attempts,
          completionDate
        };
      });

      return {
        id: assessment.id,
        assessmentName: assessment.title,
        course: assessment.courseTitle,
        courseId: assessment.courseId,
        type,
        totalParticipants,
        completed,
        averageScore,
        passingRate,
        isActive: assessment.isActive,
        hasProjectOverride: assessment.hasProjectOverride,
        participantScores
      };
    });

    // Set cache headers for performance (10 second cache)
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');

    res.status(200).json({
      success: true,
      projectAssessments,
      totalParticipants,
      totalAssessments: allAssessments.length
    });

  } catch (error) {
    console.error('Error fetching project assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project assessments',
      error: error.message
    });
  }
}
