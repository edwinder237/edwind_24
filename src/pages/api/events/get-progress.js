import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'eventId is required as query parameter'
      });
    }

    // Get module progress for this event
    const moduleProgress = await prisma.event_module_progress.findMany({
      where: {
        eventId: parseInt(eventId)
      },
      include: {
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Get activity progress for this event
    const activityProgress = await prisma.event_activity_progress.findMany({
      where: {
        eventId: parseInt(eventId)
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            moduleId: true
          }
        }
      }
    });

    // Group activity progress by module
    const activityProgressByModule = activityProgress.reduce((acc, progress) => {
      const moduleId = progress.activity.moduleId;
      if (!acc[moduleId]) {
        acc[moduleId] = [];
      }
      acc[moduleId].push(progress);
      return acc;
    }, {});

    // Combine data
    const progressData = {
      modules: moduleProgress.map(mp => ({
        ...mp,
        activities: activityProgressByModule[mp.moduleId] || []
      })),
      totalModules: moduleProgress.length,
      completedModules: moduleProgress.filter(mp => mp.completed).length,
      totalActivities: activityProgress.length,
      completedActivities: activityProgress.filter(ap => ap.completed).length
    };

    res.status(200).json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Error fetching event progress:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch event progress',
      details: error.message
    });
  }
}