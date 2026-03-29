import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import { getCachedClaims, invalidateClaimsCache, warmClaimsCache } from '../../../lib/auth/claimsCache.js';
import { normalizeRole } from '../../../lib/auth/roleNormalization.js';
import { setCurrentOrganization } from '../../../lib/session/organizationSession.js';
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

    const { organizationId } = req.body;

    if (!organizationId) {
      throw new ValidationError('organizationId is required');
    }

    const claims = await getCachedClaims(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      throw new OrganizationAccessDeniedError('No organization memberships found');
    }

    const claimOrg = claims.organizations.find(org => org.orgId === organizationId);

    if (!claimOrg) {
      throw new OrganizationAccessDeniedError(
        'You do not have access to this organization'
      );
    }

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

    const accessibleSubOrgIds = claimOrg.sub_organizations || [];

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

    await prisma.user.update({
      where: { workos_user_id: workosUserId },
      data: {
        sub_organizationId: defaultSubOrg?.id || null
      }
    });

    await setCurrentOrganization(req, res, organizationId, workos);
    await invalidateClaimsCache(workosUserId);
    await warmClaimsCache(req, workos);

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
});
