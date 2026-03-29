/**
 * GET /api/participants/get-status
 *
 * Fetches the current participantStatus for a participant.
 * Used to bypass stale cache when opening the participant drawer.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {

  const { participantId } = req.query;
  const { orgContext } = req;

  if (!participantId) {
    throw new ValidationError('Participant ID is required');
  }

  // Fetch participant with org scoping
  const participant = await scopedFindUnique(orgContext, 'participants', {
    where: { id: participantId },
    select: {
      id: true,
      participantStatus: true
    }
  });

  if (!participant) {
    throw new NotFoundError('Participant not found');
  }

  return res.status(200).json({
    participantStatus: participant.participantStatus
  });
  }
});
