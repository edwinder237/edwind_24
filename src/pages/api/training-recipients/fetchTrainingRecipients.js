/**
 * ============================================
 * GET /api/training-recipients/fetchTrainingRecipients
 * ============================================
 *
 * Returns active training recipients for the current organization.
 * Uses org scoping to filter by sub-organization.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  // Fetch active training recipients with organization scoping
  const trainingRecipients = await scopedFindMany(orgContext, 'training_recipients', {
    where: {
      status: 'active' // Only fetch active recipients
    },
    include: {
      _count: {
        select: {
          projects: true,
          participants: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.status(200).json(trainingRecipients);
}

export default withOrgScope(asyncHandler(handler));