import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { assessmentId, projectId, curriculumId } = req.query;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    // Get assessment base status
    const assessment = await prisma.course_assessments.findUnique({
      where: { id: parseInt(assessmentId) },
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

    let finalStatus = {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      courseId: assessment.courseId,
      courseTitle: assessment.course.title,
      baseActive: assessment.isActive,
      isActive: assessment.isActive, // Will be overridden
      overrideLevel: 'none', // 'none', 'curriculum', 'project'
      overrideDetails: null
    };

    // Check for project override (highest precedence)
    if (projectId) {
      const projectOverride = await prisma.project_assessment_config.findUnique({
        where: {
          unique_project_assessment: {
            projectId: parseInt(projectId),
            courseAssessmentId: parseInt(assessmentId)
          }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (projectOverride) {
        finalStatus.isActive = projectOverride.isActive;
        finalStatus.overrideLevel = 'project';
        finalStatus.overrideDetails = {
          projectId: projectOverride.projectId,
          projectTitle: projectOverride.project.title,
          isActive: projectOverride.isActive,
          configuredAt: projectOverride.createdAt,
          lastUpdated: projectOverride.updatedAt
        };

        return res.status(200).json({
          success: true,
          status: finalStatus
        });
      }
    }

    // Check for curriculum override (if no project override)
    if (curriculumId) {
      const curriculumOverride = await prisma.curriculum_assessment_config.findUnique({
        where: {
          unique_curriculum_assessment: {
            curriculumId: parseInt(curriculumId),
            courseAssessmentId: parseInt(assessmentId)
          }
        },
        include: {
          curriculum: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (curriculumOverride) {
        finalStatus.isActive = curriculumOverride.isActive;
        finalStatus.overrideLevel = 'curriculum';
        finalStatus.overrideDetails = {
          curriculumId: curriculumOverride.curriculumId,
          curriculumTitle: curriculumOverride.curriculum.title,
          isActive: curriculumOverride.isActive,
          configuredAt: curriculumOverride.createdAt,
          lastUpdated: curriculumOverride.updatedAt
        };
      }
    }

    res.status(200).json({
      success: true,
      status: finalStatus
    });

  } catch (error) {
    console.error('Error getting assessment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment status',
      error: error.message
    });
  }
}
