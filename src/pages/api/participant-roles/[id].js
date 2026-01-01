import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import {
  scopedFindUnique,
  scopedFindFirst,
  scopedUpdate
} from '../../../lib/prisma/scopedQueries.js';
import { errorHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  const { orgContext } = req;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid participant role ID is required' });
  }

  const roleId = parseInt(id);

  try {
    switch (method) {
      case 'GET':
        return await handleGet(res, roleId, orgContext);
      case 'PUT':
        return await handlePut(req, res, roleId, orgContext);
      case 'DELETE':
        return await handleDelete(res, roleId, orgContext);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorHandler(error, req, res);
  }
}

async function handleGet(res, roleId, orgContext) {
  // Find role with organization scoping
  const role = await scopedFindUnique(orgContext, 'sub_organization_participant_role', {
    where: { id: roleId },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      },
      _count: {
        select: {
          participants: true,
          course_participant_roles: true,
          module_participant_roles: true
        }
      }
    }
  });

  if (!role) {
    throw new NotFoundError('Participant role not found');
  }

  const roleWithDetails = {
    id: role.id,
    title: role.title,
    description: role.description,
    isActive: role.isActive,
    organization: role.sub_organization.title,
    sub_organizationId: role.sub_organizationId,
    usageCount: role._count.participants + role._count.course_participant_roles + role._count.module_participant_roles,
    participantCount: role._count.participants,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    createdBy: role.createdBy,
    updatedBy: role.updatedBy
  };

  return res.status(200).json(roleWithDetails);
}

async function handlePut(req, res, roleId, orgContext) {
  const { title, description, isActive } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Role title is required');
  }

  // Verify role exists and belongs to user's organization
  const existingRole = await scopedFindUnique(orgContext, 'sub_organization_participant_role', {
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
    throw new NotFoundError('Participant role not found');
  }

  // Check if another role with the same title exists in the same organization
  const duplicateRole = await scopedFindFirst(orgContext, 'sub_organization_participant_role', {
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

  // Update role using scoped update
  const updatedRole = await scopedUpdate(orgContext, 'sub_organization_participant_role', { id: roleId }, {
    title: title.trim(),
    description: description?.trim() || null,
    isActive: isActive !== undefined ? isActive : existingRole.isActive,
    updatedBy: orgContext.userId
  });

  // Fetch the updated role with relations
  const roleWithRelations = await scopedFindUnique(orgContext, 'sub_organization_participant_role', {
    where: { id: updatedRole.id },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return res.status(200).json({
    id: roleWithRelations.id,
    title: roleWithRelations.title,
    description: roleWithRelations.description,
    isActive: roleWithRelations.isActive,
    organization: roleWithRelations.sub_organization.title,
    sub_organizationId: roleWithRelations.sub_organizationId,
    createdAt: roleWithRelations.createdAt,
    updatedAt: roleWithRelations.updatedAt,
    createdBy: roleWithRelations.createdBy,
    updatedBy: roleWithRelations.updatedBy
  });
}

async function handleDelete(res, roleId, orgContext) {
  // Verify role exists and belongs to user's organization
  const existingRole = await scopedFindUnique(orgContext, 'sub_organization_participant_role', {
    where: { id: roleId },
    include: {
      _count: {
        select: {
          participants: true
        }
      }
    }
  });

  if (!existingRole) {
    throw new NotFoundError('Participant role not found');
  }

  // Check if role is being used by participants
  const participantCount = existingRole._count.participants;
  if (participantCount > 0) {
    return res.status(409).json({
      error: `Cannot delete role. It is currently assigned to ${participantCount} participant(s).`,
      participantCount: participantCount
    });
  }

  // Soft delete - set isActive to false instead of hard delete
  await scopedUpdate(orgContext, 'sub_organization_participant_role', { id: roleId }, {
    isActive: false,
    updatedBy: orgContext.userId
  });

  return res.status(200).json({ message: 'Participant role deleted successfully' });
}

export default withOrgScope(handler);
