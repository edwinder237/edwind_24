import prisma from "../../../lib/prisma";

/**
 * API endpoint for moving a participant between events
 * Removes participant from source event and adds to target event
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { participantId, fromEventId, toEventId, projectId } = req.body;

  if (!participantId || !toEventId || !projectId) {
    return res.status(400).json({ 
      error: 'Participant ID, target event ID, and project ID are required' 
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const operations = [];

      // Step 1: Verify the participant belongs to the project
      const participant = await tx.project_participants.findFirst({
        where: {
          id: parseInt(participantId),
          projectId: parseInt(projectId)
        }
      });

      if (!participant) {
        throw new Error(`Participant ${participantId} not found in project ${projectId}`);
      }

      // Step 2: Verify the target event exists and belongs to the project
      const targetEvent = await tx.events.findFirst({
        where: {
          id: parseInt(toEventId),
          projectId: parseInt(projectId)
        }
      });

      if (!targetEvent) {
        throw new Error(`Target event ${toEventId} not found in project ${projectId}`);
      }

      // Step 3: Remove from source event (if specified)
      if (fromEventId) {
        const removeResult = await tx.event_attendees.deleteMany({
          where: {
            enrolleeId: parseInt(participantId),
            eventsId: parseInt(fromEventId)
          }
        });
        
        operations.push({
          type: 'remove',
          eventId: parseInt(fromEventId),
          count: removeResult.count
        });
      }

      // Step 4: Add to target event
      // First check if participant is already attending the target event
      const existingAttendance = await tx.event_attendees.findFirst({
        where: {
          enrolleeId: parseInt(participantId),
          eventsId: parseInt(toEventId)
        }
      });

      if (!existingAttendance) {
        const addResult = await tx.event_attendees.create({
          data: {
            enrolleeId: parseInt(participantId),
            eventsId: parseInt(toEventId),
            attendance_status: 'scheduled',
            attendanceType: 'individual',
            createdAt: new Date(),
            lastUpdated: new Date()
          }
        });
        
        operations.push({
          type: 'add',
          eventId: parseInt(toEventId),
          result: addResult
        });
      } else {
        operations.push({
          type: 'add',
          eventId: parseInt(toEventId),
          result: 'already_attending'
        });
      }

      // Step 5: Get event titles for response message
      const eventTitles = {};
      if (fromEventId) {
        const fromEvent = await tx.events.findUnique({
          where: { id: parseInt(fromEventId) },
          select: { title: true }
        });
        eventTitles.from = fromEvent?.title || `Event ${fromEventId}`;
      }
      
      eventTitles.to = targetEvent.title || `Event ${toEventId}`;
      
      // Fetch updated event data with participants
      const updatedEvents = [];
      
      if (fromEventId) {
        const fromEventUpdated = await tx.events.findUnique({
          where: { id: parseInt(fromEventId) },
          include: {
            event_attendees: {
              include: {
                enrollee: true
              }
            }
          }
        });
        updatedEvents.push({ type: 'from', event: fromEventUpdated });
      }
      
      const toEventUpdated = await tx.events.findUnique({
        where: { id: parseInt(toEventId) },
        include: {
          event_attendees: {
            include: {
              enrollee: true
            }
          }
        }
      });
      updatedEvents.push({ type: 'to', event: toEventUpdated });

      return {
        operations,
        participantId: parseInt(participantId),
        fromEventId: fromEventId ? parseInt(fromEventId) : null,
        toEventId: parseInt(toEventId),
        eventTitles,
        participant: {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email
        },
        updatedEvents
      };
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.fromEventId 
        ? `Participant moved from "${result.eventTitles.from}" to "${result.eventTitles.to}"`
        : `Participant added to "${result.eventTitles.to}"`
    });

  } catch (error) {
    console.error('Error moving participant between events:', error);
    res.status(500).json({ 
      error: 'Failed to move participant between events', 
      details: error.message 
    });
  }
}