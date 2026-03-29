import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({ scope: 'org', POST: async (req, res) => {
  const {
      projectId,
      courseAssessmentId,
      isActive,
      createdBy = 'system' // Should get from session/auth
    } = req.body;

    // Validation
    if (!projectId || !courseAssessmentId || isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, course assessment ID, and isActive status are required'
      });
    }

    // Check if project exists
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if assessment exists
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

    // Check if override already exists
    const existingOverride = await prisma.project_assessment_config.findUnique({
      where: {
        unique_project_assessment: {
          projectId: parseInt(projectId),
          courseAssessmentId: parseInt(courseAssessmentId)
        }
      }
    });

    let override;

    if (existingOverride) {
      // Update existing override
      override = await prisma.project_assessment_config.update({
        where: {
          unique_project_assessment: {
            projectId: parseInt(projectId),
            courseAssessmentId: parseInt(courseAssessmentId)
          }
        },
        data: {
          isActive,
          updatedBy: createdBy
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              cuid: true
            }
          },
          courseAssessment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });
    } else {
      // Create new override
      override = await prisma.project_assessment_config.create({
        data: {
          projectId: parseInt(projectId),
          courseAssessmentId: parseInt(courseAssessmentId),
          isActive,
          createdBy
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              cuid: true
            }
          },
          courseAssessment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Assessment ${isActive ? 'activated' : 'deactivated'} for project`,
      override,
      action: existingOverride ? 'updated' : 'created'
    });
}
});
