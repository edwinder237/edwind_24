/**
 * ============================================
 * POST /api/projects/addManyParticipants
 * ============================================
 *
 * Legacy client-side optimistic update endpoint for bulk participant addition.
 * NOTE: This is a mock endpoint that returns client-provided data without persistence.
 * The actual bulk participant creation happens via import-csv.js.
 * FIXED: Added org scope middleware for consistency.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { newParticipants, participants } = req.body;

  const data = newParticipants.map(p => ({ participant: p }));

  const result = {
    participants: [...data, ...participants]
  };

  return res.status(200).json({ ...result });
}

export default withOrgScope(asyncHandler(handler));
