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

    // Find the existing attendee record
    const existingAttendee = await prisma.event_attendees.findFirst({
      where: {
        eventsId: parseInt(eventId),
        enrolleeId: parseInt(participantId)
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