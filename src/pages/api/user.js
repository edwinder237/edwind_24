import { WorkOS } from '@workos-inc/node';
import prisma from '../../lib/prisma';
import { createHandler } from '../../lib/api/createHandler';
import { getCurrentOrganization } from '../../lib/session/organizationSession';
import { getOrgSubscription } from '../../lib/features/subscriptionService';
import { getUserPermissions } from '../../lib/auth/permissionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'auth',
  GET: async (req, res) => {
    const userId = req.cookies.workos_user_id;
    const accessToken = req.cookies.workos_access_token;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let jwtPermissions = [];
    if (accessToken) {
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          jwtPermissions = payload.permissions || [];
        }
      } catch (e) {
        console.error('Error decoding stored JWT:', e.message);
      }
    }

    const workosUser = await workos.userManagement.getUser(userId);

    if (!workosUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    let memberships = [];
    let primaryRole = 'User';
    let organizationName = '';

    try {
      const membershipResponse = await workos.userManagement.listOrganizationMemberships({
        userId: workosUser.id
      });
      memberships = membershipResponse.data || [];

      if (memberships.length > 0) {
        const primaryMembership = memberships[0];
        primaryRole = primaryMembership.role?.slug || primaryMembership.role || 'User';
        organizationName = primaryMembership.organizationName || primaryMembership.organization?.name || organizationName;
      }
    } catch (membershipError) {
      console.error('Error fetching memberships:', membershipError);
    }

    let dbUser = null;
    let dbUnavailable = false;
    try {
      dbUser = await prisma.user.findUnique({
        where: { workos_user_id: userId },
        include: {
          sub_organization: {
            include: {
              organization: true
            }
          }
        }
      });
    } catch (dbError) {
      console.error('Error fetching user from database:', dbError);
      dbUnavailable = true;
    }

    if (dbUser && dbUser.isActive === false) {
      res.setHeader('Set-Cookie', [
        'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
        'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
        'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
      ]);
      return res.status(401).json({
        error: 'Your account has been deactivated',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    let currentOrgId = null;
    let currentOrgName = organizationName;
    let currentSubOrgName = dbUser?.sub_organization?.title;
    let currentSubOrgId = dbUser?.sub_organizationId;

    try {
      currentOrgId = await getCurrentOrganization(req);

      if (currentOrgId) {
        const currentOrg = await prisma.organizations.findUnique({
          where: { id: currentOrgId },
          select: {
            id: true,
            title: true,
            workos_org_id: true,
            status: true
          }
        });

        if (currentOrg) {
          if (currentOrg.status === 'inactive') {
            res.setHeader('Set-Cookie', [
              'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
              'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
              'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
            ]);
            return res.status(401).json({
              error: 'Your organization has been deactivated',
              code: 'ORGANIZATION_INACTIVE'
            });
          }

          currentOrgName = currentOrg.title;

          if (currentOrg.workos_org_id && memberships.length > 0) {
            const currentOrgMembership = memberships.find(m =>
              m.organizationId === currentOrg.workos_org_id
            );
            if (currentOrgMembership) {
              primaryRole = currentOrgMembership.role?.slug || currentOrgMembership.role || 'User';
            }
          }

          const subOrgs = await prisma.sub_organizations.findMany({
            where: { organizationId: currentOrgId },
            select: { id: true, title: true }
          });

          if (subOrgs.length > 0) {
            const userSubOrg = subOrgs.find(so => so.id === dbUser?.sub_organizationId);
            if (userSubOrg) {
              currentSubOrgName = userSubOrg.title;
              currentSubOrgId = userSubOrg.id;
            } else {
              currentSubOrgName = subOrgs[0].title;
              currentSubOrgId = subOrgs[0].id;
            }
          } else {
            currentSubOrgName = null;
            currentSubOrgId = null;
          }
        }
      }
    } catch (orgError) {
      console.error('Error fetching current organization:', orgError);
    }

    let subscription = null;
    if (currentOrgId) {
      try {
        const subData = await getOrgSubscription(currentOrgId);
        if (subData) {
          subscription = {
            planId: subData.planId,
            planName: subData.plan?.name || 'Free',
            planFeatures: Array.isArray(subData.plan?.features) ? subData.plan.features : [],
            status: subData.status,
            trialStart: subData.trialStart || null,
            trialEnd: subData.trialEnd || null,
            requiresCheckout: !subData.stripeSubscriptionId
          };
        }
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }
    }

    let dbPermissions = [];
    let appRole = null;
    if (currentOrgId) {
      try {
        const permissionData = await getUserPermissions(userId, currentOrgId, primaryRole);
        dbPermissions = permissionData.permissions || [];
        appRole = permissionData.appRole;
      } catch (permError) {
        console.error('Error fetching user permissions:', permError);
      }
    }

    const allPermissions = [...new Set([...jwtPermissions, ...dbPermissions])];

    const fullUser = {
      id: workosUser.id,
      workos_user_id: workosUser.id,
      email: workosUser.email,
      emailVerified: workosUser.emailVerified,
      firstName: workosUser.firstName,
      lastName: workosUser.lastName,
      name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,
      avatar: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      thumb: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      profilePictureUrl: workosUser.profilePictureUrl,
      role: primaryRole,
      permissions: allPermissions,
      appRole: appRole,
      organizationName: currentOrgName,
      memberships: memberships,
      sub_organizationId: currentSubOrgId,
      subOrganizationName: currentSubOrgName,
      organizationId: currentOrgId || dbUser?.sub_organization?.organization?.id,
      createdAt: workosUser.createdAt,
      updatedAt: workosUser.updatedAt,
      directoryAttributes: {},
      subscription: subscription || (dbUnavailable
        ? { planId: 'unknown', planName: 'Unknown', status: 'unavailable', requiresCheckout: false }
        : { planId: 'essential', planName: 'Essential', status: 'incomplete', requiresCheckout: true }
      ),
      dbUnavailable,
      info: dbUser?.info || {}
    };

    res.status(200).json(fullUser);
  }
});
