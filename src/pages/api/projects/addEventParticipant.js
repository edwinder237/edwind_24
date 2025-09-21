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

    const { eventId, participantId, attendance_status = 'scheduled' } = req.body;

    if (!eventId || !participantId) {
      return res.status(400).json({ error: 'Event ID and participant ID are required' });
    }

    // Check if participant is already added to this event
    const existingAttendee = await prisma.event_attendees.findFirst({
      where: {
        eventsId: parseInt(eventId),
        enrolleeId: parseInt(participantId)
      }
    });

    if (existingAttendee) {
      return res.status(400).json({ 
        error: 'Participant is already added to this event',
        details: `Participant ${participantId} is already in event ${eventId}`
      });
    }

    // Note: Participants can now be in multiple events due to the fixed schema

    // Add participant to event
    let newAttendee;
    try {
      newAttendee = await prisma.event_attendees.create({
        data: {
          eventsId: parseInt(eventId),
          enrolleeId: parseInt(participantId),
          attendance_status: attendance_status,
          createdBy: user.id,
          updatedby: user.id
        }
      });
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'P2002') {
        console.error('Unique constraint violation:', error);
        return res.status(400).json({ 
          error: 'Participant is already added to this event',
          details: `Participant ${participantId} is already enrolled in event ${eventId}. Cannot add the same participant to the same event twice.`,
          prismaError: error.code,
          constraintField: error.meta?.target
        });
      }
      throw error; // Re-throw other errors
    }

    return res.status(201).json({
      message: 'Participant added to event successfully',
      attendee: newAttendee
    });

  } catch (error) {
    console.error('Error adding participant to event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}