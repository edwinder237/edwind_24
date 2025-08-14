import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Activity ID is required' });
    }

    // Check if activity exists first
    const existingActivity = await prisma.activities.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Delete the activity from the database
    await prisma.activities.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
      deletedActivityId: parseInt(id)
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete activity',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}