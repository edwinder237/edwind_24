/**
 * ============================================
 * POST /api/curriculums/add-course
 * ============================================
 *
 * Adds a course to a curriculum.
 * FIXED: Previously accepted any curriculumId/courseId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { curriculumId, courseId } = req.body;

    if (!curriculumId || !courseId) {
      throw new ValidationError('Curriculum ID and Course ID are required');
    }

    // Verify curriculum ownership
    const curriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Verify course belongs to same organization
    const course = await scopedFindUnique(orgContext, 'courses', {
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check if relationship already exists
    const existingRelation = await prisma.curriculum_courses.findFirst({
      where: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      }
    });

    if (existingRelation) {
      throw new ValidationError('Course is already assigned to this curriculum');
    }

    // Create the relationship
    const curriculumCourse = await prisma.curriculum_courses.create({
      data: {
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            summary: true,
            level: true,
            courseCategory: true,
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
    });

    res.status(201).json({
      success: true,
      message: 'Course added to curriculum successfully',
      curriculumCourse
    });

  } catch (error) {
    console.error('Error adding course to curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));