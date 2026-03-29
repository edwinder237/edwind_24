import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    // Get role assignments for a course
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const assignments = await prisma.course_participant_roles.findMany({
      where: {
        courseId: parseInt(courseId)
      },
      include: {
        role: true
      },
      orderBy: {
        role: {
          title: 'asc'
        }
      }
    });

    // Also get all available roles for the organization
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(courseId) },
      select: { sub_organizationId: true }
    });

    const availableRoles = await prisma.sub_organization_participant_role.findMany({
      where: {
        sub_organizationId: course.sub_organizationId,
        isActive: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    return res.status(200).json({
      assignments,
      availableRoles
    });
  },

  POST: async (req, res) => {
    // Add role assignment to a course
    const { courseId: postCourseId, roleId, isRequired = true } = req.body;

    if (!postCourseId || !roleId) {
      return res.status(400).json({ error: 'Course ID and Role ID are required' });
    }

    // Check if assignment already exists
    const existing = await prisma.course_participant_roles.findUnique({
      where: {
        courseId_roleId: {
          courseId: parseInt(postCourseId),
          roleId: parseInt(roleId)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'This role is already assigned to the course' });
    }

    const newAssignment = await prisma.course_participant_roles.create({
      data: {
        courseId: parseInt(postCourseId),
        roleId: parseInt(roleId),
        isRequired,
        createdBy: req.user?.id || 'system'
      },
      include: {
        role: true
      }
    });

    return res.status(201).json(newAssignment);
  },

  PUT: async (req, res) => {
    // Update role assignment
    const { id, isRequired: updateIsRequired } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    const updatedAssignment = await prisma.course_participant_roles.update({
      where: { id: parseInt(id) },
      data: {
        isRequired: updateIsRequired,
        updatedBy: req.user?.id || 'system'
      },
      include: {
        role: true
      }
    });

    return res.status(200).json(updatedAssignment);
  },

  DELETE: async (req, res) => {
    // Remove role assignment
    const { id: deleteId } = req.query;

    if (!deleteId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    await prisma.course_participant_roles.delete({
      where: { id: parseInt(deleteId) }
    });

    return res.status(200).json({ message: 'Role assignment removed successfully' });
  }
});
