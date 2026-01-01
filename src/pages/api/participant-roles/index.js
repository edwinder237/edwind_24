import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import {
  scopedFindMany,
  scopedFindFirst,
  scopedCreate
} from '../../../lib/prisma/scopedQueries.js';
import { errorHandler, ValidationError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method } = req;
  const { orgContext } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(res, orgContext);
      case 'POST':
        return await handlePost(req, res, orgContext);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorHandler(error, req, res);
  }
}

async function handleGet(res, orgContext) {
  // Fetch participant roles scoped to user's accessible sub-organizations
  const participantRoles = await scopedFindMany(orgContext, 'sub_organization_participant_role', {
    where: {
      isActive: true
    },
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
    },
    orderBy: {
      title: 'asc'
    }
  });

  // Transform data for response
  const rolesWithDetails = participantRoles.map(role => ({
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
  }));

  return res.status(200).json(rolesWithDetails);
}

async function handlePost(req, res, orgContext) {
  const { title, description, sub_organizationId } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Role title is required');
  }

  // Use provided sub_organizationId or default to first accessible sub-org
  const targetSubOrgId = sub_organizationId
    ? parseInt(sub_organizationId)
    : orgContext.subOrganizationIds[0];

  // Validate the sub_organizationId belongs to user's organization
  if (!orgContext.subOrganizationIds.includes(targetSubOrgId)) {
    throw new ValidationError('Invalid sub-organization');
  }

  // Check if role already exists in this organization
  const existingRole = await scopedFindFirst(orgContext, 'sub_organization_participant_role', {
    where: {
      title: title.trim(),
      sub_organizationId: targetSubOrgId,
      isActive: true
    }
  });

  if (existingRole) {
    return res.status(409).json({ error: 'Role with this title already exists in your organization' });
  }

  // Create new participant role with proper organization scoping
  const newRole = await scopedCreate(orgContext, 'sub_organization_participant_role', {
    title: title.trim(),
    description: description?.trim() || null,
    sub_organizationId: targetSubOrgId,
    createdBy: orgContext.userId
  });

  // Fetch the complete role with relations
  const roleWithRelations = await scopedFindFirst(orgContext, 'sub_organization_participant_role', {
    where: { id: newRole.id },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return res.status(201).json({
    id: roleWithRelations.id,
    title: roleWithRelations.title,
    description: roleWithRelations.description,
    isActive: roleWithRelations.isActive,
    organization: roleWithRelations.sub_organization.title,
    sub_organizationId: roleWithRelations.sub_organizationId,
    usageCount: 0,
    participantCount: 0,
    createdAt: roleWithRelations.createdAt,
    updatedAt: roleWithRelations.updatedAt,
    createdBy: roleWithRelations.createdBy,
    updatedBy: roleWithRelations.updatedBy
  });
}

export default withOrgScope(handler);
