import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId } = req.body;

    if (!curriculumId) {
      return res.status(400).json({ 
        success: false,
        message: 'Curriculum ID is required' 
      });
    }

    const supportActivities = await prisma.supportActivities.findMany({
      where: {
        curriculumId: parseInt(curriculumId),
        isActive: true
      },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { activityType: 'asc' },
        { title: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      supportActivities
    });

  } catch (error) {
    console.error('Error fetching support activities:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch support activities',
      error: error.message 
    });
  }
}