import { WorkOS } from '@workos-inc/node';
import prisma from '../../lib/prisma';
import { getCurrentOrganization } from '../../lib/session/organizationSession';
import { getOrgSubscription } from '../../lib/features/subscriptionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const userId = req.cookies.workos_user_id;
    const accessToken = req.cookies.workos_access_token;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Extract permissions from stored JWT
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

    // Get user from WorkOS User Management API (standard attributes)
    const workosUser = await workos.userManagement.getUser(userId);

    if (!workosUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Fetch user's organization memberships for role information
    let memberships = [];
    let primaryRole = 'User';
    let organizationName = 'EDWIND Learning Solutions';

    try {
      const membershipResponse = await workos.userManagement.listOrganizationMemberships({
        userId: workosUser.id
      });
      memberships = membershipResponse.data || [];

      // Get primary organization role if available
      if (memberships.length > 0) {
        const primaryMembership = memberships[0];
        primaryRole = primaryMembership.role?.slug || primaryMembership.role || 'User';
        organizationName = primaryMembership.organizationName || primaryMembership.organization?.name || organizationName;
      }
    } catch (membershipError) {
      console.error('Error fetching memberships:', membershipError);
    }

    // Get user from local database for additional cached data
    let dbUser = null;
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
    }

    // Get current organization from session cookie (if set)
    // This ensures the user object reflects the currently active organization
    let currentOrgId = null;
    let currentOrgName = organizationName;
    let currentSubOrgName = dbUser?.sub_organization?.title;
    let currentSubOrgId = dbUser?.sub_organizationId;

    try {
      currentOrgId = await getCurrentOrganization(req);

      if (currentOrgId) {
        // Fetch current organization from session
        const currentOrg = await prisma.organizations.findUnique({
          where: { id: currentOrgId },
          select: {
            id: true,
            title: true,
            workos_org_id: true
          }
        });

        if (currentOrg) {
          currentOrgName = currentOrg.title;

          // Find the user's role in the CURRENT organization
          if (currentOrg.workos_org_id && memberships.length > 0) {
            const currentOrgMembership = memberships.find(m =>
              m.organizationId === currentOrg.workos_org_id
            );
            if (currentOrgMembership) {
              primaryRole = currentOrgMembership.role?.slug || currentOrgMembership.role || 'User';
            }
          }

          // Get all sub-organizations for this organization
          const subOrgs = await prisma.sub_organizations.findMany({
            where: { organizationId: currentOrgId },
            select: { id: true, title: true }
          });

          // Use first sub-org as the current one (or the user's assigned one if it exists in this org)
          if (subOrgs.length > 0) {
            const userSubOrg = subOrgs.find(so => so.id === dbUser?.sub_organizationId);
            if (userSubOrg) {
              // User's sub-org exists in this organization
              currentSubOrgName = userSubOrg.title;
              currentSubOrgId = userSubOrg.id;
            } else {
              // User's sub-org not in this org, use first one from current org
              currentSubOrgName = subOrgs[0].title;
              currentSubOrgId = subOrgs[0].id;
            }
          } else {
            // No sub-organizations in this organization - clear the sub-org context
            // Don't inherit from a different organization
            currentSubOrgName = null;
            currentSubOrgId = null;
          }
        }
      }
    } catch (orgError) {
      console.error('Error fetching current organization:', orgError);
      // Fall back to database cached values
    }

    // Get subscription info for current organization
    let subscription = null;
    if (currentOrgId) {
      try {
        const subData = await getOrgSubscription(currentOrgId);
        if (subData) {
          subscription = {
            planId: subData.planId,
            planName: subData.plan?.name || 'Free',
            status: subData.status
          };
        }
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }
    }

    // Construct full user object with WorkOS attributes
    const fullUser = {
      // Core identity
      id: workosUser.id,
      workos_user_id: workosUser.id,
      email: workosUser.email,
      emailVerified: workosUser.emailVerified,

      // Name attributes
      firstName: workosUser.firstName,
      lastName: workosUser.lastName,
      name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,

      // Profile
      avatar: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      thumb: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      profilePictureUrl: workosUser.profilePictureUrl,

      // Role and organization (from WorkOS memberships)
      role: primaryRole,
      permissions: jwtPermissions, // WorkOS JWT permissions for menu/feature gating
      organizationName: currentOrgName, // Use current organization name from session
      memberships: memberships,

      // Current organization context (from session cookie)
      sub_organizationId: currentSubOrgId,
      subOrganizationName: currentSubOrgName,
      organizationId: currentOrgId || dbUser?.sub_organization?.organization?.id,

      // WorkOS metadata
      createdAt: workosUser.createdAt,
      updatedAt: workosUser.updatedAt,

      // Directory Sync attributes (if available from Directory User)
      // These would be populated if the user comes from a directory provider
      directoryAttributes: {
        // These fields are available when user is synced from directory
        // We'll add them in the next step when enhancing directory sync
      },

      // Subscription info for current organization
      subscription: subscription || { planId: 'free', planName: 'Free', status: 'active' }
    };

    res.status(200).json(fullUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
}