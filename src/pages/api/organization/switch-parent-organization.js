/**
 * ============================================
 * POST /api/organization/switch-parent-organization
 * ============================================
 *
 * Allows authenticated users to switch between parent organizations they have access to.
 * Also sets the default sub-organization for the new organization.
 *
 * Request Body:
 * {
 *   organizationId: "uuid" // DB organizations.id
 * }
 *
 * Response:
 * {
 *   success: true,
 *   organization: {
 *     id: "uuid",
 *     title: "Organization Name",
 *     role: "Admin"
 *   },
 *   subOrganization: {
 *     id: 1,
 *     title: "Default Sub-Org"
 *   }
 * }
 *
 * Errors:
 * - 401: Not authenticated
 * - 403: User doesn't have access to requested organization
 * - 400: Invalid request (missing organizationId)
 */

import { WorkOS } from '@workos-inc/node';
import { getCachedClaims, invalidateClaimsCache, warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import { setCurrentOrganization } from '../../../lib/session/organizationSession.js';
import {
  UnauthorizedError,
  OrganizationAccessDeniedError,
  ValidationError,
  asyncHandler
} from '../../../lib/errors/index.js';
import prisma from '../../../lib/prisma.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const workosUserId = req.cookies.workos_user_id;

  if (!workosUserId) {
    throw new UnauthorizedError('Authentication required');
  }

  // Validate request body
  const { organizationId } = req.body;

  if (!organizationId) {
    throw new ValidationError('organizationId is required');
  }

  // Get user claims to check access
  const claims = await getCachedClaims(req, workos);

  if (!claims || !claims.organizations || claims.organizations.length === 0) {
    throw new OrganizationAccessDeniedError('No organization memberships found');
  }

  // Check if user has access to requested organization
  const claimOrg = claims.organizations.find(org => org.orgId === organizationId);

  if (!claimOrg) {
    throw new OrganizationAccessDeniedError(
      'You do not have access to this organization'
    );
  }

  // Fetch organization details
  const organization = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      title: true,
      workos_org_id: true
    }
  });

  if (!organization) {
    throw new ValidationError('Organization not found');
  }

  // Get user's accessible sub-organizations for this organization from claims
  const accessibleSubOrgIds = claimOrg.sub_organizations || [];

  // Find the first accessible sub-organization for this organization
  let defaultSubOrg = null;
  if (accessibleSubOrgIds.length > 0) {
    defaultSubOrg = await prisma.sub_organizations.findFirst({
      where: {
        id: { in: accessibleSubOrgIds },
        organizationId: organizationId
      },
      select: {
        id: true,
        title: true
      }
    });
  }

  // Update user's sub_organizationId in database
  // Note: User table doesn't have organizationId - organization is determined by sub_organization
  await prisma.user.update({
    where: { workos_user_id: workosUserId },
    data: {
      sub_organizationId: defaultSubOrg?.id || null
    }
  });

  // Update the session cookie with the new organization
  await setCurrentOrganization(req, res, organizationId, workos);

  // Invalidate claims cache to force fresh lookup on next request
  await invalidateClaimsCache(workosUserId);

  // Warm the cache with fresh claims
  await warmClaimsCache(req, workos);

  console.log(`✅ User ${workosUserId} switched to organization: ${organization.title} (${organizationId})`);
  if (defaultSubOrg) {
    console.log(`   Default sub-organization: ${defaultSubOrg.title} (${defaultSubOrg.id})`);
  }

  // Return success with organization details
  return res.status(200).json({
    success: true,
    message: `Switched to ${organization.title}`,
    organization: {
      id: organization.id,
      title: organization.title,
      role: claimOrg.role,
      normalizedRole: normalizeRole(claimOrg.role)
    },
    subOrganization: defaultSubOrg ? {
      id: defaultSubOrg.id,
      title: defaultSubOrg.title
    } : null
  });
}

export default asyncHandler(handler);
