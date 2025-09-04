import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, moduleId } = req.body;

    // Validate required fields
    if (!eventId || !moduleId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'eventId and moduleId are required'
      });
    }

    // Delete module progress for this event and module
    await prisma.event_module_progress.deleteMany({
      where: {
        eventId: parseInt(eventId),
        moduleId: parseInt(moduleId)
      }
    });

    // Delete all activity progress for activities in this module and event
    // First get all activities for this module
    const activities = await prisma.activities.findMany({
      where: {
        moduleId: parseInt(moduleId)
      },
      select: {
        id: true
      }
    });

    const activityIds = activities.map(activity => activity.id);

    if (activityIds.length > 0) {
      await prisma.event_activity_progress.deleteMany({
        where: {
          eventId: parseInt(eventId),
          activityId: {
            in: activityIds
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module progress reset successfully',
      data: {
        eventId: parseInt(eventId),
        moduleId: parseInt(moduleId),
        resetActivities: activityIds.length
      }
    });

  } catch (error) {
    console.error('Error resetting module progress:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset module progress',
      details: error.message
    });
  }
}