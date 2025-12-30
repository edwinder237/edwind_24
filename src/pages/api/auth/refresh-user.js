/**
 * Manual WorkOS User Refresh Endpoint
 *
 * Allows users to manually sync their profile and permissions from WorkOS:
 * 1. Fetches fresh user data from WorkOS User Management API
 * 2. Fetches fresh organization memberships
 * 3. Updates local database with latest WorkOS data
 * 4. Invalidates claims cache
 * 5. Rebuilds and caches fresh claims
 * 6. Returns updated user object
 */

import { WorkOS } from '@workos-inc/node';
import prisma from '../../../lib/prisma';
import { invalidateClaims, buildAndCacheClaims } from '../../../lib/auth/claimsManager';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const workosUserId = req.cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    console.log(`🔄 Manual refresh requested for user: ${workosUserId}`);

    const workosClient = getWorkOS();

    // Step 1: Fetch fresh user profile from WorkOS
    console.log('📥 Fetching fresh user profile from WorkOS...');
    const workosUser = await workosClient.userManagement.getUser(workosUserId);

    if (!workosUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in WorkOS'
      });
    }

    // Step 2: Fetch fresh organization memberships
    console.log('📥 Fetching fresh organization memberships from WorkOS...');
    const { data: memberships } = await workosClient.userManagement.listOrganizationMemberships({
      userId: workosUserId,
      limit: 100
    });

    // Step 3: Update local database user record
    console.log('💾 Updating local database with fresh WorkOS data...');
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
      console.log('✅ Local database updated successfully');
    }

    // Step 4: Extract JWT permissions from stored access token
    let jwtPermissions = [];
    if (req.cookies.workos_access_token) {
      try {
        const accessToken = req.cookies.workos_access_token;
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          jwtPermissions = payload.permissions || [];
          if (jwtPermissions.length > 0) {
            console.log(`✅ Extracted ${jwtPermissions.length} permissions from stored JWT`);
          }
        }
      } catch (jwtError) {
        console.warn('Could not extract permissions from JWT:', jwtError.message);
      }
    }

    // Step 5: Invalidate old claims cache
    console.log('🗑️  Invalidating old claims cache...');
    await invalidateClaims(workosUserId);

    // Step 6: Rebuild and cache fresh claims with JWT permissions
    console.log('🔨 Building and caching fresh claims...');
    await buildAndCacheClaims(workosUserId, memberships, jwtPermissions);

    // Step 7: Get primary organization and role
    const primaryMembership = memberships.find(m => m.status === 'active') || memberships[0];
    const primaryRole = primaryMembership?.role?.slug || 'member';
    const organizationName = primaryMembership?.organizationName || primaryMembership?.organization?.name || 'Unknown Organization';

    // Step 8: Build complete refreshed user object
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

    console.log(`✅ Refresh complete for user: ${workosUserId}`);

    res.status(200).json({
      success: true,
      message: 'Successfully synced with WorkOS',
      user: refreshedUser,
      stats: {
        membershipsCount: memberships.length,
        refreshedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error refreshing user from WorkOS:', error);

    // Provide specific error messages for different scenarios
    let errorMessage = 'Failed to sync with WorkOS';

    if (error.message?.includes('API')) {
      errorMessage = 'WorkOS API is temporarily unavailable';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error connecting to WorkOS';
    } else if (error.message?.includes('database')) {
      errorMessage = 'Database error during sync';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
