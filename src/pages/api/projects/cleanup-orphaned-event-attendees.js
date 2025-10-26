import prisma from "../../../lib/prisma";

/**
 * Cleanup orphaned event_attendees records
 *
 * This endpoint removes event_attendees records where the enrolleeId
 * references a project_participant that has been marked as 'removed'.
 *
 * This is a maintenance endpoint to fix data integrity issues.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Find all removed participants in this project
    const removedParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parseInt(projectId),
        status: 'removed'
      },
      select: { id: true }
    });

    const removedEnrolleeIds = removedParticipants.map(p => p.id);

    console.log(`Found ${removedEnrolleeIds.length} removed participants in project ${projectId}`);

    if (removedEnrolleeIds.length === 0) {
      return res.status(200).json({
        message: 'No orphaned event attendees found',
        removedCount: 0
      });
    }

    // Delete event_attendees for these removed participants
    const deletedAttendees = await prisma.event_attendees.deleteMany({
      where: {
        enrolleeId: {
          in: removedEnrolleeIds
        }
      }
    });

    console.log(`Cleaned up ${deletedAttendees.count} orphaned event_attendee records for project ${projectId}`);

    res.status(200).json({
      message: `Successfully cleaned up orphaned event attendees`,
      removedParticipantsCount: removedEnrolleeIds.length,
      eventAttendeesRemoved: deletedAttendees.count,
      removedEnrolleeIds: removedEnrolleeIds
    });
  } catch (error) {
    console.error('Error cleaning up orphaned event attendees:', error);
    res.status(500).json({ error: error.message });
  }
}
