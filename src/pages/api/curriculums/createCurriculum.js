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
import { createHandler } from '../../../lib/api/createHandler';
import { scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError } from '../../../lib/errors/index.js';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { orgContext } = req;

    const { name, description, difficulty, estimatedDuration, selectedCourses, selectedTopicIds } = req.body;

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

    // Create topic relationships if provided
    if (selectedTopicIds && selectedTopicIds.length > 0) {
      await Promise.all(
        selectedTopicIds.map(topicId =>
          prisma.curriculum_topics.create({
            data: {
              curriculumId: curriculum.id,
              topicId: parseInt(topicId)
            }
          })
        )
      );
    }

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
        },
        curriculum_topics: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                color: true,
                icon: true
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
        courses: fullCurriculum.curriculum_courses.map(cc => cc.course),
        topics: fullCurriculum.curriculum_topics.map(ct => ct.topic),
        topicCount: fullCurriculum.curriculum_topics.length
      }
    });
  }
});