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

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Title is required');
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