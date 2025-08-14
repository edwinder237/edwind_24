import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    console.log(`Support activity "${updatedActivity.title}" updated successfully`);
  } catch (error) {
    console.error('Error updating support activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update support activity',
      error: error.message 
    });
  }
}