/**
 * ============================================
 * POST /api/organization/sub-organizations/create
 * ============================================
 *
 * Creates a new sub-organization for the current organization.
 *
 * Request Body:
 * {
 *   title: "Sub-Organization Name",
 *   description: "Optional description"
 * }
 *
 * Response:
 * {
 *   success: true,
 *   subOrganization: {...}
 * }
 */

import { WorkOS } from '@workos-inc/node';
import prisma from '../../../../lib/prisma';
import { withOrgScope } from '../../../../lib/middleware/withOrgScope.js';
import { asyncHandler, ValidationError } from '../../../../lib/errors/index.js';
import { invalidateClaimsCache, warmClaimsCache } from '../../../../lib/auth/claimsCache.js';
import { enforceResourceLimit } from '../../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../../lib/features/featureAccess';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { title, description } = req.body;
  const workosUserId = req.cookies.workos_user_id;

  // Validate required fields
  if (!title || !title.trim()) {
    throw new ValidationError('Title is required');
  }

  // Check sub-organization limit
  const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.SUB_ORGANIZATIONS);
  if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);

  // Create the sub-organization
  const subOrganization = await prisma.sub_organizations.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      organizationId: orgContext.organizationId,
      createdBy: workosUserId,
      updatedby: workosUserId
    },
    select: {
      id: true,
      title: true,
      description: true,
      organizationId: true,
      createdAt: true,
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

  console.log(`✅ Created sub-organization "${title}" for organization ${orgContext.organizationId}`);

  // Invalidate and warm claims cache so the new sub-org appears in switcher
  if (workosUserId) {
    try {
      await invalidateClaimsCache(workosUserId);
      await warmClaimsCache(req, workos);
      console.log(`✅ Claims cache refreshed for user ${workosUserId}`);
    } catch (cacheError) {
      console.error('Error refreshing claims cache:', cacheError);
      // Don't fail the request if cache refresh fails
    }
  }

  return res.status(201).json({
    success: true,
    subOrganization
  });
}

export default withOrgScope(asyncHandler(handler));
