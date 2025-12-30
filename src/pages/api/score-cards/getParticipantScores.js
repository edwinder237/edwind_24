import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { participantId, courseId, projectId, currentOnly } = req.query;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    const parsedParticipantId = parseInt(participantId);

    // Get the project participant to find their project and curriculum
    const projectParticipant = await prisma.project_participants.findUnique({
      where: { id: parsedParticipantId },
      include: {
        project: {
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
        }
      }
    });

    if (!projectParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Project participant not found'
      });
    }

    // Get project-level assessment overrides for this project
    const projectOverrides = await prisma.project_assessment_config.findMany({
      where: {
        projectId: projectParticipant.project.id
      }
    });

    // Create a map of assessment overrides for quick lookup
    const overrideMap = {};
    projectOverrides.forEach(override => {
      overrideMap[override.courseAssessmentId] = override.isActive;
    });

    // Collect all assessments from project's curriculum courses
    const allAssessments = [];
    projectParticipant.project.project_curriculums.forEach(projCurr => {
      projCurr.curriculum.curriculum_courses.forEach(currCourse => {
        currCourse.course.course_assessments.forEach(assessment => {
          // Check if there's a project-level override
          const hasOverride = overrideMap.hasOwnProperty(assessment.id);
          const isActiveForProject = hasOverride
            ? overrideMap[assessment.id]  // Use project override
            : assessment.isActive;        // Use course-level setting

          // Include ALL assessments (both enabled and disabled)
          // This allows users to see disabled assessments and re-enable them
          allAssessments.push({
            ...assessment,
            isActive: isActiveForProject,
            hasProjectOverride: hasOverride,
            course: {
              id: currCourse.course.id,
              title: currCourse.course.title,
              cuid: currCourse.course.cuid
            }
          });
        });
      });
    });

    // Build where clause for existing scores
    const scoreWhereClause = {
      participantId: parsedParticipantId
    };

    // Filter by course if provided
    if (courseId) {
      scoreWhereClause.courseAssessment = {
        courseId: parseInt(courseId)
      };
    }

    // Only show current scores if requested
    if (currentOnly === 'true') {
      scoreWhereClause.isCurrent = true;
    }

    // Fetch existing scores
    const scores = await prisma.participant_assessment_scores.findMany({
      where: scoreWhereClause,
      include: {
        courseAssessment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                cuid: true
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
            },
            project: {
              select: {
                id: true,
                title: true,
                cuid: true
              }
            }
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { assessmentDate: 'desc' }
      ]
    });

    // Initialize groupedByAssessment with ALL available assessments
    const groupedByAssessment = {};

    // First, add all available assessments (even those without scores)
    allAssessments.forEach(assessment => {
      groupedByAssessment[assessment.id] = {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          maxScore: assessment.maxScore,
          passingScore: assessment.passingScore,
          isActive: assessment.isActive,
          hasProjectOverride: assessment.hasProjectOverride || false,
          allowRetakes: assessment.allowRetakes,
          maxAttempts: assessment.maxAttempts,
          scoreStrategy: assessment.scoreStrategy,
          course: assessment.course
        },
        attempts: [],
        currentScore: null,
        statistics: {
          totalAttempts: 0,
          bestScore: 0,
          averageScore: 0,
          latestAttempt: null
        }
      };
    });

    // Then, add the scores to their respective assessments
    scores.forEach(score => {
      const assessmentId = score.courseAssessmentId;

      // Only process if this assessment is in our list
      if (groupedByAssessment[assessmentId]) {
        groupedByAssessment[assessmentId].attempts.push(score);

        if (score.isCurrent) {
          groupedByAssessment[assessmentId].currentScore = score;
        }
      }
    });

    // Calculate statistics for assessments that have attempts
    Object.keys(groupedByAssessment).forEach(assessmentId => {
      const group = groupedByAssessment[assessmentId];
      const attempts = group.attempts;

      if (attempts.length > 0) {
        group.statistics.totalAttempts = attempts.length;
        group.statistics.bestScore = Math.max(...attempts.map(a => a.scorePercentage));
        group.statistics.averageScore = parseFloat(
          (attempts.reduce((sum, a) => sum + a.scorePercentage, 0) / attempts.length).toFixed(2)
        );
        group.statistics.latestAttempt = attempts.reduce((latest, current) =>
          current.attemptNumber > latest.attemptNumber ? current : latest
        );
      }
    });

    res.status(200).json({
      success: true,
      scores,
      groupedByAssessment: Object.values(groupedByAssessment),
      totalScores: scores.length,
      totalAssessments: allAssessments.length
    });

  } catch (error) {
    console.error('Error fetching participant scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participant scores',
      error: error.message
    });
  }
}
