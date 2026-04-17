/**
 * ============================================
 * DELETE /api/participants/delete
 * ============================================
 *
 * Deletes a participant and all related records.
 * FIXED: Previously deleted any participant without org validation.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
  const { orgContext } = req;
    const { participantId } = req.query;

    if (!participantId) {
      throw new ValidationError('Participant ID is required');
    }

    // Verify participant ownership
    const existingParticipant = await scopedFindUnique(orgContext, 'participants', {
      where: { id: participantId }
    });

    if (!existingParticipant) {
      throw new NotFoundError('Participant not found');
    }

    // Soft delete the participant (data retained for audit trail)
    await prisma.participants.update({
      where: { id: participantId },
      data: {
        deletedAt: new Date(),
        deletedBy: orgContext.userId,
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Participant deleted successfully'
    });
  }
});