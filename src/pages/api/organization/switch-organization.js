/**
 * ============================================
 * POST /api/organization/switch-organization
 * ============================================
 *
 * Allows authenticated users to switch between sub-organizations they have access to.
 * Validates membership and updates user's sub_organizationId in database.
 *
 * Request Body:
 * {
 *   subOrganizationId: 1 // DB sub_organizations.id
 * }
 *
 * Response:
 * {
 *   success: true,
 *   subOrganization: {
 *     id: 1,
 *     title: "Sub-Org Name",
 *     organizationId: "uuid",
 *     organizationTitle: "Parent Org Name",
 *     role: "Admin"
 *   }
 * }
 *
 * Errors:
 * - 401: Not authenticated
 * - 403: User doesn't have access to requested sub-organization
 * - 400: Invalid request (missing subOrganizationId)
 */

import { WorkOS } from '@workos-inc/node';
import { getCachedClaims, invalidateClaimsCache, warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
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

  // Validate request body - support both old and new parameter names
  const subOrganizationId = req.body.subOrganizationId || req.body.organizationId;

  if (!subOrganizationId) {
    throw new ValidationError('subOrganizationId is required');
  }

  // Parse as integer if it's a string
  const subOrgId = typeof subOrganizationId === 'string' ? parseInt(subOrganizationId, 10) : subOrganizationId;

  if (isNaN(subOrgId)) {
    throw new ValidationError('Invalid subOrganizationId');
  }

  // Get user claims to check access
  const claims = await getCachedClaims(req, workos);

  if (!claims || !claims.organizations || claims.organizations.length === 0) {
    throw new OrganizationAccessDeniedError('No organization memberships found');
  }

  // Build list of accessible sub-organization IDs with their roles
  const subOrgAccessMap = new Map();
  for (const org of claims.organizations) {
    if (org.sub_organizations && org.sub_organizations.length > 0) {
      for (const soid of org.sub_organizations) {
        subOrgAccessMap.set(soid, {
          orgId: org.orgId,
          role: org.role
        });
      }
    }
  }

  // Check if user has access to requested sub-organization
  if (!subOrgAccessMap.has(subOrgId)) {
    throw new OrganizationAccessDeniedError(
      'You do not have access to this sub-organization'
    );
  }

  const accessInfo = subOrgAccessMap.get(subOrgId);

  // Fetch sub-organization details
  const subOrg = await prisma.sub_organizations.findUnique({
    where: { id: subOrgId },
    include: {
      organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (!subOrg) {
    throw new ValidationError('Sub-organization not found');
  }

  // Update user's sub_organizationId in database
  await prisma.user.update({
    where: { workos_user_id: workosUserId },
    data: { sub_organizationId: subOrgId }
  });

  // Invalidate claims cache to force fresh lookup on next request
  await invalidateClaimsCache(workosUserId);

  // Warm the cache with fresh claims
  await warmClaimsCache(req, workos);

  console.log(`✅ User ${workosUserId} switched to sub-organization: ${subOrg.title} (${subOrgId})`);

  // Return success with sub-organization details
  return res.status(200).json({
    success: true,
    message: `Switched to ${subOrg.title}`,
    subOrganization: {
      id: subOrg.id,
      title: subOrg.title,
      organizationId: subOrg.organization.id,
      organizationTitle: subOrg.organization.title,
      role: accessInfo.role,
      normalizedRole: normalizeRole(accessInfo.role)
    }
  });
}

export default asyncHandler(handler);
