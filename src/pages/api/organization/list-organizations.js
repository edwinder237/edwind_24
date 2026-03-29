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
        currentSubOrganizationId: null,
        subOrganizations: [],
        count: 0
      });
    }

    const currentOrgId = await getCurrentOrganization(req);

    const subOrgAccessMap = new Map();

    for (const org of claims.organizations) {
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

    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      select: { sub_organizationId: true }
    });

    const currentSubOrgId = dbUser?.sub_organizationId;

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
});
