import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// GET - Fetch available curriculums and current course assignments
async function handleGet(req, res) {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ message: 'Course ID is required' });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching curriculum assignments:', error);
    return res.status(500).json({ 
      message: 'Error fetching curriculum assignments',
      error: error.message 
    });
  }
}

// POST - Update curriculum assignments for a course
async function handlePost(req, res) {
  const { courseId, curriculumIds } = req.body;

  if (!courseId || !Array.isArray(curriculumIds)) {
    return res.status(400).json({ 
      message: 'Course ID and curriculum IDs array are required' 
    });
  }

  try {
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
  } catch (error) {
    console.error('Error updating curriculum assignments:', error);
    return res.status(500).json({ 
      message: 'Error updating curriculum assignments',
      error: error.message 
    });
  }
}