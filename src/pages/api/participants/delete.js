/**
 * ============================================
 * DELETE /api/participants/delete
 * ============================================
 *
 * Deletes a participant and all related records.
 * FIXED: Previously deleted any participant without org validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
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

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all related project_participants records first
      await tx.project_participants.deleteMany({
        where: { participantId: participantId }
      });

      // Delete any tool access records
      await tx.toolAccesses.deleteMany({
        where: { participantId: participantId }
      });

      // Delete the participant
      await tx.participants.delete({
        where: { id: participantId }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Participant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting participant:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));