/**
 * ============================================
 * POST /api/curriculums/duplicate
 * ============================================
 *
 * Duplicates a curriculum with org scoping verification.
 * Verifies curriculum belongs to user's organization and
 * assigns the copy to the same sub-organization.
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { id } = req.body;

  if (!id) {
    throw new ValidationError('Curriculum ID is required');
  }

  // Fetch the original curriculum with all related data (with org scoping)
  const originalCurriculum = await scopedFindUnique(orgContext, 'curriculums', {
    where: { id: parseInt(id) },
    include: {
      curriculum_courses: {
        include: {
          course: true
        }
      },
      supportActivities: true
    }
  });

  if (!originalCurriculum) {
    throw new NotFoundError('Curriculum not found');
  }

  // Create the duplicated curriculum with org scoping
  const duplicatedCurriculum = await scopedCreate(orgContext, 'curriculums', {
    title: `${originalCurriculum.title} (Copy)`,
    description: originalCurriculum.description,
    sub_organizationId: originalCurriculum.sub_organizationId, // Keep same sub-org
  });

  // Duplicate curriculum courses
  if (originalCurriculum.curriculum_courses.length > 0) {
    await prisma.curriculum_courses.createMany({
      data: originalCurriculum.curriculum_courses.map(cc => ({
        curriculumId: duplicatedCurriculum.id,
        courseId: cc.courseId
      }))
    });
  }

  // Duplicate support activities
  if (originalCurriculum.supportActivities.length > 0) {
    await prisma.supportActivities.createMany({
      data: originalCurriculum.supportActivities.map(sa => ({
        title: sa.title,
        description: sa.description,
        duration: sa.duration,
        materials: sa.materials,
        curriculumId: duplicatedCurriculum.id,
      }))
    });
  }

  // Fetch the complete duplicated curriculum for response
  const completeDuplicatedCurriculum = await prisma.curriculums.findUnique({
    where: { id: duplicatedCurriculum.id },
    include: {
      curriculum_courses: {
        include: {
          course: true
        }
      },
      supportActivities: true,
      _count: {
        select: {
          curriculum_courses: true,
          supportActivities: true,
          project_curriculums: true
        }
      }
    }
  });

  // Format the response similar to fetchCurriculums
  const formattedCurriculum = {
    ...completeDuplicatedCurriculum,
    courseCount: completeDuplicatedCurriculum._count.curriculum_courses,
    supportActivitiesCount: completeDuplicatedCurriculum._count.supportActivities,
    projectCount: completeDuplicatedCurriculum._count.project_curriculums
  };

  res.status(200).json({
    success: true,
    message: 'Curriculum duplicated successfully',
    curriculum: formattedCurriculum
  });
}

export default withOrgScope(asyncHandler(handler));
