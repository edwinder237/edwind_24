/**
 * ============================================
 * GET /api/organization/list-parent-organizations
 * ============================================
 *
 * Returns list of parent organizations the authenticated user has access to.
 * Used for organization switcher in Profile dropdown.
 *
 * Response:
 * {
 *   success: true,
 *   currentOrganizationId: "uuid",
 *   organizations: [
 *     {
 *       id: "uuid",
 *       title: "Organization Name",
 *       workosOrgId: "org_xxx",
 *       role: "Admin",
 *       isCurrent: true,
 *       subOrganizationCount: 3
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

  // Get user claims which contain organization memberships
  const claims = await getCachedClaims(req, workos);

  if (!claims || !claims.organizations || claims.organizations.length === 0) {
    return res.status(200).json({
      success: true,
      currentOrganizationId: null,
      organizations: [],
      count: 0
    });
  }

  // Get current organization from session cookie (not database)
  // This ensures the "Current" flag matches what the user actually switched to
  const currentOrgId = await getCurrentOrganization(req);

  // Build list of organization IDs from claims
  const orgIds = claims.organizations.map(org => org.orgId).filter(Boolean);

  if (orgIds.length === 0) {
    return res.status(200).json({
      success: true,
      currentOrganizationId: null,
      organizations: [],
      count: 0
    });
  }

  // Fetch organizations from database
  const organizations = await prisma.organizations.findMany({
    where: { id: { in: orgIds } },
    select: {
      id: true,
      title: true,
      workos_org_id: true
    }
  });

  // Merge with role information from claims
  // Get sub-organization count from claims (user's accessible sub-orgs per organization)
  const enrichedOrgs = organizations.map(org => {
    const claimOrg = claims.organizations.find(co => co.orgId === org.id);
    // Count sub-organizations the user has access to for this org
    const subOrgCount = claimOrg?.sub_organizations?.length || 0;
    return {
      id: org.id,
      title: org.title,
      workosOrgId: org.workos_org_id,
      role: claimOrg?.role || 'Member',
      normalizedRole: normalizeRole(claimOrg?.role || 'Member'),
      isCurrent: org.id === currentOrgId,
      subOrganizationCount: subOrgCount
    };
  });

  // Sort: current first, then alphabetically
  enrichedOrgs.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return a.title.localeCompare(b.title);
  });

  return res.status(200).json({
    success: true,
    currentOrganizationId: currentOrgId,
    organizations: enrichedOrgs,
    count: enrichedOrgs.length
  });
}

export default asyncHandler(handler);
