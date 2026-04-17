import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';
import { invalidateClaims, buildAndCacheClaims } from '../../../lib/auth/claimsManager';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default createHandler({
  scope: 'public',
  POST: async (req, res) => {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const workosClient = getWorkOS();

    const workosUser = await workosClient.userManagement.getUser(workosUserId);

    if (!workosUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in WorkOS'
      });
    }

    const { data: memberships } = await workosClient.userManagement.listOrganizationMemberships({
      userId: workosUserId,
      limit: 100
    });

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

    if (dbUser) {
      await prisma.user.update({
        where: { workos_user_id: workosUserId },
        data: {
          email: workosUser.email,
          name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,
          firstName: workosUser.firstName || '',
          lastName: workosUser.lastName || '',
          image: workosUser.profilePictureUrl || '/assets/images/users/default.png',
          emailVerified: workosUser.emailVerified ? new Date() : null
        }
      });
    }

    let jwtPermissions = [];
    if (req.cookies.workos_access_token) {
      try {
        const accessToken = req.cookies.workos_access_token;
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          jwtPermissions = payload.permissions || [];
        }
      } catch (jwtError) {
      }
    }

    await invalidateClaims(workosUserId);
    await buildAndCacheClaims(workosUserId, memberships, jwtPermissions);

    const primaryMembership = memberships.find(m => m.status === 'active') || memberships[0];
    const primaryRole = primaryMembership?.role?.slug || 'member';
    const organizationName = primaryMembership?.organizationName || primaryMembership?.organization?.name || 'Unknown Organization';

    const refreshedUser = {
      id: workosUser.id,
      workos_user_id: workosUser.id,
      email: workosUser.email,
      emailVerified: workosUser.emailVerified,
      firstName: workosUser.firstName,
      lastName: workosUser.lastName,
      name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,
      avatar: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      role: primaryRole,
      organizationName: organizationName,
      memberships: memberships.map(m => ({
        organizationId: m.organizationId,
        organizationName: m.organizationName || m.organization?.name,
        role: m.role?.slug || m.role,
        status: m.status
      })),
      sub_organizationId: dbUser?.sub_organizationId,
      subOrganizationName: dbUser?.sub_organization?.title,
      organizationId: dbUser?.sub_organization?.organization?.id,
      refreshedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Successfully synced with WorkOS',
      user: refreshedUser,
      stats: {
        membershipsCount: memberships.length,
        refreshedAt: new Date().toISOString()
      }
    });
  }
});
