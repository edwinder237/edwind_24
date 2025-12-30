/**
 * ============================================
 * DELETE /api/training-recipients/delete
 * ============================================
 *
 * Deletes a training recipient with org scoping verification.
 * Verifies recipient belongs to user's organization before deleting.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  // Delete all participants associated with this training recipient
  const participantIds = existingRecipient.participants.map(p => p.id);

  if (participantIds.length > 0) {
    // First, delete all project_participants records for these participants
    await prisma.project_participants.deleteMany({
      where: {
        participantId: {
          in: participantIds
        }
      }
    });

    // Then delete the participants themselves
    await prisma.participants.deleteMany({
      where: {
        id: {
          in: participantIds
        }
      }
    });
  }

  // Finally, delete the training recipient
  await prisma.training_recipients.delete({
    where: { id: recipientId }
  });

  res.status(200).json({
    success: true,
    message: `Training recipient and ${participantIds.length} participant(s) deleted successfully`,
    deletedParticipants: participantIds.length
  });
}

export default withOrgScope(asyncHandler(handler));