import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Participant IDs array is required' });
    }

    // Convert string IDs to integers
    const ids = participantIds.map(id => parseInt(id));

    // Mark participants as removed instead of deleting (soft delete)
    // This avoids foreign key constraint violations with event_attendees
    const updatedProjectParticipants = await prisma.project_participants.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        status: 'removed'
      }
    });

    // Also remove these participants from all event attendees
    // This maintains data integrity - removed participants shouldn't appear in events
    const deletedAttendees = await prisma.event_attendees.deleteMany({
      where: {
        enrolleeId: {
          in: ids
        }
      }
    });

    console.log(`Removed ${updatedProjectParticipants.count} participants from project. Also removed ${deletedAttendees.count} event attendee records.`);

    res.status(200).json({
      message: `${updatedProjectParticipants.count} participants successfully marked as removed`,
      count: updatedProjectParticipants.count,
      eventAttendeesRemoved: deletedAttendees.count
    });
  } catch (error) {
    console.error('Error marking participants as removed:', error);
    res.status(500).json({ error: error.message });
  }
}
