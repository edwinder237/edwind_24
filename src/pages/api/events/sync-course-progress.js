import prisma from '../../../lib/prisma';

/**
 * API endpoint to force-sync course progress for an event
 * This will check all completed modules and update courses_enrollee_progress
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'eventId is required'
      });
    }

    console.log('Force syncing course progress for event:', eventId);

    // Get the event with its course
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        course: {
          include: {
            modules: { select: { id: true } }
          }
        },
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
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.course) {
      return res.status(400).json({ error: 'Event has no linked course' });
    }

    const courseId = event.course.id;
    const totalModules = event.course.modules?.length || 0;

    if (totalModules === 0) {
      return res.status(400).json({ error: 'Course has no modules' });
    }

    // Get completed modules for this event
    const completedModules = await prisma.event_module_progress.findMany({
      where: {
        eventId: parseInt(eventId),
        moduleId: { in: event.course.modules.map(m => m.id) },
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
      if (attendee.enrolleeId) {
        enrolleeIds.add(attendee.enrolleeId);
      }
    });

    // Group participants
    event.event_groups?.forEach(eventGroup => {
      eventGroup.groups?.participants?.forEach(groupParticipant => {
        if (groupParticipant.participant?.id) {
          enrolleeIds.add(groupParticipant.participant.id);
        }
      });
    });

    console.log('Enrollee IDs to update:', Array.from(enrolleeIds));

    const completionTime = new Date();
    const results = [];

    // Update courses_enrollee_progress for each enrollee
    for (const enrolleeId of enrolleeIds) {
      try {
        const existingProgress = await prisma.courses_enrollee_progress.findFirst({
          where: {
            enrolleeId: parseInt(enrolleeId),
            courseId: parseInt(courseId)
          }
        });

        if (existingProgress) {
          await prisma.courses_enrollee_progress.update({
            where: { id: existingProgress.id },
            data: {
              completed: isFullyCompleted,
              lastUpdated: completionTime
            }
          });
          results.push({ enrolleeId, action: 'updated', completed: isFullyCompleted });
        } else {
          await prisma.courses_enrollee_progress.create({
            data: {
              enrolleeId: parseInt(enrolleeId),
              courseId: parseInt(courseId),
              completed: isFullyCompleted,
              lastUpdated: completionTime
            }
          });
          results.push({ enrolleeId, action: 'created', completed: isFullyCompleted });
        }
      } catch (enrolleeError) {
        console.error(`Error updating progress for enrollee ${enrolleeId}:`, enrolleeError);
        results.push({ enrolleeId, action: 'error', error: enrolleeError.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Course progress synced for event ${eventId}`,
      data: {
        courseId,
        courseTitle: event.course.title,
        completedModules: completedCount,
        totalModules,
        isFullyCompleted,
        participantsUpdated: results.filter(r => r.action !== 'error').length,
        results
      }
    });

  } catch (error) {
    console.error('Error syncing course progress:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync course progress',
      details: error.message
    });
  }
}
