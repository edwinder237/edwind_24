import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey',
      error: error.message
    });
  }
}
