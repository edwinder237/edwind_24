/**
 * ============================================
 * POST /api/organization/initialize-session
 * ============================================
 *
 * Initializes organization session for authenticated user.
 * If no organization is currently selected, selects the first available organization.
 * Called automatically after login or when session needs initialization.
 *
 * Response:
 * {
 *   success: true,
 *   initialized: true,
 *   organization: {
 *     id: "uuid",
 *     workosOrgId: "org_xyz",
 *     title: "Organization Name",
 *     role: "Admin"
 *   }
 * }
 */

import { WorkOS } from '@workos-inc/node';
import {
  getCurrentOrganization,
  setCurrentOrganization,
  getUserOrganizations
} from '../../../lib/session/organizationSession.js';
import { warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import {
  UnauthorizedError,
  asyncHandler
} from '../../../lib/errors/index.js';

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

  // Check if organization is already selected
  const currentOrgId = await getCurrentOrganization(req);

  if (currentOrgId) {
    // Already initialized
    const userOrgs = await getUserOrganizations(req, workos);
    const currentOrg = userOrgs.find(org => org.id === currentOrgId);

    return res.status(200).json({
      success: true,
      initialized: true,
      alreadyInitialized: true,
      organization: currentOrg ? {
        id: currentOrg.id,
        workosOrgId: currentOrg.workosOrgId,
        title: currentOrg.title,
        role: currentOrg.role,
        normalizedRole: normalizeRole(currentOrg.role)
      } : null
    });
  }

  // No organization selected - select first available
  const userOrganizations = await getUserOrganizations(req, workos);

  if (!userOrganizations || userOrganizations.length === 0) {
    return res.status(403).json({
      success: false,
      error: 'No organization memberships found',
      message: 'You must be a member of an organization to access this application'
    });
  }

  // Select first organization
  const firstOrg = userOrganizations[0];
  const result = await setCurrentOrganization(req, res, firstOrg.id, workos);

  // Warm the cache
  await warmClaimsCache(req, workos);

  console.log(`✅ Initialized session for user ${workosUserId} with org: ${result.title} (${result.organizationId})`);

  return res.status(200).json({
    success: true,
    initialized: true,
    alreadyInitialized: false,
    organization: {
      id: result.organizationId,
      workosOrgId: result.workosOrgId,
      title: result.title,
      role: firstOrg.role,
      normalizedRole: normalizeRole(firstOrg.role)
    }
  });
}

export default asyncHandler(handler);
