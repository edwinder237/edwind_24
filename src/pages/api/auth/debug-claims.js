import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import { getClaimsFromRequest } from '../../../lib/auth/claimsManager';
import { getStatus } from '../../../lib/auth/cache';
import prisma from '../../../lib/prisma';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default createHandler({
  scope: 'admin',
  GET: async (req, res) => {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({
        authenticated: false,
        message: 'Not logged in'
      });
    }

    const claims = await getClaimsFromRequest(req, getWorkOS());

    if (!claims) {
      return res.status(200).json({
        authenticated: true,
        workosUserId,
        claims: null,
        message: 'No claims found - might be first login'
      });
    }

    const cacheStatus = getStatus();

    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      include: {
        sub_organization: {
          include: {
            organization: true
          }
        }
      }
    });

    const workosClient = getWorkOS();
    const { data: memberships } = await workosClient.userManagement.listOrganizationMemberships({
      userId: workosUserId,
      limit: 100
    });

    const primaryMembership = memberships.find(m => m.status === 'active') || memberships[0];
    const organizationName = primaryMembership?.organizationName || primaryMembership?.organization?.name || 'Unknown Organization';
    const primaryRole = primaryMembership?.role?.slug || primaryMembership?.role || 'User';

    let jwtPermissions = [];
    let jwtSource = 'none';
    if (req.cookies.workos_access_token) {
      try {
        const accessToken = req.cookies.workos_access_token;
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          jwtPermissions = payload.permissions || [];
          jwtSource = 'jwt';
        }
      } catch (jwtError) {
      }
    }

    const response = {
      authenticated: true,
      cacheType: cacheStatus.type,
      cacheConnected: cacheStatus.connected,
      user: {
        userId: claims.userId,
        workosUserId: claims.workos_user_id,
        email: claims.email,
        role: primaryRole,
        organizationName: organizationName,
        subOrganizationName: dbUser?.sub_organization?.title
      },
      claimsInfo: {
        issuedAt: new Date(claims.issued_at).toISOString(),
        expiresAt: new Date(claims.expires_at).toISOString(),
        expiresInMinutes: Math.round((claims.expires_at - Date.now()) / 60000)
      },
      jwtPermissions: {
        roleSlug: primaryRole,
        permissions: jwtPermissions,
        permissionCount: jwtPermissions.length,
        source: jwtSource,
        note: 'Permissions are extracted from JWT access token. WorkOS does not provide a direct API to fetch role permissions.'
      },
      organizations: await Promise.all(claims.organizations.map(async (org) => {
        const dbOrg = await prisma.organizations.findUnique({
          where: { id: org.orgId },
          select: { title: true }
        });

        let subOrgDetails = [];
        if (org.sub_organizations && org.sub_organizations.length > 0) {
          const subOrgs = await prisma.sub_organizations.findMany({
            where: { id: { in: org.sub_organizations } },
            select: { id: true, title: true }
          });
          subOrgDetails = subOrgs.map(so => ({ id: so.id, title: so.title }));
        }

        return {
          orgId: org.orgId,
          orgTitle: dbOrg?.title || 'Unknown Organization',
          workosOrgId: org.workos_org_id,
          role: org.role,
          status: org.status,
          permissions: org.permissions,
          permissionCount: org.permissions.length,
          subOrganizations: subOrgDetails,
          subOrgCount: subOrgDetails.length
        };
      })),
      summary: {
        totalOrganizations: claims.organizations.length,
        totalPermissions: [...new Set(claims.organizations.flatMap(o => o.permissions))].length,
        totalSubOrganizations: [...new Set(claims.organizations.flatMap(o => o.sub_organizations || []))].length,
        roles: [...new Set(claims.organizations.map(o => o.role))],
        jwtPermissionCount: jwtPermissions.length
      }
    };

    res.status(200).json(response);
  }
});
