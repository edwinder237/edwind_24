import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Project ID is required' 
    });
  }

  try {
    if (req.method === 'GET') {
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

    } else if (req.method === 'POST') {
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

    } else if (req.method === 'PUT') {
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

    } else if (req.method === 'DELETE') {
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

    } else {
      res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('Project instructors API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}