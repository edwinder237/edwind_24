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

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
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

export default withOrgScope(asyncHandler(handler));
