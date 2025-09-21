import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Training plan ID is required' });
    }

    // Delete training plan (cascades to days and modules due to onDelete: Cascade)
    await prisma.training_plans.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Training plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training plan:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Training plan not found' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to delete training plan',
      error: error.message 
    });
  }
}