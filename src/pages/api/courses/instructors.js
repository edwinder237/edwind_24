import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Course ID is required' 
    });
  }

  try {
    if (req.method === 'GET') {
      // Get course instructors
      const courseInstructors = await prisma.course_instructors.findMany({
        where: { 
          courseId: parseInt(courseId) 
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              bio: true,
              expertise: true,
              instructorType: true,
              status: true,
              profileImage: true,
              qualifications: true,
              hourlyRate: true,
              availability: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      res.status(200).json({
        success: true,
        instructors: courseInstructors
      });

    } else if (req.method === 'POST') {
      // Add instructor to course
      const { instructorId, role = 'main' } = req.body;

      if (!instructorId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Instructor ID is required' 
        });
      }

      // Check if instructor already assigned to this course
      const existingAssignment = await prisma.course_instructors.findUnique({
        where: {
          courseId_instructorId: {
            courseId: parseInt(courseId),
            instructorId: parseInt(instructorId)
          }
        }
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Instructor is already assigned to this course'
        });
      }

      // Add instructor to course
      const courseInstructor = await prisma.course_instructors.create({
        data: {
          courseId: parseInt(courseId),
          instructorId: parseInt(instructorId),
          role: role
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              bio: true,
              expertise: true,
              instructorType: true,
              status: true,
              profileImage: true,
              qualifications: true,
              hourlyRate: true,
              availability: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Instructor added to course successfully',
        courseInstructor
      });

    } else if (req.method === 'PUT') {
      // Update instructor role in course
      const { instructorId, role } = req.body;

      if (!instructorId || !role) {
        return res.status(400).json({ 
          success: false, 
          message: 'Instructor ID and role are required' 
        });
      }

      const updatedInstructor = await prisma.course_instructors.update({
        where: {
          courseId_instructorId: {
            courseId: parseInt(courseId),
            instructorId: parseInt(instructorId)
          }
        },
        data: { role },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              bio: true,
              expertise: true,
              instructorType: true,
              status: true,
              profileImage: true,
              qualifications: true,
              hourlyRate: true,
              availability: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Instructor role updated successfully',
        courseInstructor: updatedInstructor
      });

    } else if (req.method === 'DELETE') {
      // Remove instructor from course
      const { instructorId } = req.body;

      if (!instructorId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Instructor ID is required' 
        });
      }

      await prisma.course_instructors.delete({
        where: {
          courseId_instructorId: {
            courseId: parseInt(courseId),
            instructorId: parseInt(instructorId)
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Instructor removed from course successfully'
      });

    } else {
      res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('Course instructors API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}