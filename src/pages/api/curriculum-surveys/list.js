import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { curriculumId } = req.query;

    if (!curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID is required'
      });
    }

    const surveys = await prisma.curriculum_surveys.findMany({
      where: {
        curriculumId: parseInt(curriculumId),
        isActive: true
      },
      include: {
        triggerCourse: {
          select: { id: true, title: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      surveys
    });
  }
});
