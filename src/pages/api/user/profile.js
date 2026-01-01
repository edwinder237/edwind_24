/**
 * ============================================
 * USER PROFILE API
 * ============================================
 *
 * GET: Returns combined profile from WorkOS + Database
 * PUT: Updates profile in both WorkOS and Database
 */

import { WorkOS } from '@workos-inc/node';
import prisma from '../../../lib/prisma';
import { getCurrentOrganization } from '../../../lib/session/organizationSession';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  const userId = req.cookies.workos_user_id;

  // Check for missing or invalid user ID (including 'undefined' string)
  if (!userId || userId === 'undefined' || userId === 'null') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else if (req.method === 'PUT') {
    return handlePut(req, res, userId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/user/profile
 * Returns full user profile combining WorkOS + DB + Subscription data
 */
async function handleGet(req, res, userId) {
  try {
    // 1. Get user from WorkOS
    const workosUser = await workos.userManagement.getUser(userId);
    if (!workosUser) {
      return res.status(404).json({ error: 'User not found in WorkOS' });
    }

    // 2. Get user from local database
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

    // 3. Get organization memberships from WorkOS
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

    // 4. Get current organization context
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

          // Find role in current org
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

    // 5. Get subscription and usage data
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

    // 6. Parse profile data from User.info JSON
    const profileInfo = dbUser?.info || {};

    // 7. Construct full profile response
    const profile = {
      // Core identity (from WorkOS)
      id: workosUser.id,
      workos_user_id: workosUser.id,
      email: workosUser.email,
      emailVerified: workosUser.emailVerified,

      // Name (from WorkOS)
      firstName: workosUser.firstName || '',
      lastName: workosUser.lastName || '',
      name: `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email,

      // Profile picture (from WorkOS)
      avatar: workosUser.profilePictureUrl || '/assets/images/users/default.png',
      profilePictureUrl: workosUser.profilePictureUrl,

      // Role and organization (from WorkOS + session)
      role: primaryRole,
      organizationId: currentOrgId,
      organizationName: currentOrgName,
      sub_organizationId: currentSubOrgId,
      subOrganizationName: currentSubOrgName,
      memberships: memberships,

      // Extended profile (from Database User.info)
      phone: profileInfo.phone || '',
      countryCode: profileInfo.countryCode || '+1',
      timezone: profileInfo.timezone || 'America/New_York',
      designation: profileInfo.designation || '',
      skills: profileInfo.skills || [],
      bio: profileInfo.bio || '',

      // Notification settings (from Database User.info)
      notificationSettings: profileInfo.notifications || {
        orderConfirmation: true,
        languageChange: true,
        emailOnProjectUpdate: true,
        emailOnNewParticipant: true
      },

      // Subscription info (from subscription service)
      subscription: subscription ? {
        planId: subscription.planId,
        planName: subscription.plan?.name || 'Free',
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        resourceLimits: subscription.customLimits || subscription.plan?.resourceLimits || {},
        features: subscription.customFeatures || subscription.plan?.features || []
      } : {
        planId: 'free',
        planName: 'Free',
        status: 'active',
        resourceLimits: { maxProjects: 5, maxParticipants: 10, maxCourses: 3, maxCurriculums: 2 },
        features: []
      },

      // Current usage (from subscription service)
      usage: usage || {
        projects: 0,
        participants: 0,
        courses: 0,
        curriculums: 0
      },

      // Metadata (from WorkOS)
      createdAt: workosUser.createdAt,
      updatedAt: workosUser.updatedAt
    };

    return res.status(200).json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
}

/**
 * PUT /api/user/profile
 * Updates user profile in both WorkOS and Database
 */
async function handlePut(req, res, userId) {
  try {
    const {
      // WorkOS fields
      firstName,
      lastName,
      // Database fields (stored in User.info)
      phone,
      countryCode,
      timezone,
      designation,
      skills,
      bio,
      notificationSettings
    } = req.body;

    // 1. Update WorkOS user (only name fields)
    if (firstName !== undefined || lastName !== undefined) {
      try {
        // Double-check userId is valid before calling WorkOS
        if (!userId || userId === 'undefined' || userId === 'null') {
          console.warn('Skipping WorkOS update - invalid userId:', userId);
        } else {
          // WorkOS SDK expects userId as part of the options object
          const updateOptions = {
            userId: userId
          };
          if (firstName !== undefined) updateOptions.firstName = firstName;
          if (lastName !== undefined) updateOptions.lastName = lastName;

          console.log('📤 Updating WorkOS user with options:', JSON.stringify(updateOptions));
          await workos.userManagement.updateUser(updateOptions);
          console.log('✅ Updated WorkOS user:', userId);
        }
      } catch (workosError) {
        console.error('Error updating WorkOS user:', workosError);
        // Continue with DB update even if WorkOS fails
      }
    }

    // 2. Get existing user from database
    const existingUser = await prisma.user.findUnique({
      where: { workos_user_id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // 3. Merge new profile data with existing info
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

    // 4. Update database user
    const updatedUser = await prisma.user.update({
      where: { workos_user_id: userId },
      data: {
        // Update name if provided
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(firstName !== undefined || lastName !== undefined) && {
          name: `${firstName || existingUser.firstName} ${lastName || existingUser.lastName}`.trim()
        },
        // Update info JSON
        info: updatedInfo,
        updatedAt: new Date()
      }
    });

    console.log('✅ Updated database user:', updatedUser.id);

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

  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
}
