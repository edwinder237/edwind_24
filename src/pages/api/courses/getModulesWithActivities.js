import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ 
        success: false,
        message: 'Course ID is required' 
      });
    }

    const parsedCourseId = parseInt(courseId);

    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid course ID' 
      });
    }

    // Fetch modules with activities for the given course
    const modules = await prisma.modules.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { moduleOrder: 'asc' },
      include: {
        activities: {
          orderBy: { ActivityOrder: 'asc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      modules: modules
    });

  } catch (error) {
    console.error('Error fetching modules with activities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch modules',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}