/**
 * ============================================
 * POST /api/curriculums/fetchSingle
 * ============================================
 *
 * Returns detailed curriculum data with all relations.
 * FIXED: Previously leaked curriculum data across organizations.
 *
 * Body:
 * - curriculumId (required): Curriculum ID to fetch
 *
 * Response:
 * {
 *   success: true,
 *   curriculum: {...}
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { curriculumId } = req.body;
  const { orgContext } = req;

  if (!curriculumId) {
    throw new ValidationError('Curriculum ID is required');
  }

  try {
    // First verify curriculum exists and belongs to organization
    const curriculumOwnership = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculumOwnership) {
      throw new NotFoundError('Curriculum not found');
    }

    const curriculum = await prisma.curriculums.findUnique({
      where: {
        id: parseInt(curriculumId)
      },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
                courseCategory: true,
                CourseType: true,
                deliveryMethod: true,
                code: true,
                rating: true,
                backgroundImg: true,
                isActive: true,
                course_participant_roles: {
                  include: {
                    role: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                },
                modules: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    customDuration: true,
                    moduleOrder: true,
                    activities: {
                      select: {
                        id: true,
                        title: true,
                        duration: true,
                        activityType: true,
                        ActivityOrder: true
                      },
                      orderBy: {
                        ActivityOrder: 'asc'
                      }
                    },
                    module_objectives: {
                      select: {
                        id: true,
                        objective: true,
                        objectiveOrder: true
                      },
                      orderBy: {
                        objectiveOrder: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    moduleOrder: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            id: 'asc'
          }
        },
        supportActivities: {
          where: {
            isActive: true
          },
          orderBy: [
            { activityType: 'asc' },
            { title: 'asc' }
          ]
        },
        project_curriculums: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                projectStatus: true
              }
            }
          }
        }
      }
    });

    if (!curriculum) {
      return res.status(404).json({ 
        success: false,
        message: 'Curriculum not found' 
      });
    }

    // Calculate some statistics
    const courseCount = curriculum.curriculum_courses?.length || 0;
    const supportActivitiesCount = curriculum.supportActivities?.length || 0;
    const projectCount = curriculum.project_curriculums?.length || 0;

    // Calculate total estimated duration from support activities
    const totalSupportDuration = curriculum.supportActivities?.reduce((total, activity) => {
      return total + (activity.duration || 0);
    }, 0) || 0;

    res.status(200).json({
      success: true,
      curriculum: {
        ...curriculum,
        statistics: {
          courseCount,
          supportActivitiesCount,
          projectCount,
          totalSupportDuration
        }
      }
    });

  } catch (error) {
    console.error('Error fetching curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));