import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Course ID is required' 
      });
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        modules: true,
        events: true,
        curriculum_courses: true
      }
    });

    if (!existingCourse) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check if course is being used in any curriculums or events
    const hasAssociations = existingCourse.curriculum_courses.length > 0 || existingCourse.events.length > 0;
    
    if (hasAssociations) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course. It is currently being used in curriculums or scheduled events. Please remove these associations first.'
      });
    }

    // Delete the course (this will cascade delete modules and activities due to DB constraints)
    await prisma.courses.delete({
      where: { id: courseId }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      courseId: courseId
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete course',
      error: error.message 
    });
  }
}