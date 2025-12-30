/**
 * ============================================
 * DELETE /api/curriculums/remove-course
 * ============================================
 *
 * Removes a course from a curriculum.
 * FIXED: Previously accepted any curriculumId/courseId without validation.
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
    const { curriculumId, courseId } = req.body;

    if (!curriculumId || !courseId) {
      throw new ValidationError('Curriculum ID and Course ID are required');
    }

    // Verify curriculum ownership
    const curriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Check if relationship exists
    const existingRelation = await prisma.curriculum_courses.findFirst({
      where: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      }
    });

    if (!existingRelation) {
      throw new NotFoundError('Course is not assigned to this curriculum');
    }

    // Remove the relationship
    await prisma.curriculum_courses.delete({
      where: {
        id: existingRelation.id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from curriculum successfully'
    });

  } catch (error) {
    console.error('Error removing course from curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));