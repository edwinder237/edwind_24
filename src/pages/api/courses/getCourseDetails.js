/**
 * ============================================
 * GET /api/courses/getCourseDetails
 * ============================================
 *
 * Returns course details for the specified course ID.
 * FIXED: Now uses org scoping to prevent cross-org data leaks.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;
    const { id } = req.query;

    if (!id) {
      throw new ValidationError('Course ID is required');
    }

    const courseId = parseInt(id);

    // Fetch course with org scoping - returns null if not found or not in org
    const course = await scopedFindUnique(orgContext, 'courses', {
      where: { id: courseId },
      include: {
        modules: true,
        events: true,
        curriculum_courses: {
          include: {
            currculum: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    res.status(200).json({
      success: true,
      course: course
    });
  }
});