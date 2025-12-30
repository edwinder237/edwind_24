import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      curriculumId,
      courseAssessmentId,
      isActive,
      createdBy = 'system' // Should get from session/auth
    } = req.body;

    // Validation
    if (!curriculumId || !courseAssessmentId || isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID, course assessment ID, and isActive status are required'
      });
    }

    // Check if curriculum exists
    const curriculum = await prisma.curriculums.findUnique({
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
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
    const existingOverride = await prisma.curriculum_assessment_config.findUnique({
      where: {
        unique_curriculum_assessment: {
          curriculumId: parseInt(curriculumId),
          courseAssessmentId: parseInt(courseAssessmentId)
        }
      }
    });

    let override;

    if (existingOverride) {
      // Update existing override
      override = await prisma.curriculum_assessment_config.update({
        where: {
          unique_curriculum_assessment: {
            curriculumId: parseInt(curriculumId),
            courseAssessmentId: parseInt(courseAssessmentId)
          }
        },
        data: {
          isActive,
          updatedBy: createdBy
        },
        include: {
          curriculum: {
            select: {
              id: true,
              title: true
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
      override = await prisma.curriculum_assessment_config.create({
        data: {
          curriculumId: parseInt(curriculumId),
          courseAssessmentId: parseInt(courseAssessmentId),
          isActive,
          createdBy
        },
        include: {
          curriculum: {
            select: {
              id: true,
              title: true
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
      message: `Assessment ${isActive ? 'activated' : 'deactivated'} for curriculum`,
      override,
      action: existingOverride ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Error configuring curriculum override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure curriculum override',
      error: error.message
    });
  }
}
