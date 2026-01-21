import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId } = req.query;

    if (!curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID is required'
      });
    }

    const surveys = await prisma.curriculum_surveys.findMany({
      where: {
        curriculumId: parseInt(curriculumId),
        isActive: true
      },
      include: {
        triggerCourse: {
          select: { id: true, title: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      surveys
    });
  } catch (error) {
    console.error('Error fetching curriculum surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surveys',
      error: error.message
    });
  }
}
