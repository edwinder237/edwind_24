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

    // Check if group is assigned to this event
    const existingEventGroup = await prisma.event_groups.findFirst({
      where: {
        eventsId: parseInt(eventId),
        groupId: parseInt(groupId)
      }
    });

    if (!existingEventGroup) {
      return res.status(404).json({ error: 'Group is not assigned to this event' });
    }

    // Get all participants in this group to remove as attendees
    const groupParticipants = await prisma.group_participants.findMany({
      where: {
        groupId: parseInt(groupId)
      },
      include: {
        participant: true
      }
    });

    // Remove each group participant as an event attendee
    const removeAttendeePromises = groupParticipants.map(async (groupParticipant) => {
      return prisma.event_attendees.deleteMany({
        where: {
          eventsId: parseInt(eventId),
          enrolleeId: groupParticipant.participantId
        }
      });
    });

    await Promise.all(removeAttendeePromises);

    // Remove group from event
    await prisma.event_groups.delete({
      where: {
        id: existingEventGroup.id
      }
    });

    return res.status(200).json({
      message: 'Group removed from event successfully',
      removedEventGroupId: existingEventGroup.id
    });

  } catch (error) {
    console.error('Error removing group from event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}