/**
 * ============================================
 * DELETE /api/curriculums/delete
 * ============================================
 *
 * Deletes a curriculum with org scoping verification.
 * Verifies curriculum belongs to user's organization before deleting.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { orgContext } = req;
    const { id } = req.body;

    if (!id) {
      throw new ValidationError('Curriculum ID is required');
    }

    const curriculumId = parseInt(id);

    // Check if curriculum exists and belongs to org
    const existingCurriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: curriculumId },
      include: {
        project_curriculums: true,
        supportActivities: true
      }
    });

    if (!existingCurriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.curriculum_courses.deleteMany({
      where: { curriculumId }
    });

    await prisma.supportActivities.deleteMany({
      where: { curriculumId }
    });

    await prisma.project_curriculums.deleteMany({
      where: { curriculumId }
    });

    // Delete the curriculum
    await prisma.curriculums.delete({
      where: { id: curriculumId }
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum deleted successfully'
    });
  }
});