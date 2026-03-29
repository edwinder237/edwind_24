/**
 * ============================================
 * POST /api/curriculums/create
 * ============================================
 *
 * Creates a new curriculum for the current organization.
 * Uses org scoping to ensure proper sub-organization assignment.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError } from '../../../lib/errors/index.js';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
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
});