/**
 * ============================================
 * GET /api/organization/sub-organizations
 * ============================================
 *
 * Returns all sub-organizations for the current organization.
 *
 * Response:
 * {
 *   success: true,
 *   subOrganizations: [...],
 *   limits: { current: 1, max: 5 }
 * }
 */

import prisma from '../../../../lib/prisma';
import { withOrgScope } from '../../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  // Fetch all sub-organizations for this organization with counts
  const subOrganizations = await prisma.sub_organizations.findMany({
    where: {
      organizationId: orgContext.organizationId
    },
    select: {
      id: true,
      title: true,
      description: true,
      organizationId: true,
      createdAt: true,
      lastUpdated: true,
      _count: {
        select: {
          projects: true,
          instructors: true,
          users: true,
          courses: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Get subscription limits for sub-organizations
  let maxSubOrganizations = 1; // Default limit
  try {
    const subscription = await prisma.subscriptions.findUnique({
      where: { organizationId: orgContext.organizationId },
      include: {
        plan: true
      }
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

  return res.status(200).json({
    success: true,
    subOrganizations,
    limits: {
      current: subOrganizations.length,
      max: maxSubOrganizations
    }
  });
}

export default withOrgScope(asyncHandler(handler));
