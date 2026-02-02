/**
 * ============================================
 * POST /api/curriculums/create
 * ============================================
 *
 * Creates a new curriculum for the current organization.
 * Uses org scoping to ensure proper sub-organization assignment.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';
import { hasResourceCapacity, RESOURCES } from '../../../lib/features/featureAccess';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Title is required');
  }

  // Check curriculum limit
  const subscription = await getOrgSubscription(orgContext.organizationId);
  if (subscription) {
    const usage = await getResourceUsage(orgContext.organizationId);
    const capacityCheck = hasResourceCapacity({
      subscription,
      resource: RESOURCES.CURRICULUMS,
      currentUsage: usage.curriculums || 0,
      requestedAmount: 1
    });

    if (!capacityCheck.hasCapacity) {
      return res.status(403).json({
        error: 'Curriculum limit exceeded',
        message: `You have reached your limit of ${capacityCheck.limit} curriculums`,
        current: capacityCheck.current,
        limit: capacityCheck.limit,
        available: capacityCheck.available,
        upgradeUrl: '/upgrade'
      });
    }
  }

  // Create curriculum with automatic org scoping
  const curriculum = await scopedCreate(orgContext, 'curriculums', {
    title: title.trim(),
    description: description?.trim() || null,
  });

  res.status(201).json({
    success: true,
    message: 'Curriculum created successfully',
    curriculum
  });
}

export default withOrgScope(asyncHandler(handler));