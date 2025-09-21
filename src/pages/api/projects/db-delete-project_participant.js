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
    
    // Mark participant as removed instead of deleting
    const updatedProjectParticipant = await prisma.project_participants.update({
      where: {
        id: parseInt(participantId),
      },
      data: {
        status: 'removed'
      }
    });

    res.status(200).json({
      message: "Participant successfully marked as removed",
      participant: updatedProjectParticipant
    });
  } catch (error) {
    console.error('Error marking participant as removed:', error);
    res.status(500).json({ error: error.message });
  }
}
