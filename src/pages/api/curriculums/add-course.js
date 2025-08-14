import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId, courseId } = req.body;

    if (!curriculumId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID and Course ID are required'
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

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.curriculum_courses.findFirst({
      where: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      }
    });

    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: 'Course is already assigned to this curriculum'
      });
    }

    // Create the relationship
    const curriculumCourse = await prisma.curriculum_courses.create({
      data: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            summary: true,
            level: true,
            courseCategory: true,
            modules: {
              include: {
                activities: {
                  select: {
                    duration: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course added to curriculum successfully',
      curriculumCourse
    });

  } catch (error) {
    console.error('Error adding course to curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to curriculum',
      error: error.message
    });
  }
}