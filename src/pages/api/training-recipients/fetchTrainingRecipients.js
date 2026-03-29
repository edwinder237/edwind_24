/**
 * ============================================
 * GET /api/training-recipients/fetchTrainingRecipients
 * ============================================
 *
 * Returns active training recipients for the current organization.
 * Uses org scoping to filter by sub-organization.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {

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

  return res.status(200).json(trainingRecipients);
  }
});