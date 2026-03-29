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

import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { newParticipants, participants } = req.body;

    const data = newParticipants.map(p => ({ participant: p }));

    const result = {
      participants: [...data, ...participants]
    };

    return res.status(200).json({ ...result });
  }
});
