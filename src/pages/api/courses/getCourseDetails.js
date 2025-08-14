import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Course ID is required' 
      });
    }

    const courseId = parseInt(id);

    // Fetch course with all associations
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        modules: true,
        events: true,
        curriculum_courses: {
          include: {
            currculum: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    res.status(200).json({
      success: true,
      course: course
    });

  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch course details',
      error: error.message 
    });
  }
}