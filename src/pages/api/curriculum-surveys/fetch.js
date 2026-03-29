import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    const survey = await prisma.curriculum_surveys.findUnique({
      where: { id: parseInt(id) },
      include: {
        curriculum: {
          select: { id: true, title: true }
        },
        triggerCourse: {
          select: { id: true, title: true }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.status(200).json({
      success: true,
      survey
    });
  }
});
