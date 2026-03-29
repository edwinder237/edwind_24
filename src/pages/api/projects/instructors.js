import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',

  GET: async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Get project instructors
    const projectInstructors = await prisma.project_instructors.findMany({
      where: {
        projectId: parseInt(projectId)
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
      instructors: projectInstructors
    });
  },

  POST: async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Add instructor to project
    const { instructorId, instructorType = 'main' } = req.body;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Instructor ID is required'
      });
    }

    // Check if instructor already assigned to this project
    const existingAssignment = await prisma.project_instructors.findUnique({
      where: {
        projectId_instructorId: {
          projectId: parseInt(projectId),
          instructorId: parseInt(instructorId)
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Instructor is already assigned to this project'
      });
    }

    // Add instructor to project
    const projectInstructor = await prisma.project_instructors.create({
      data: {
        projectId: parseInt(projectId),
        instructorId: parseInt(instructorId),
        instructorType: instructorType
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
      message: 'Instructor added to project successfully',
      projectInstructor
    });
  },

  PUT: async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Update instructor type in project
    const { instructorId, instructorType } = req.body;

    if (!instructorId || !instructorType) {
      return res.status(400).json({
        success: false,
        message: 'Instructor ID and instructor type are required'
      });
    }

    const updatedInstructor = await prisma.project_instructors.update({
      where: {
        projectId_instructorId: {
          projectId: parseInt(projectId),
          instructorId: parseInt(instructorId)
        }
      },
      data: { instructorType },
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
      message: 'Instructor type updated successfully',
      projectInstructor: updatedInstructor
    });
  },

  DELETE: async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Remove instructor from project
    const { instructorId } = req.body;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Instructor ID is required'
      });
    }

    await prisma.project_instructors.delete({
      where: {
        projectId_instructorId: {
          projectId: parseInt(projectId),
          instructorId: parseInt(instructorId)
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Instructor removed from project successfully'
    });
  }
});
