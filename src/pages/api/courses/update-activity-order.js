import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { activities, moduleId } = req.body;

    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({ message: 'Activities array is required' });
    }

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    // Update each activity's order in the database
    const updatePromises = activities.map((activity, index) => {
      return prisma.activities.update({
        where: { id: activity.id },
        data: { ActivityOrder: index }
      });
    });

    await Promise.all(updatePromises);

    // Fetch the updated activities to return
    const updatedActivities = await prisma.activities.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: { ActivityOrder: 'asc' }
    });

    return res.status(200).json({
      message: 'Activity order updated successfully',
      activities: updatedActivities
    });

  } catch (error) {
    console.error('Error updating activity order:', error);
    return res.status(500).json({ 
      message: 'Failed to update activity order',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}