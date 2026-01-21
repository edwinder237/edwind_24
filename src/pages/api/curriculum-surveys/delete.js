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
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete survey',
      error: error.message
    });
  }
}
