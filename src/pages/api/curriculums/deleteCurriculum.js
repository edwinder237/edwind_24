/**
 * ============================================
 * DELETE /api/curriculums/deleteCurriculum
 * ============================================
 *
 * Deletes a curriculum and all related records.
 * FIXED: Previously deleted any curriculum without org validation.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { orgContext } = req;

    const { id } = req.query;

    if (!id) {
      throw new ValidationError('Curriculum ID is required');
    }

    const curriculumId = parseInt(id);

    // Verify curriculum ownership
    const curriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: curriculumId },
      include: { project_curriculums: true }
    });

    if (!curriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Prevent deletion if curriculum is used in any projects
    if (curriculum.project_curriculums.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete curriculum. It is currently used in ${curriculum.project_curriculums.length} project(s). Please remove the curriculum from those projects first.`
      });
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
  }
});