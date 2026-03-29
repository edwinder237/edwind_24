import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
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
  }
});
