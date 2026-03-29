import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { projectParticipantId, note } = req.body;

    if (!projectParticipantId) {
      return res.status(400).json({ message: 'Project participant ID is required' });
    }

    // Ensure projectParticipantId is an integer
    const participantId = parseInt(projectParticipantId, 10);
    if (isNaN(participantId)) {
      return res.status(400).json({ message: 'Invalid project participant ID' });
    }

    // Validate note length
    if (note && note.length > 2000) {
      return res.status(400).json({ message: 'Note exceeds maximum length of 2000 characters' });
    }

    const updatedParticipant = await prisma.project_participants.update({
      where: { id: participantId },
      data: { note: note || null }
    });

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedParticipant
    });
  }
});
