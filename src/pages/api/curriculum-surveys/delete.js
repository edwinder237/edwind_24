import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    // Check if survey exists
    const existingSurvey = await prisma.curriculum_surveys.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSurvey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Soft delete - set isActive to false
    await prisma.curriculum_surveys.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.status(200).json({
      success: true,
      message: 'Survey deleted successfully'
    });
  }
});
