/**
 * ============================================
 * DELETE /api/training-recipients/delete
 * ============================================
 *
 * Deletes a training recipient with org scoping verification.
 * Verifies recipient belongs to user's organization before deleting.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {

  const { orgContext } = req;
  const { id } = req.body;

  if (!id) {
    throw new ValidationError('Training recipient ID is required');
  }

  const recipientId = parseInt(id);

  // Check if recipient exists and belongs to org
  const existingRecipient = await scopedFindUnique(orgContext, 'training_recipients', {
    where: { id: recipientId },
    include: {
      projects: true,
      participants: true
    }
  });

  if (!existingRecipient) {
    throw new NotFoundError('Training recipient not found');
  }

  // Check if recipient has associated projects
  if (existingRecipient.projects.length > 0) {
    return res.status(400).json({
      error: `Cannot delete training recipient. It has ${existingRecipient.projects.length} associated project(s). Please remove or reassign projects first.`
    });
  }

  // Soft delete participants associated with this training recipient
  const participantIds = existingRecipient.participants.map(p => p.id);
  const now = new Date();
  const deletedBy = orgContext.userId;

  if (participantIds.length > 0) {
    await prisma.participants.updateMany({
      where: { id: { in: participantIds }, deletedAt: null },
      data: { deletedAt: now, deletedBy },
    });
  }

  // Soft delete the training recipient
  await prisma.training_recipients.update({
    where: { id: recipientId },
    data: { deletedAt: now, deletedBy, status: 'deleted' },
  });

  return res.status(200).json({
    success: true,
    message: `Training recipient and ${participantIds.length} participant(s) archived successfully`,
    deletedParticipants: participantIds.length
  });
  }
});