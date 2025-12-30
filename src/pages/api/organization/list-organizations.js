/**
 * ============================================
 * GET /api/organization/list-organizations
 * ============================================
 *
 * Returns list of sub-organizations the authenticated user has access to.
 * Used for sub-organization switcher UI.
 *
 * Response:
 * {
 *   success: true,
 *   currentSubOrganizationId: 1, // Currently selected sub-org (or null)
 *   subOrganizations: [
 *     {
 *       id: 1,
 *       title: "Sub-Org Name",
 *       organizationId: "uuid",
 *       organizationTitle: "Parent Org Name",
 *       role: "Admin",
 *       normalizedRole: "admin",
 *       isCurrent: true
 *     }
 *   ]
 * }
 */

import { WorkOS } from '@workos-inc/node';
import { getCachedClaims } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import { getCurrentOrganization } from '../../../lib/session/organizationSession.js';
import {
  UnauthorizedError,
  asyncHandler
} from '../../../lib/errors/index.js';
import prisma from '../../../lib/prisma.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const workosUserId = req.cookies.workos_user_id;

  if (!workosUserId) {
    throw new UnauthorizedError('Authentication required');
  }

  // Get user claims which contain sub-organization IDs
  const claims = await getCachedClaims(req, workos);

  if (!claims || !claims.organizations || claims.organizations.length === 0) {
    return res.status(200).json({
      success: true,
      currentSubOrganizationId: null,
      subOrganizations: [],
      count: 0
    });
  }

  // Get current organization from session - filter to only show sub-orgs from current org
  const currentOrgId = await getCurrentOrganization(req);

  // Build access map and filter by current organization
  const subOrgAccessMap = new Map(); // subOrgId -> { orgId, role }

  for (const org of claims.organizations) {
    // Only include sub-orgs from the current organization (if set)
    if (currentOrgId && org.orgId !== currentOrgId) {
      continue;
    }

    if (org.sub_organizations && org.sub_organizations.length > 0) {
      for (const subOrgId of org.sub_organizations) {
        subOrgAccessMap.set(subOrgId, {
          orgId: org.orgId,
          workosOrgId: org.workos_org_id,
          role: org.role
        });
      }
    }
  }

  const subOrgIds = Array.from(subOrgAccessMap.keys());

  if (subOrgIds.length === 0) {
    return res.status(200).json({
      success: true,
      currentSubOrganizationId: null,
      currentOrganizationId: currentOrgId,
      subOrganizations: [],
      count: 0
    });
  }

  // Fetch sub-organizations with their parent organization info
  const subOrganizations = await prisma.sub_organizations.findMany({
    where: { id: { in: subOrgIds } },
    include: {
      organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Get current sub-organization from user's session
  const dbUser = await prisma.user.findUnique({
    where: { workos_user_id: workosUserId },
    select: { sub_organizationId: true }
  });

  const currentSubOrgId = dbUser?.sub_organizationId;

  // Build enriched list
  const enrichedSubOrgs = subOrganizations.map(subOrg => {
    const accessInfo = subOrgAccessMap.get(subOrg.id);
    return {
      id: subOrg.id,
      title: subOrg.title,
      organizationId: subOrg.organization.id,
      organizationTitle: subOrg.organization.title,
      role: accessInfo?.role || 'member',
      normalizedRole: normalizeRole(accessInfo?.role || 'member'),
      isCurrent: subOrg.id === currentSubOrgId
    };
  });

  // Sort: current first, then by organization, then by title
  enrichedSubOrgs.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    if (a.organizationTitle !== b.organizationTitle) {
      return a.organizationTitle.localeCompare(b.organizationTitle);
    }
    return a.title.localeCompare(b.title);
  });

  return res.status(200).json({
    success: true,
    currentSubOrganizationId: currentSubOrgId,
    currentOrganizationId: currentOrgId,
    subOrganizations: enrichedSubOrgs,
    count: enrichedSubOrgs.length
  });
}

export default asyncHandler(handler);
