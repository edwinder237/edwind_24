/**
 * GET /api/participants/get-status
 *
 * Fetches the current participantStatus for a participant.
 * Used to bypass stale cache when opening the participant drawer.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

export default withOrgScope(asyncHandler(handler));
