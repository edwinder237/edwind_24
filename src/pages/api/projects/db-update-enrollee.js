import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError } from '../../../lib/errors/index.js';

export default createHandler({
  POST: async (req, res) => {
    const { participantId, enrollee } = req.body;

    if (!participantId) {
      throw new ValidationError('Participant ID is required');
    }

    if (!enrollee) {
      throw new ValidationError('Enrollee data is required');
    }

    // Verify the participant exists and belongs to the user's org
    // participants.sub_organization maps to a sub_organization ID
    const existing = await prisma.participants.findUnique({
      where: { id: participantId }
    });

    if (!existing || !req.orgContext.subOrganizationIds.includes(existing.sub_organization)) {
      throw new NotFoundError('Participant not found');
    }

    const updated = await prisma.participants.update({
      where: { id: participantId },
      data: enrollee,
    });

    res.status(200).json({
      message: 'Participant successfully updated',
      participant: updated,
    });
  }
});
