import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    // Check if relationship exists
    const existingRelation = await prisma.curriculum_courses.findFirst({
      where: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      }
    });

    if (!existingRelation) {
      return res.status(404).json({
        success: false,
        message: 'Course is not assigned to this curriculum'
      });
    }

    // Remove the relationship
    await prisma.curriculum_courses.delete({
      where: {
        id: existingRelation.id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from curriculum successfully'
    });

  } catch (error) {
    console.error('Error removing course from curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from curriculum',
      error: error.message
    });
  }
}