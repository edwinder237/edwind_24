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
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

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
  const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.CURRICULUMS);
  if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);

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