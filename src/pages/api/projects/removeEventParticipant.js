import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.cookies.workos_user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await workos.userManagement.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { eventId, participantId } = req.body;

    if (!eventId || !participantId) {
      return res.status(400).json({ error: 'Event ID and participant ID are required' });
    }

    const parsedEventId = parseInt(eventId);

    // participantId could be either:
    // 1. An integer (project_participants.id / enrolleeId) - used directly
    // 2. A UUID string (participants.id) - need to look up project_participants.id first
    let enrolleeId;

    // Check if participantId is a UUID (contains hyphens) or an integer
    const isUUID = typeof participantId === 'string' && participantId.includes('-');
    const parsedParticipantId = parseInt(participantId);

    if (!isUUID && typeof participantId === 'number') {
      // It's already a number, use directly as enrolleeId
      enrolleeId = participantId;
    } else if (!isUUID && !isNaN(parsedParticipantId) && parsedParticipantId.toString() === participantId.toString()) {
      // It's a valid integer string (like "229"), use as enrolleeId
      enrolleeId = parsedParticipantId;
    } else {
      // It's a UUID, need to find the project_participants record

      // Get event to find projectId
      const event = await prisma.events.findUnique({
        where: { id: parsedEventId },
        select: { projectId: true }
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Find the project_participants record
      const projectParticipant = await prisma.project_participants.findFirst({
        where: {
          participantId: participantId,
          projectId: event.projectId
        },
        select: { id: true }
      });

      if (!projectParticipant) {
        // Debug: Check what participants exist for this project
        const allProjectParticipants = await prisma.project_participants.findMany({
          where: { projectId: event.projectId },
          select: { id: true, participantId: true },
          take: 5
        });

        return res.status(404).json({ error: 'Participant not enrolled in this project' });
      }

      enrolleeId = projectParticipant.id;
    }

    // Find the existing attendee record
    const existingAttendee = await prisma.event_attendees.findFirst({
      where: {
        eventsId: parsedEventId,
        enrolleeId: enrolleeId
      }
    });

    if (!existingAttendee) {
      return res.status(404).json({ error: 'Participant not found in this event' });
    }

    // Remove participant from event
    await prisma.event_attendees.delete({
      where: {
        id: existingAttendee.id
      }
    });

    return res.status(200).json({
      message: 'Participant removed from event successfully'
    });

  } catch (error) {
    console.error('Error removing participant from event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}