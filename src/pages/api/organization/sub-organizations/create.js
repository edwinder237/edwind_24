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

  // Check subscription limits
  const currentCount = await prisma.sub_organizations.count({
    where: { organizationId: orgContext.organizationId }
  });

  let maxSubOrganizations = 1;
  try {
    const subscription = await prisma.subscriptions.findUnique({
      where: { organizationId: orgContext.organizationId },
      include: { plan: true }
    });

    if (subscription?.plan?.resourceLimits) {
      const limits = typeof subscription.plan.resourceLimits === 'string'
        ? JSON.parse(subscription.plan.resourceLimits)
        : subscription.plan.resourceLimits;
      maxSubOrganizations = limits.maxSubOrganizations || 1;
    }
  } catch (error) {
    console.error('Error fetching subscription limits:', error);
  }

  // Check if limit reached (-1 means unlimited)
  if (maxSubOrganizations !== -1 && currentCount >= maxSubOrganizations) {
    return res.status(403).json({
      error: 'Sub-organization limit reached',
      message: `Your plan allows a maximum of ${maxSubOrganizations} sub-organization(s). Please upgrade your plan to add more.`,
      limits: {
        current: currentCount,
        max: maxSubOrganizations
      }
    });
  }

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
    subOrganization,
    limits: {
      current: currentCount + 1,
      max: maxSubOrganizations
    }
  });
}

export default withOrgScope(asyncHandler(handler));
