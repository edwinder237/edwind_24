import prisma from "../../../lib/prisma";
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

    const { eventId, groupId } = req.body;

    if (!eventId || !groupId) {
      return res.status(400).json({ error: 'Event ID and group ID are required' });
    }

    // Check if group is already added to this event
    const existingEventGroup = await prisma.event_groups.findFirst({
      where: {
        eventsId: parseInt(eventId),
        groupId: parseInt(groupId)
      }
    });

    if (existingEventGroup) {
      return res.status(400).json({ error: 'Group is already added to this event' });
    }

    // Add group to event
    let newEventGroup;
    try {
      newEventGroup = await prisma.event_groups.create({
        data: {
          eventsId: parseInt(eventId),
          groupId: parseInt(groupId)
        }
      });
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Group is already added to this event',
          details: `Group ${groupId} is already assigned to event ${eventId}`
        });
      }
      throw error; // Re-throw other errors
    }

    // Get all participants in this group and add them as attendees
    const groupParticipants = await prisma.group_participants.findMany({
      where: {
        groupId: parseInt(groupId)
      },
      include: {
        participant: true
      }
    });

    // Add each group participant as an event attendee if not already added
    const attendeePromises = groupParticipants.map(async (groupParticipant) => {
      const existingAttendee = await prisma.event_attendees.findFirst({
        where: {
          eventsId: parseInt(eventId),
          enrolleeId: groupParticipant.participantId
        }
      });

      if (!existingAttendee) {
        return prisma.event_attendees.create({
          data: {
            eventsId: parseInt(eventId),
            enrolleeId: groupParticipant.participantId,
            attendance_status: 'scheduled',
            createdBy: user.id,
            updatedby: user.id
          }
        });
      }
      
      return existingAttendee;
    });

    const attendees = await Promise.all(attendeePromises);

    return res.status(201).json({
      message: 'Group added to event successfully',
      eventGroup: newEventGroup,
      attendees: attendees
    });

  } catch (error) {
    console.error('Error adding group to event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}