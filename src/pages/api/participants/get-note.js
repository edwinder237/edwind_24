import prisma from 'lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectParticipantId } = req.query;

    if (!projectParticipantId) {
      return res.status(400).json({ message: 'Project participant ID is required' });
    }

    const participantId = parseInt(projectParticipantId, 10);
    if (isNaN(participantId)) {
      return res.status(400).json({ message: 'Invalid project participant ID' });
    }

    const participant = await prisma.project_participants.findUnique({
      where: { id: participantId },
      select: { note: true }
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    return res.status(200).json({ note: participant.note });
  } catch (error) {
    console.error('Error fetching participant note:', error);
    return res.status(500).json({
      message: 'Failed to fetch note',
      error: error.message
    });
  }
}
