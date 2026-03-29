/**
 * ============================================
 * GET /api/courses/fetchCourses
 * ============================================
 *
 * Returns all active courses for the current organization.
 * FIXED: Previously leaked ALL courses across ALL organizations.
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     name: string,
 *     course_instructors: [...],
 *     modules: [...]
 *   }
 * ]
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;

    // Fetch courses filtered by organization's sub-organizations
    const courses = await scopedFindMany(orgContext, 'courses', {
      where: {
        isActive: true
      },
      include: {
        course_instructors: {
          include: {
            instructor: true
          }
        },
        modules: {
          orderBy: {
            moduleOrder: 'asc'
          },
          include: {
            activities: {
              orderBy: {
                ActivityOrder: 'asc'
              }
            }
          }
        }
      }
    });

    return res.status(200).json(courses);
  }
});
