/**
 * ============================================
 * DELETE /api/curriculums/deleteCurriculum
 * ============================================
 *
 * Deletes a curriculum and all related records.
 * FIXED: Previously deleted any curriculum without org validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { id } = req.query;

    if (!id) {
      throw new ValidationError('Curriculum ID is required');
    }

    const curriculumId = parseInt(id);

    // Verify curriculum ownership
    const curriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: curriculumId }
    });

    if (!curriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete curriculum-course relationships
      await tx.curriculum_courses.deleteMany({
        where: { curriculumId }
      });

      // Delete the curriculum
      await tx.curriculums.delete({
        where: { id: curriculumId }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));