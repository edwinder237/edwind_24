/**
 * ============================================
 * GET /api/organization/get-organization
 * ============================================
 *
 * Returns the current organization with sub-organizations.
 * If organizationId query param provided, returns that specific org (if user has access).
 *
 * Query Params:
 * - organizationId (optional): Specific organization to fetch
 *
 * Response:
 * {
 *   success: true,
 *   organization: {
 *     id: "uuid",
 *     workos_org_id: "org_xyz",
 *     title: "Organization Name",
 *     sub_organizations: [...]
 *   }
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.query;
  const { orgContext } = req;

  // If specific organizationId requested
  if (organizationId) {
    // Check if user has access to this organization
    if (organizationId !== orgContext.organizationId) {
      // Return 404 to hide existence of other orgs
      return res.status(404).json({ error: 'Organization not found' });
    }
  }

  // Fetch current organization with sub-organizations
  const organization = await prisma.organizations.findUnique({
    where: { id: orgContext.organizationId },
    include: {
      sub_organizations: {
        select: {
          id: true,
          title: true,
          organizationId: true
        }
      }
    }
  });

  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Get all sub-organizations for this organization
  const subOrgs = await prisma.sub_organizations.findMany({
    where: {
      organizationId: orgContext.organizationId
    },
    select: {
      id: true,
      title: true,
      organizationId: true
    }
  });

  const subOrgIds = subOrgs.map(so => so.id);

  // Count projects for this organization's sub-organizations
  const projectCount = subOrgIds.length > 0 ? await prisma.projects.count({
    where: {
      sub_organizationId: {
        in: subOrgIds
      }
    }
  }) : 0;

  // Count instructors for this organization's sub-organizations
  const instructorCount = subOrgIds.length > 0 ? await prisma.instructors.count({
    where: {
      sub_organizationId: {
        in: subOrgIds
      }
    }
  }) : 0;

  // Count participants for this organization's sub-organizations
  const participantCount = subOrgIds.length > 0 ? await prisma.participants.count({
    where: {
      sub_organization: {
        in: subOrgIds
      }
    }
  }) : 0;

  // Update the organization object to include all sub-organizations
  organization.sub_organizations = subOrgs;

  return res.status(200).json({
    success: true,
    organization,
    statistics: {
      projects: projectCount,
      instructors: instructorCount,
      participants: participantCount
    }
  });
}

export default withOrgScope(asyncHandler(handler));
