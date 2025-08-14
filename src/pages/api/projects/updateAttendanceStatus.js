import { PrismaClient } from '@prisma/client';
import { WorkOS } from '@workos-inc/node';

const prisma = new PrismaClient();
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

    const { eventId, participantId, attendance_status } = req.body;

    if (!eventId || !participantId || !attendance_status) {
      return res.status(400).json({ error: 'Event ID, participant ID, and attendance status are required' });
    }

    // Validate attendance status
    const validStatuses = ['scheduled', 'present', 'absent', 'late'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }

    // Update attendance status
    const updatedAttendee = await prisma.event_attendees.updateMany({
      where: {
        eventsId: parseInt(eventId),
        enrolleeId: parseInt(participantId)
      },
      data: {
        attendance_status: attendance_status,
        updatedby: user.id
      }
    });

    if (updatedAttendee.count === 0) {
      return res.status(404).json({ error: 'Attendee not found for this event' });
    }

    return res.status(200).json({
      message: 'Attendance status updated successfully',
      count: updatedAttendee.count
    });

  } catch (error) {
    console.error('Error updating attendance status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}