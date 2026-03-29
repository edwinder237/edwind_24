import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

// GET - Fetch available curriculums and current course assignments
async function handleGet(req, res) {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ message: 'Course ID is required' });
  }

  const [availableCurriculums, courseCurriculums] = await Promise.all([
    // Get all available curriculums with counts
    prisma.curriculums.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        _count: {
          select: {
            curriculum_courses: true
          }
        }
      },
      orderBy: { title: 'asc' }
    }),
    // Get current curriculum assignments for this course
    prisma.curriculum_courses.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        currculum: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    })
  ]);

  return res.status(200).json({
    availableCurriculums,
    courseCurriculums
  });
}

// POST - Update curriculum assignments for a course
async function handlePost(req, res) {
  const { courseId, curriculumIds } = req.body;

  if (!courseId || !Array.isArray(curriculumIds)) {
    return res.status(400).json({
      message: 'Course ID and curriculum IDs array are required'
    });
  }

  // Use a transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // First, remove all existing assignments for this course
    await tx.curriculum_courses.deleteMany({
      where: { courseId: parseInt(courseId) }
    });

    // Then, create new assignments
    if (curriculumIds.length > 0) {
      const assignments = curriculumIds.map(curriculumId => ({
        curriculumId: parseInt(curriculumId),
        courseId: parseInt(courseId)
      }));

      await tx.curriculum_courses.createMany({
        data: assignments
      });
    }
  });

  return res.status(200).json({
    message: 'Curriculum assignments updated successfully'
  });
}

export default createHandler({
  scope: 'org',
  GET: handleGet,
  POST: handlePost
});
