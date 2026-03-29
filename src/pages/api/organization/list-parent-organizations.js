import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import { getCachedClaims } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import { getCurrentOrganization } from '../../../lib/session/organizationSession.js';
import { UnauthorizedError } from '../../../lib/errors/index.js';
import prisma from '../../../lib/prisma.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'auth',
  GET: async (req, res) => {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      throw new UnauthorizedError('Authentication required');
    }

    const claims = await getCachedClaims(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      return res.status(200).json({
        success: true,
        currentOrganizationId: null,
        organizations: [],
        count: 0
      });
    }

    const currentOrgId = await getCurrentOrganization(req);

    const orgIds = claims.organizations.map(org => org.orgId).filter(Boolean);

    if (orgIds.length === 0) {
      return res.status(200).json({
        success: true,
        currentOrganizationId: null,
        organizations: [],
        count: 0
      });
    }

    const organizations = await prisma.organizations.findMany({
      where: { id: { in: orgIds } },
      select: {
        id: true,
        title: true,
        workos_org_id: true
      }
    });

    const enrichedOrgs = organizations.map(org => {
      const claimOrg = claims.organizations.find(co => co.orgId === org.id);
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
});
