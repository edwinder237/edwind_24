/**
 * ============================================
 * PUT /api/curriculums/archive
 * ============================================
 *
 * Archives or restores a curriculum with org scoping verification.
 * Verifies curriculum belongs to user's organization before updating.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError } from '../../../lib/errors/index.js';
import { CURRICULUM_STATUS } from '../../../constants/index.js';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
    const { orgContext } = req;
    const { id, action } = req.body;

    if (!id) {
      throw new ValidationError('Curriculum ID is required');
    }

    if (!['archive', 'restore'].includes(action)) {
      throw new ValidationError('Action must be "archive" or "restore"');
    }

    const curriculumId = parseInt(id);
    const newStatus = action === 'archive' ? CURRICULUM_STATUS.ARCHIVED : CURRICULUM_STATUS.ACTIVE;

    const updatedCurriculum = await scopedUpdate(orgContext, 'curriculums',
      { id: curriculumId },
      {
        status: newStatus,
        updatedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: `Curriculum ${action === 'archive' ? 'archived' : 'restored'} successfully`,
      curriculum: updatedCurriculum
    });
  }
});
