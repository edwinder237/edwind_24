import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

const getInstructors = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

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
};

const addInstructor = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

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
};

const updateInstructorRole = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

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
};

const removeInstructor = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

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
};

export default createHandler({
  scope: 'org',
  GET: getInstructors,
  POST: addInstructor,
  PUT: updateInstructorRole,
  DELETE: removeInstructor
});
