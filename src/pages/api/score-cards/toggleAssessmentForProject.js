import prisma from '../../../lib/prisma';

/**
 * Toggle assessment active status for a specific project
 * This creates or updates a project_assessment_config override
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    const parsedProjectId = parseInt(projectId);
    const parsedAssessmentId = parseInt(courseAssessmentId);

    // Check if project exists
    const project = await prisma.projects.findUnique({
      where: { id: parsedProjectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if assessment exists
    const assessment = await prisma.course_assessments.findUnique({
      where: { id: parsedAssessmentId },
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
          projectId: parsedProjectId,
          courseAssessmentId: parsedAssessmentId
        }
      }
    });

    let result;

    if (existingOverride) {
      // Update existing override
      result = await prisma.project_assessment_config.update({
        where: { id: existingOverride.id },
        data: {
          isActive: isActive,
          updatedBy: createdBy,
          updatedAt: new Date()
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
          }
        }
      });
    } else {
      // Create new override
      result = await prisma.project_assessment_config.create({
        data: {
          projectId: parsedProjectId,
          courseAssessmentId: parsedAssessmentId,
          isActive: isActive,
          createdBy: createdBy
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
          }
        }
      });
    }

    const actionText = isActive ? 'enabled' : 'disabled';

    res.status(200).json({
      success: true,
      message: `Assessment "${assessment.title}" has been ${actionText} for this project`,
      config: result,
      isActive: result.isActive
    });

  } catch (error) {
    console.error('Error toggling assessment for project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle assessment status',
      error: error.message
    });
  }
}
