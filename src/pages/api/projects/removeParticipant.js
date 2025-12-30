/**
 * ============================================
 * POST /api/projects/removeParticipant
 * ============================================
 *
 * Legacy client-side optimistic update endpoint for removing participants.
 * NOTE: This is a mock endpoint that returns client-provided data without persistence.
 * The actual participant removal happens via participants/delete.js.
 * FIXED: Added org scope middleware for consistency.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { remainingParticipants } = req.body;

  const result = {
    remainingParticipants: remainingParticipants,
  };

  return res.status(200).json({ ...result });
}

export default withOrgScope(asyncHandler(handler));
