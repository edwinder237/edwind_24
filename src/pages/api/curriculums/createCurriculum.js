/**
 * ============================================
 * POST /api/curriculums/createCurriculum
 * ============================================
 *
 * Creates a new curriculum for the current organization.
 * FIXED: Previously created curriculums without org scoping.
 *
 * Body:
 * - name (required): Curriculum name
 * - description: Curriculum description
 * - selectedCourses (required): Array of course IDs
 *
 * Response:
 * {
 *   success: true,
 *   curriculum: {...}
 * }
 */

import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';
import { hasResourceCapacity, RESOURCES } from '../../../lib/features/featureAccess';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { name, description, difficulty, estimatedDuration, selectedCourses } = req.body;

    if (!name || !selectedCourses || selectedCourses.length === 0) {
      throw new ValidationError('Name and at least one course are required');
    }

    // Check curriculum limit
    const subscription = await getOrgSubscription(orgContext.organizationId);
    if (subscription) {
      const usage = await getResourceUsage(orgContext.organizationId);
      const capacityCheck = hasResourceCapacity({
        subscription,
        resource: RESOURCES.CURRICULUMS,
        currentUsage: usage.curriculums || 0,
        requestedAmount: 1
      });

      if (!capacityCheck.hasCapacity) {
        return res.status(403).json({
          error: 'Curriculum limit exceeded',
          message: `You have reached your limit of ${capacityCheck.limit} curriculums`,
          current: capacityCheck.current,
          limit: capacityCheck.limit,
          available: capacityCheck.available,
          upgradeUrl: '/upgrade'
        });
      }
    }

    // Create curriculum with automatic org scoping
    const curriculum = await scopedCreate(orgContext, 'curriculums', {
      title: name,
      description: description || null,
    });

    const curriculumCourses = await Promise.all(
      selectedCourses.map(courseId =>
        prisma.curriculum_courses.create({
          data: {
            curriculumId: curriculum.id,
            courseId: parseInt(courseId)
          }
        })
      )
    );

    const fullCurriculum = await prisma.curriculums.findUnique({
      where: { id: curriculum.id },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
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
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Curriculum created successfully',
      curriculum: {
        ...fullCurriculum,
        difficulty,
        estimatedDuration: parseInt(estimatedDuration) || null,
        courses: fullCurriculum.curriculum_courses.map(cc => cc.course)
      }
    });

  } catch (error) {
    console.error('Error creating curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));