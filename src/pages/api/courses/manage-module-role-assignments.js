import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get role assignments for a module
        const { moduleId } = req.query;
        
        if (!moduleId) {
          return res.status(400).json({ error: 'Module ID is required' });
        }

        const assignments = await prisma.module_participant_roles.findMany({
          where: {
            moduleId: parseInt(moduleId)
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

        // Get the course and available roles
        const module = await prisma.modules.findUnique({
          where: { id: parseInt(moduleId) },
          include: {
            course: {
              select: { sub_organizationId: true }
            }
          }
        });

        const availableRoles = await prisma.sub_organization_participant_role.findMany({
          where: {
            sub_organizationId: module.course.sub_organizationId,
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
        // Add role assignment to a module
        const { moduleId: postModuleId, roleId, isRequired = true } = req.body;

        if (!postModuleId || !roleId) {
          return res.status(400).json({ error: 'Module ID and Role ID are required' });
        }

        // Check if assignment already exists
        const existing = await prisma.module_participant_roles.findUnique({
          where: {
            moduleId_roleId: {
              moduleId: parseInt(postModuleId),
              roleId: parseInt(roleId)
            }
          }
        });

        if (existing) {
          return res.status(400).json({ error: 'This role is already assigned to the module' });
        }

        const newAssignment = await prisma.module_participant_roles.create({
          data: {
            moduleId: parseInt(postModuleId),
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

        const updatedAssignment = await prisma.module_participant_roles.update({
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

        await prisma.module_participant_roles.delete({
          where: { id: parseInt(deleteId) }
        });

        return res.status(200).json({ message: 'Role assignment removed successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error managing module role assignments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}