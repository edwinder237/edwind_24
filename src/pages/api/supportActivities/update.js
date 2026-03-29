import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
    const {
      id,
      title,
      description,
      activityType,
      duration,
      isActive,
      updatedBy
    } = req.body;

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

    const updatedActivity = await prisma.supportActivities.update({
      where: {
        id: parseInt(id)
      },
      data: {
        title: title || existingActivity.title,
        description: description !== undefined ? description : existingActivity.description,
        activityType: activityType || existingActivity.activityType,
        duration: duration !== undefined ? (duration ? parseInt(duration) : null) : existingActivity.duration,
        isActive: isActive !== undefined ? isActive : existingActivity.isActive,
        updatedBy: updatedBy || existingActivity.updatedBy
      },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Support activity updated successfully',
      supportActivity: updatedActivity
    });
  }
});