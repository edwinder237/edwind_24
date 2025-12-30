/**
 * ============================================
 * POST /api/projects/fetchEnrolleCourseProgress
 * ============================================
 *
 * Fetches enrollees who have not completed a specific course.
 * FIXED: Previously accepted any courseId without validation.
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { orgContext } = req;
  const { courseId } = req.body;

  if (!courseId) {
    throw new ValidationError('Course ID is required');
  }

  try {
    // Verify course ownership
    const course = await scopedFindUnique(orgContext, 'courses', {
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Fetch enrolled but not completed progress
    const enrolledNotCompleted = await prisma.courses_enrollee_progress.findMany({
      where: {
        courseId: courseId,
        completed: false
      },
      select: {
        course: {
          select: {
            title: true
          }
        },
        enrollee: {
          select: {
            participant: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                notes: true,
                roleId: true,
                credentials: true
              }
            }
          }
        }
      }
    });

    const enrollees = enrolledNotCompleted.map(i => i.enrollee).map(i => i.participant);

    res.status(200).json(enrollees);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
