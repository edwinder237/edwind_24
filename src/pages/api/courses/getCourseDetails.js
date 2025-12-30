/**
 * ============================================
 * GET /api/courses/getCourseDetails
 * ============================================
 *
 * Returns course details for the specified course ID.
 * FIXED: Now uses org scoping to prevent cross-org data leaks.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

export default withOrgScope(asyncHandler(handler));