import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Support activity ID is required'
      });
    }

    // Check if support activity exists
    const existingActivity = await prisma.supportActivities.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingActivity) {
      return res.status(404).json({
        success: false,
        message: 'Support activity not found'
      });
    }

    // Soft delete by setting isActive to false
    const deletedActivity = await prisma.supportActivities.update({
      where: {
        id: parseInt(id)
      },
      data: {
        isActive: false
      }
    });

    res.status(200).json({
      success: true,
      message: 'Support activity deleted successfully',
      supportActivity: deletedActivity
    });
  }
});