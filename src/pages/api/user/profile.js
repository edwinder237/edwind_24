import { WorkOS } from '@workos-inc/node';
import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { getCurrentOrganization } from '../../../lib/session/organizationSession';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

function checkAuth(req, res) {
  const userId = req.cookies.workos_user_id;
  if (!userId || userId === 'undefined' || userId === 'null') {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return userId;
}

export default createHandler({
  scope: 'auth',
  GET: async (req, res) => {
    const userId = checkAuth(req, res);
    if (!userId) return;

    const workosUser = await workos.userManagement.getUser(userId);
    if (!workosUser) {
      return res.status(404).json({ error: 'User not found in WorkOS' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: userId },
      include: {
        sub_organization: {
          include: {
            organization: true
          }
        }
      }
    });

    let memberships = [];
    let primaryRole = 'User';
    let organizationName = '';

    try {
      const membershipResponse = await workos.userManagement.listOrganizationMemberships({
        userId: workosUser.id
      });
      memberships = membershipResponse.data || [];

      if (memberships.length > 0) {
        primaryRole = memberships[0].role?.slug || memberships[0].role || 'User';
        organizationName = memberships[0].organizationName || memberships[0].organization?.name || '';
      }
    } catch (membershipError) {
      console.error('Error fetching memberships:', membershipError);
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
          select: { id: true, title: true, workos_org_id: true }
        });
        if (currentOrg) {
          currentOrgName = currentOrg.title;

          if (currentOrg.workos_org_id && memberships.length > 0) {
            const currentOrgMembership = memberships.find(m => m.organizationId === currentOrg.workos_org_id);
            if (currentOrgMembership) {
              primaryRole = currentOrgMembership.role?.slug || currentOrgMembership.role || 'User';
            }
          }
        }
      }
    } catch (orgError) {
      console.error('Error fetching current organization:', orgError);
    }

    let subscription = null;
    let usage = null;

    if (currentOrgId) {
      try {
        subscription = await getOrgSubscription(currentOrgId);
        usage = await getResourceUsage(currentOrgId);
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }
    }

    const profileInfo = dbUser?.info || {};

    const profile = {
      id: workosUser.id,
      workos_user_id: workosUser.id,
      email: workosUser.email,
      emailVerified: workosUser.emailVerified,
      firstName: workosUser.firstName || '',
      lastName: workosUser.lastName || '',
      name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,
      avatar: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      profilePictureUrl: workosUser.profilePictureUrl,
      role: primaryRole,
      organizationId: currentOrgId,
      organizationName: currentOrgName,
      sub_organizationId: currentSubOrgId,
      subOrganizationName: currentSubOrgName,
      memberships: memberships,
      phone: profileInfo.phone || '',
      countryCode: profileInfo.countryCode || '+1',
      timezone: profileInfo.timezone || 'America/New_York',
      designation: profileInfo.designation || '',
      skills: profileInfo.skills || [],
      bio: profileInfo.bio || '',
      notificationSettings: profileInfo.notifications || {
        orderConfirmation: true,
        languageChange: true,
        emailOnProjectUpdate: true,
        emailOnNewParticipant: true
      },
      subscription: subscription ? {
        planId: subscription.planId,
        planName: subscription.plan?.name || 'Free',
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialStart: subscription.trialStart || null,
        trialEnd: subscription.trialEnd || null,
        resourceLimits: subscription.customLimits || subscription.plan?.resourceLimits || {},
        features: subscription.customFeatures || subscription.plan?.features || []
      } : {
        planId: 'essential',
        planName: 'Essential',
        status: 'active',
        resourceLimits: { maxProjects: 5, maxParticipants: 10, maxCourses: 3, maxCurriculums: 2 },
        features: []
      },
      usage: usage || {
        projects: 0,
        participants: 0,
        courses: 0,
        curriculums: 0
      },
      createdAt: workosUser.createdAt,
      updatedAt: workosUser.updatedAt
    };

    return res.status(200).json(profile);
  },

  PUT: async (req, res) => {
    const userId = checkAuth(req, res);
    if (!userId) return;

    const {
      firstName,
      lastName,
      phone,
      countryCode,
      timezone,
      designation,
      skills,
      bio,
      notificationSettings
    } = req.body;

    if (firstName !== undefined || lastName !== undefined) {
      try {
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping WorkOS update - invalid userId:', userId);
        } else {
          const updateOptions = { userId: userId };
          if (firstName !== undefined) updateOptions.firstName = firstName;
          if (lastName !== undefined) updateOptions.lastName = lastName;
          await workos.userManagement.updateUser(updateOptions);
        }
      } catch (workosError) {
        console.error('Error updating WorkOS user:', workosError);
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { workos_user_id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const existingInfo = existingUser.info || {};
    const updatedInfo = {
      ...existingInfo,
      ...(phone !== undefined && { phone }),
      ...(countryCode !== undefined && { countryCode }),
      ...(timezone !== undefined && { timezone }),
      ...(designation !== undefined && { designation }),
      ...(skills !== undefined && { skills }),
      ...(bio !== undefined && { bio }),
      ...(notificationSettings !== undefined && { notifications: notificationSettings })
    };

    const updatedUser = await prisma.user.update({
      where: { workos_user_id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(firstName !== undefined || lastName !== undefined) && {
          name: `${firstName || existingUser.firstName} ${lastName || existingUser.lastName}`.trim()
        },
        info: updatedInfo,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      updated: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        phone: updatedInfo.phone,
        timezone: updatedInfo.timezone,
        designation: updatedInfo.designation,
        skills: updatedInfo.skills,
        bio: updatedInfo.bio
      }
    });
  }
});
