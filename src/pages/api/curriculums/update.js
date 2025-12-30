/**
 * ============================================
 * PUT /api/curriculums/update
 * ============================================
 *
 * Updates a curriculum with org scoping verification.
 * Verifies curriculum belongs to user's organization before updating.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { id, title, description } = req.body;

  if (!id || !title || !title.trim()) {
    throw new ValidationError('ID and title are required');
  }

  const curriculumId = parseInt(id);

  // Update with org scoping - scopedUpdate verifies ownership first
  const updatedCurriculum = await scopedUpdate(orgContext, 'curriculums',
    { id: curriculumId },
    {
      title: title.trim(),
      description: description?.trim() || null,
      updatedAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    message: 'Curriculum updated successfully',
    curriculum: updatedCurriculum
  });
}

export default withOrgScope(asyncHandler(handler));