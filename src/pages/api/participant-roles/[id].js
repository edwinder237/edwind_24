import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid participant role ID is required' });
  }

  const roleId = parseInt(id);

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, roleId);
        break;
      case 'PUT':
        await handlePut(req, res, roleId);
        break;
      case 'DELETE':
        await handleDelete(req, res, roleId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, roleId) {
  try {
    const role = await prisma.sub_organization_participant_role.findUnique({
      where: { id: roleId },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Participant role not found' });
    }

    const roleWithDetails = {
      id: role.id,
      title: role.title,
      description: role.description,
      isActive: role.isActive,
      organization: role.sub_organization.title,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy
    };

    res.status(200).json(roleWithDetails);
  } catch (error) {
    console.error('Error fetching participant role:', error);
    res.status(500).json({ error: 'Failed to fetch participant role' });
  }
}

async function handlePut(req, res, roleId) {
  try {
    const { title, description, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Role title is required' });
    }

    // Check if role exists
    const existingRole = await prisma.sub_organization_participant_role.findUnique({
      where: { id: roleId },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!existingRole) {
      return res.status(404).json({ error: 'Participant role not found' });
    }

    // Check if another role with the same title exists in the same organization
    const duplicateRole = await prisma.sub_organization_participant_role.findFirst({
      where: {
        title: title.trim(),
        sub_organizationId: existingRole.sub_organizationId,
        isActive: true,
        NOT: {
          id: roleId
        }
      }
    });

    if (duplicateRole) {
      return res.status(409).json({ error: 'Role with this title already exists in your organization' });
    }

    const defaultUpdatedBy = 'system'; // You should replace this with actual user ID

    // Update role
    const updatedRole = await prisma.sub_organization_participant_role.update({
      where: { id: roleId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingRole.isActive,
        updatedBy: defaultUpdatedBy
      },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(200).json({
      id: updatedRole.id,
      title: updatedRole.title,
      description: updatedRole.description,
      isActive: updatedRole.isActive,
      organization: updatedRole.sub_organization.title,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
      createdBy: updatedRole.createdBy,
      updatedBy: updatedRole.updatedBy
    });
  } catch (error) {
    console.error('Error updating participant role:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('unique_role_per_organization')) {
      return res.status(409).json({ error: 'Role with this title already exists in your organization' });
    }
    
    res.status(500).json({ error: 'Failed to update participant role' });
  }
}

async function handleDelete(req, res, roleId) {
  try {
    // Check if role exists
    const existingRole = await prisma.sub_organization_participant_role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return res.status(404).json({ error: 'Participant role not found' });
    }

    // TODO: In the future, you might want to check if this role is being used by participants
    // For now, we'll allow deletion, but you could add a usage check similar to topics

    // Soft delete - set isActive to false instead of hard delete
    await prisma.sub_organization_participant_role.update({
      where: { id: roleId },
      data: {
        isActive: false,
        updatedBy: 'system' // You should replace this with actual user ID
      }
    });

    res.status(200).json({ message: 'Participant role deleted successfully' });
  } catch (error) {
    console.error('Error deleting participant role:', error);
    res.status(500).json({ error: 'Failed to delete participant role' });
  }
}