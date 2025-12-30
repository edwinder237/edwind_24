/**
 * ============================================
 * GET /api/curriculums/fetchCurriculums
 * ============================================
 *
 * Returns all curriculums for the current organization.
 * Uses org scoping to filter by sub-organization.
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     title: string,
 *     curriculum_courses: [...],
 *     supportActivities: [...],
 *     project_curriculums: [...]
 *   }
 * ]
 */

import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    // Fetch curriculums filtered by organization's sub-organizations
    const curriculums = await scopedFindMany(orgContext, 'curriculums', {
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
                courseStatus: true,
                modules: {
                  include: {
                    activities: {
                      select: {
                        duration: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        supportActivities: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            activityType: true,
            duration: true
          }
        },
        project_curriculums: {
          select: {
            id: true,
            project: {
              select: {
                id: true,
                title: true,
                projectStatus: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCurriculums = curriculums.map(curriculum => ({
      ...curriculum,
      courses: curriculum.curriculum_courses.map(cc => ({
        ...cc.course,
        calculatedDuration: calculateCourseDurationFromModules(cc.course.modules)
      })),
      courseCount: curriculum.curriculum_courses.length,
      supportActivitiesCount: curriculum.supportActivities.length,
      projectCount: curriculum.project_curriculums.length,
      totalDuration: curriculum.curriculum_courses.reduce((sum, cc) => {
        return sum + calculateCourseDurationFromModules(cc.course.modules);
      }, 0),
      totalSupportDuration: curriculum.supportActivities.reduce((sum, activity) => {
        return sum + (activity.duration || 0);
      }, 0)
    }));

    res.status(200).json(formattedCurriculums);

  } catch (error) {
    console.error('Error fetching curriculums:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));