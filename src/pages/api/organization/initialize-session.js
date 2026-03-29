import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import {
  getCurrentOrganization,
  setCurrentOrganization,
  getUserOrganizations
} from '../../../lib/session/organizationSession.js';
import { warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import { UnauthorizedError } from '../../../lib/errors/index.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'auth',
  POST: async (req, res) => {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      throw new UnauthorizedError('Authentication required');
    }

    const currentOrgId = await getCurrentOrganization(req);

    if (currentOrgId) {
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

    const userOrganizations = await getUserOrganizations(req, workos);

    if (!userOrganizations || userOrganizations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'No organization memberships found',
        message: 'You must be a member of an organization to access this application'
      });
    }

    const firstOrg = userOrganizations[0];
    const result = await setCurrentOrganization(req, res, firstOrg.id, workos);

    await warmClaimsCache(req, workos);

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
});
