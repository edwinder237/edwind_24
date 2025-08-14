import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
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

      case 'POST':
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

      case 'PUT':
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

      case 'DELETE':
        // Remove role assignment
        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ error: 'Assignment ID is required' });
        }

        await prisma.course_participant_roles.delete({
          where: { id: parseInt(deleteId) }
        });

        return res.status(200).json({ message: 'Role assignment removed successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error managing course role assignments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}