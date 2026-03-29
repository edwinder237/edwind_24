import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const parsedCourseId = parseInt(courseId);

    if (isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    // Fetch modules with activities for the given course
    const modules = await prisma.modules.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { moduleOrder: 'asc' },
      include: {
        activities: {
          orderBy: { ActivityOrder: 'asc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      modules: modules
    });
  }
});
