import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { curriculumId } = req.body;

    if (!curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID is required'
      });
    }

    const supportActivities = await prisma.supportActivities.findMany({
      where: {
        curriculumId: parseInt(curriculumId),
        isActive: true
      },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { activityType: 'asc' },
        { title: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      supportActivities
    });
  }
});