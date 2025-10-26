import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    const enrolleeId = parseInt(participantId);

    // Mark participant as removed instead of deleting
    const updatedProjectParticipant = await prisma.project_participants.update({
      where: {
        id: enrolleeId,
      },
      data: {
        status: 'removed'
      }
    });

    // Also remove this participant from all event attendees
    // This maintains data integrity - removed participants shouldn't appear in events
    const deletedAttendees = await prisma.event_attendees.deleteMany({
      where: {
        enrolleeId: enrolleeId
      }
    });

    console.log(`Removed participant ${enrolleeId} from project. Also removed ${deletedAttendees.count} event attendee records.`);

    res.status(200).json({
      message: "Participant successfully marked as removed",
      participant: updatedProjectParticipant,
      eventAttendeesRemoved: deletedAttendees.count
    });
  } catch (error) {
    console.error('Error marking participant as removed:', error);
    res.status(500).json({ error: error.message });
  }
}
