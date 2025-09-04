import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      eventId, 
      moduleId, 
      activities = [], // Array of activity IDs that were completed
      completed = true 
    } = req.body;

    // Validate required fields
    if (!eventId || !moduleId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'eventId and moduleId are required'
      });
    }

    console.log('Saving module progress for event:', { eventId, moduleId, activities });

    const completionTime = new Date();
    const results = [];

    // Save activity progress for each completed activity
    if (activities.length > 0) {
      for (const activityId of activities) {
        try {
          const activityProgress = await prisma.event_activity_progress.upsert({
            where: {
              eventId_activityId: {
                eventId: parseInt(eventId),
                activityId: parseInt(activityId)
              }
            },
            update: {
              completed: true,
              completedAt: completionTime,
              updatedAt: completionTime
            },
            create: {
              eventId: parseInt(eventId),
              activityId: parseInt(activityId),
              completed: true,
              completedAt: completionTime
            }
          });
          results.push({ type: 'activity', data: activityProgress });
        } catch (error) {
          console.error(`Error saving activity progress for activity ${activityId}:`, error);
        }
      }
    }

    // Save module progress
    const moduleProgress = await prisma.event_module_progress.upsert({
      where: {
        eventId_moduleId: {
          eventId: parseInt(eventId),
          moduleId: parseInt(moduleId)
        }
      },
      update: {
        completed,
        completedAt: completed ? completionTime : null,
        updatedAt: completionTime
      },
      create: {
        eventId: parseInt(eventId),
        moduleId: parseInt(moduleId),
        completed,
        completedAt: completed ? completionTime : null
      },
      include: {
        module: {
          select: {
            title: true
          }
        }
      }
    });

    results.push({ type: 'module', data: moduleProgress });

    res.status(200).json({
      success: true,
      message: `Module progress saved successfully for event ${eventId}`,
      results
    });

  } catch (error) {
    console.error('Error saving module progress:', error);
    
    // Handle Prisma constraint errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate progress entry',
        details: 'Progress for this module/activity combination already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save module progress',
      details: error.message
    });
  }
}