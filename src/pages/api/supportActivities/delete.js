import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    console.log(`Support activity "${deletedActivity.title}" deleted successfully`);
  } catch (error) {
    console.error('Error deleting support activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete support activity',
      error: error.message 
    });
  }
}