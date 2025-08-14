import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    // First, fetch the original module with its activities
    const originalModule = await prisma.modules.findUnique({
      where: { id: parseInt(moduleId) },
      include: {
        activities: {
          orderBy: { ActivityOrder: 'asc' }
        }
      }
    });

    if (!originalModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Get the current maximum module order for this course
    const maxOrderModule = await prisma.modules.findFirst({
      where: { courseId: originalModule.courseId },
      orderBy: { moduleOrder: 'desc' }
    });

    const newModuleOrder = (maxOrderModule?.moduleOrder || 0) + 1;

    // Create the duplicate module
    const duplicatedModule = await prisma.modules.create({
      data: {
        title: `${originalModule.title} (Copy)`,
        summary: originalModule.summary,
        content: originalModule.content,
        JSONContent: originalModule.JSONContent,
        customDuration: originalModule.customDuration,
        published: originalModule.published,
        moduleStatus: originalModule.moduleStatus,
        backgroundImg: originalModule.backgroundImg,
        courseId: originalModule.courseId,
        moduleOrder: newModuleOrder,
        level: originalModule.level || 'Beginner',
        importance: originalModule.importance,
        rating: originalModule.rating
      }
    });

    // Duplicate activities if they exist
    if (originalModule.activities && originalModule.activities.length > 0) {
      const duplicatedActivities = await Promise.all(
        originalModule.activities.map((activity, index) =>
          prisma.activities.create({
            data: {
              title: activity.title,
              summary: activity.summary,
              content: activity.content,
              duration: activity.duration,
              activityType: activity.activityType,
              activityCategory: activity.activityCategory,
              moduleId: duplicatedModule.id,
              ActivityOrder: activity.ActivityOrder || index,
              published: activity.published || true
            }
          })
        )
      );

      // Return the duplicated module with its activities
      const moduleWithActivities = {
        ...duplicatedModule,
        activities: duplicatedActivities
      };

      res.status(200).json({
        success: true,
        message: 'Module duplicated successfully',
        module: moduleWithActivities
      });
    } else {
      // Return the duplicated module without activities
      res.status(200).json({
        success: true,
        message: 'Module duplicated successfully',
        module: {
          ...duplicatedModule,
          activities: []
        }
      });
    }

  } catch (error) {
    console.error('Error duplicating module:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to duplicate module',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}