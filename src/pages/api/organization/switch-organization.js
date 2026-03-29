import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import { getCachedClaims, invalidateClaimsCache, warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import {
  UnauthorizedError,
  OrganizationAccessDeniedError,
  ValidationError,
} from '../../../lib/errors/index.js';
import prisma from '../../../lib/prisma.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'auth',
  POST: async (req, res) => {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      throw new UnauthorizedError('Authentication required');
    }

    const subOrganizationId = req.body.subOrganizationId || req.body.organizationId;

    if (!subOrganizationId) {
      throw new ValidationError('subOrganizationId is required');
    }

    const subOrgId = typeof subOrganizationId === 'string' ? parseInt(subOrganizationId, 10) : subOrganizationId;

    if (isNaN(subOrgId)) {
      throw new ValidationError('Invalid subOrganizationId');
    }

    const claims = await getCachedClaims(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      throw new OrganizationAccessDeniedError('No organization memberships found');
    }

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

    if (!subOrgAccessMap.has(subOrgId)) {
      throw new OrganizationAccessDeniedError(
        'You do not have access to this sub-organization'
      );
    }

    const accessInfo = subOrgAccessMap.get(subOrgId);

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

    await prisma.user.update({
      where: { workos_user_id: workosUserId },
      data: { sub_organizationId: subOrgId }
    });

    await invalidateClaimsCache(workosUserId);
    await warmClaimsCache(req, workos);

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
});
