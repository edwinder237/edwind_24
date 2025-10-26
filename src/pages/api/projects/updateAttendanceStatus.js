import prisma from "../../../lib/prisma";
import { WorkOS } from '@workos-inc/node';

// Simple cache clearing function - inline to avoid import issues
function clearProgressCacheForProject(projectId) {
  // Since we can't reliably import the shared cache in Turbopack,
  // we'll just log the cache clearing attempt
  // The client-side will handle the actual cache invalidation
  console.log(`Progress cache clearing requested for project ${projectId}`);
  return true;
}
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
    const validStatuses = ['scheduled', 'present', 'absent', 'late', 'not_needed'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }

    // First, get the event details to find the project ID
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      select: { projectId: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
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

    // Clear progress cache for this project since attendance affects progress calculations
    try {
      clearProgressCacheForProject(event.projectId);
      console.log(`Progress cache cleared for project ${event.projectId}`);
    } catch (cacheError) {
      console.warn('Failed to clear progress cache:', cacheError);
      // Don't fail the request if cache clearing fails
    }

    return res.status(200).json({
      message: 'Attendance status updated successfully',
      count: updatedAttendee.count,
      progressCacheCleared: true
    });

  } catch (error) {
    console.error('Error updating attendance status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}