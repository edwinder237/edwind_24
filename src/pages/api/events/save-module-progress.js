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
            title: true,
            courseId: true
          }
        }
      }
    });

    results.push({ type: 'module', data: moduleProgress });

    // Sync course progress for participants in this event
    if (completed && moduleProgress.module?.courseId) {
      try {
        await syncCourseProgressForEvent(eventId, moduleProgress.module.courseId, completionTime);
        results.push({ type: 'courseProgressSync', success: true });
      } catch (syncError) {
        console.error('Error syncing course progress:', syncError);
        results.push({ type: 'courseProgressSync', success: false, error: syncError.message });
      }
    }

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

/**
 * Sync course progress for all participants in an event
 * When all modules of a course are completed for an event, update courses_enrollee_progress
 */
async function syncCourseProgressForEvent(eventId, courseId, completionTime) {
  console.log('syncCourseProgressForEvent called:', { eventId, courseId });

  // Get the event with its participants
  const event = await prisma.events.findUnique({
    where: { id: parseInt(eventId) },
    include: {
      event_attendees: {
        include: {
          enrollee: true
        }
      },
      event_groups: {
        include: {
          groups: {
            include: {
              participants: {
                include: {
                  participant: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!event) {
    console.log('Event not found:', eventId);
    return;
  }

  console.log('Event found:', {
    eventId: event.id,
    attendeesCount: event.event_attendees?.length || 0,
    groupsCount: event.event_groups?.length || 0
  });

  // Get all modules for this course
  const courseModules = await prisma.modules.findMany({
    where: { courseId: parseInt(courseId) },
    select: { id: true }
  });

  const totalModules = courseModules.length;
  console.log('Course modules:', { courseId, totalModules, moduleIds: courseModules.map(m => m.id) });

  if (totalModules === 0) return;

  // Get completed modules for this event
  const completedModules = await prisma.event_module_progress.findMany({
    where: {
      eventId: parseInt(eventId),
      moduleId: { in: courseModules.map(m => m.id) },
      completed: true
    }
  });

  const completedCount = completedModules.length;
  const isFullyCompleted = completedCount >= totalModules;

  console.log('Module progress:', { completedCount, totalModules, isFullyCompleted });

  // Collect all enrollee IDs from direct attendees and groups
  const enrolleeIds = new Set();

  // Direct attendees
  event.event_attendees?.forEach(attendee => {
    console.log('Direct attendee:', { enrolleeId: attendee.enrolleeId, enrollee: attendee.enrollee });
    if (attendee.enrolleeId) {
      enrolleeIds.add(attendee.enrolleeId);
    }
  });

  // Group participants
  event.event_groups?.forEach(eventGroup => {
    console.log('Event group:', { groupId: eventGroup.groupId });
    eventGroup.groups?.participants?.forEach(groupParticipant => {
      console.log('Group participant:', { participantId: groupParticipant.participant?.id });
      if (groupParticipant.participant?.id) {
        enrolleeIds.add(groupParticipant.participant.id);
      }
    });
  });

  console.log('Enrollee IDs to update:', Array.from(enrolleeIds));

  // Update courses_enrollee_progress for each enrollee
  for (const enrolleeId of enrolleeIds) {
    try {
      // Check if progress record exists
      const existingProgress = await prisma.courses_enrollee_progress.findFirst({
        where: {
          enrolleeId: parseInt(enrolleeId),
          courseId: parseInt(courseId)
        }
      });

      if (existingProgress) {
        // Update existing record
        await prisma.courses_enrollee_progress.update({
          where: { id: existingProgress.id },
          data: {
            completed: isFullyCompleted,
            lastUpdated: completionTime
          }
        });
      } else {
        // Create new record
        await prisma.courses_enrollee_progress.create({
          data: {
            enrolleeId: parseInt(enrolleeId),
            courseId: parseInt(courseId),
            completed: isFullyCompleted,
            lastUpdated: completionTime
          }
        });
      }
    } catch (enrolleeError) {
      console.error(`Error updating progress for enrollee ${enrolleeId}:`, enrolleeError);
    }
  }

  console.log(`Course progress synced: ${completedCount}/${totalModules} modules completed for ${enrolleeIds.size} participants`);
}