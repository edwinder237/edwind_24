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
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

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
    const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.CURRICULUMS);
    if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);

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