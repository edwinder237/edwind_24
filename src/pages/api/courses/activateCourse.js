import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
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

    // Update course to active
    const updatedCourse = await prisma.courses.update({
      where: { id: courseId },
      data: {
        isActive: true,
        lastUpdated: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course activated successfully',
      courseId: courseId,
      course: updatedCourse
    });
  }
});
