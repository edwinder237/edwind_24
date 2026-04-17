/**
 * ============================================
 * /api/organization/sub-organizations/[id]
 * ============================================
 *
 * GET: Fetch single sub-organization details
 * PUT: Update sub-organization (title, description)
 * DELETE: Delete sub-organization
 */

import { WorkOS } from '@workos-inc/node';
import prisma from '../../../../lib/prisma';
import { createHandler } from '../../../../lib/api/createHandler';
import { ValidationError, NotFoundError } from '../../../../lib/errors/index.js';
import { invalidateClaimsCache, warmClaimsCache } from '../../../../lib/auth/claimsCache.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Helper to verify sub-organization ownership
async function verifySubOrgOwnership(id, orgContext) {
  const subOrgId = parseInt(id, 10);
  if (isNaN(subOrgId)) {
    throw new ValidationError('Invalid sub-organization ID');
  }

  const existingSubOrg = await prisma.sub_organizations.findFirst({
    where: {
      id: subOrgId,
      organizationId: orgContext.organizationId
    }
  });

  if (!existingSubOrg) {
    throw new NotFoundError('Sub-organization not found');
  }

  return subOrgId;
}

async function handleGet(req, res) {
  const { id } = req.query;
  const { orgContext } = req;
  const subOrgId = await verifySubOrgOwnership(id, orgContext);

  const subOrganization = await prisma.sub_organizations.findUnique({
    where: { id: subOrgId },
    select: {
      id: true,
      title: true,
      description: true,
      organizationId: true,
      createdAt: true,
      lastUpdated: true,
      createdBy: true,
      _count: {
        select: {
          projects: true,
          instructors: true,
          users: true,
          courses: true,
          participant_roles: true,
          topics: true,
          training_recipients: true
        }
      }
    }
  });

  return res.status(200).json({
    success: true,
    subOrganization
  });
}

async function handleUpdate(req, res) {
  const { id } = req.query;
  const { orgContext } = req;
  const workosUserId = req.cookies.workos_user_id;
  const subOrgId = await verifySubOrgOwnership(id, orgContext);

  const { title, description } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Title is required');
  }

  const subOrganization = await prisma.sub_organizations.update({
    where: { id: subOrgId },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      lastUpdated: new Date(),
      updatedby: workosUserId
    },
    select: {
      id: true,
      title: true,
      description: true,
      organizationId: true,
      lastUpdated: true,
      _count: {
        select: {
          projects: true,
          instructors: true,
          users: true,
          courses: true
        }
      }
    }
  });

  return res.status(200).json({
    success: true,
    subOrganization
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;
  const { orgContext } = req;
  const workosUserId = req.cookies.workos_user_id;
  const subOrgId = await verifySubOrgOwnership(id, orgContext);

  // Check if this is the only sub-organization
  const subOrgCount = await prisma.sub_organizations.count({
    where: { organizationId: orgContext.organizationId }
  });

  if (subOrgCount <= 1) {
    return res.status(400).json({
      error: 'Cannot delete',
      message: 'You must have at least one sub-organization. Create a new one before deleting this.'
    });
  }

  // Check for related data
  const subOrg = await prisma.sub_organizations.findUnique({
    where: { id: subOrgId },
    select: {
      title: true,
      _count: {
        select: {
          projects: true,
          instructors: true,
          users: true,
          courses: true
        }
      }
    }
  });

  const hasData = subOrg._count.projects > 0 ||
                  subOrg._count.instructors > 0 ||
                  subOrg._count.users > 0 ||
                  subOrg._count.courses > 0;

  if (hasData) {
    return res.status(400).json({
      error: 'Cannot delete',
      message: `This sub-organization has associated data (${subOrg._count.projects} projects, ${subOrg._count.instructors} instructors, ${subOrg._count.users} users, ${subOrg._count.courses} courses). Please move or delete this data first.`,
      counts: subOrg._count
    });
  }

  // Delete the sub-organization
  await prisma.sub_organizations.delete({
    where: { id: subOrgId }
  });

  // Invalidate and warm claims cache so the deleted sub-org is removed from switcher
  if (workosUserId) {
    try {
      await invalidateClaimsCache(workosUserId);
      await warmClaimsCache(req, workos);
    } catch (cacheError) {
      console.error('Error refreshing claims cache:', cacheError);
      // Don't fail the request if cache refresh fails
    }
  }

  return res.status(200).json({
    success: true,
    message: `Sub-organization "${subOrg.title}" has been deleted.`
  });
}

export default createHandler({
  scope: 'org',
  GET: handleGet,
  PUT: handleUpdate,
  DELETE: handleDelete
});
