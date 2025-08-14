import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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
      where: { id: courseId }
    });

    if (!existingCourse) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Update course to inactive
    const updatedCourse = await prisma.courses.update({
      where: { id: courseId },
      data: { 
        isActive: false,
        lastUpdated: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course deactivated successfully',
      courseId: courseId,
      course: updatedCourse
    });

  } catch (error) {
    console.error('Error deactivating course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate course',
      error: error.message 
    });
  }
}