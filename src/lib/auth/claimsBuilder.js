/**
 * Claims Builder
 *
 * Builds user permission claims from WorkOS memberships and local database state.
 * This is the core function that maps WorkOS data to our application's permission model.
 */

import { PrismaClient } from '@prisma/client';
import { mapRoleToPermissions } from './policyMap.js';
import { createEmptyClaims, CLAIMS_CONFIG } from './claims.js';

const prisma = new PrismaClient();

/**
 * Builds complete user claims from WorkOS memberships
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {Array} workOSMemberships - Array of WorkOS organization memberships
 * @param {Array} jwtPermissions - Permissions from JWT access token (optional)
 * @returns {Promise<UserClaims>} Complete claims object
 */
export async function buildUserClaims(workosUserId, workOSMemberships, jwtPermissions = []) {
  try {
    // 1. Get user from local database
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        sub_organizationId: true
      }
    });

    if (!dbUser) {
      console.warn(`User not found in database for WorkOS user: ${workosUserId}`);
      return null;
    }

    // 2. Create base claims structure
    const claims = createEmptyClaims(dbUser.id, workosUserId, dbUser.email);

    // 3. Process each WorkOS organization membership with JWT permissions
    const organizationClaims = await Promise.all(
      workOSMemberships.map(membership =>
        processOrganizationMembership(dbUser, membership, jwtPermissions)
      )
    );

    // 4. Filter out any null results and add to claims
    claims.organizations = organizationClaims.filter(org => org !== null);

    return claims;
  } catch (error) {
    console.error('Error building user claims:', error);
    throw error;
  }
}

/**
 * Processes a single WorkOS organization membership into a claim
 *
 * @param {Object} dbUser - User from database
 * @param {Object} workOSMembership - WorkOS membership object
 * @param {Array} jwtPermissions - Permissions from JWT access token
 * @returns {Promise<OrganizationClaim|null>} Organization claim or null if org not found
 */
async function processOrganizationMembership(dbUser, workOSMembership, jwtPermissions = []) {
  try {
    // Normalize role - WorkOS returns role as an object {slug: "admin"} or string
    const role = typeof workOSMembership.role === 'object' ? workOSMembership.role.slug : workOSMembership.role;

    // 1. Find the local organization by WorkOS org ID
    const organization = await prisma.organizations.findUnique({
      where: { workos_org_id: workOSMembership.organizationId },
      include: {
        sub_organizations: true
      }
    });

    if (!organization) {
      console.warn(`Organization not found for WorkOS org: ${workOSMembership.organizationId}`);
      return null;
    }

    // 2. Use JWT permissions if available, otherwise fall back to policyMap
    let permissions;
    if (jwtPermissions && jwtPermissions.length > 0) {
      permissions = jwtPermissions;
      console.log(`✅ Using ${jwtPermissions.length} permissions from WorkOS JWT for role: ${role}`);
    } else {
      // Fallback to local policyMap
      permissions = mapRoleToPermissions(role);
      console.log(`⚠️  No JWT permissions, using ${permissions.length} permissions from policyMap for role: ${role}`);
    }

    // 3. Determine accessible sub_organizations
    const accessibleSubOrgs = await getAccessibleSubOrganizations(
      dbUser,
      organization,
      role
    );

    // 4. Build organization claim
    return {
      orgId: organization.id,
      workos_org_id: workOSMembership.organizationId,
      workos_membership_id: workOSMembership.id,
      role: role,
      permissions,
      sub_organizations: accessibleSubOrgs,
      status: workOSMembership.status || 'active'
    };
  } catch (error) {
    console.error('Error processing organization membership:', error);
    return null;
  }
}

/**
 * Determines which sub_organizations a user can access based on their role
 *
 * @param {Object} dbUser - User from database
 * @param {Object} organization - Organization with sub_organizations included
 * @param {string} role - User's role in the organization
 * @returns {Promise<number[]>} Array of accessible sub_organization IDs
 */
async function getAccessibleSubOrganizations(dbUser, organization, role) {
  // Normalize role for comparison
  const normalizedRole = (role || '').toLowerCase().trim();
  const adminRoles = ['admin', 'organization admin', 'org admin', 'org-admin', 'owner', 'administrator'];

  // Admin roles get access to ALL sub_organizations
  if (adminRoles.includes(normalizedRole)) {
    // Get all sub_organizations under this organization
    const allSubOrgs = await prisma.sub_organizations.findMany({
      where: { organizationId: organization.id },
      select: { id: true }
    });
    return allSubOrgs.map(subOrg => subOrg.id);
  }

  // For other roles, return specific sub_organizations they're assigned to
  // This could be based on:
  // 1. User's primary sub_organizationId
  // 2. Additional sub_org assignments (if you add a many-to-many table later)
  // 3. Project-based access

  const accessibleSubOrgs = [];

  // Add user's primary sub_organization if it belongs to this org
  if (dbUser.sub_organizationId) {
    const userSubOrg = await prisma.sub_organizations.findFirst({
      where: {
        id: dbUser.sub_organizationId,
        organizationId: organization.id
      }
    });

    if (userSubOrg) {
      accessibleSubOrgs.push(userSubOrg.id);
    }
  }

  // TODO: Add logic for additional sub_org access based on:
  // - Project assignments
  // - Instructor assignments
  // - Explicit sub_org memberships (if you add that table)

  return accessibleSubOrgs;
}

/**
 * Rebuilds claims for a user by fetching fresh data from WorkOS
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {Object} workosClient - WorkOS SDK client instance
 * @param {Object} req - Request object to extract JWT from cookies (optional)
 * @returns {Promise<UserClaims>} Rebuilt claims
 */
export async function rebuildClaimsFromWorkOS(workosUserId, workosClient, req = null) {
  try {
    // Fetch fresh memberships from WorkOS API
    const memberships = await workosClient.userManagement.listOrganizationMemberships({
      userId: workosUserId
    });

    // Try to extract JWT permissions from stored access token
    let jwtPermissions = [];
    if (req && req.cookies && req.cookies.workos_access_token) {
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

    // Build claims from fresh data with JWT permissions
    const claims = await buildUserClaims(workosUserId, memberships.data, jwtPermissions);

    // Sync memberships to database cache
    await syncMembershipsToDatabase(workosUserId, memberships.data);

    return claims;
  } catch (error) {
    console.error('Error rebuilding claims from WorkOS:', error);
    throw error;
  }
}

/**
 * Syncs WorkOS organization memberships to local database cache
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {Array} workOSMemberships - Array of WorkOS memberships
 * @returns {Promise<void>}
 */
export async function syncMembershipsToDatabase(workosUserId, workOSMemberships) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId }
    });

    if (!dbUser) {
      console.warn(`Cannot sync memberships: User not found for ${workosUserId}`);
      return;
    }

    // Process each membership
    for (const membership of workOSMemberships) {
      // Find the local organization
      const organization = await prisma.organizations.findUnique({
        where: { workos_org_id: membership.organizationId }
      });

      if (!organization) {
        console.warn(`Cannot sync membership: Organization not found for ${membership.organizationId}`);
        continue;
      }

      // Check if membership exists by either workos_membership_id OR userId+organizationId
      const existingMembership = await prisma.organization_memberships.findFirst({
        where: {
          OR: [
            { workos_membership_id: membership.id },
            {
              userId: dbUser.id,
              organizationId: organization.id
            }
          ]
        }
      });

      if (existingMembership) {
        // Update existing membership
        await prisma.organization_memberships.update({
          where: { id: existingMembership.id },
          data: {
            workos_membership_id: membership.id,
            workos_role: typeof membership.role === 'object' ? membership.role.slug : membership.role,
            status: membership.status || 'active',
            cached_at: new Date()
          }
        });
      } else {
        // Create new membership
        await prisma.organization_memberships.create({
          data: {
            workos_membership_id: membership.id,
            userId: dbUser.id,
            organizationId: organization.id,
            workos_role: typeof membership.role === 'object' ? membership.role.slug : membership.role,
            status: membership.status || 'active',
            cached_at: new Date()
          }
        });
      }
    }

    // Mark any memberships not in WorkOS as inactive
    const workOSMembershipIds = workOSMemberships.map(m => m.id);
    await prisma.organization_memberships.updateMany({
      where: {
        userId: dbUser.id,
        workos_membership_id: {
          notIn: workOSMembershipIds
        },
        status: 'active'
      },
      data: {
        status: 'inactive'
      }
    });

    console.log(`Synced ${workOSMemberships.length} memberships for user ${dbUser.email}`);
  } catch (error) {
    console.error('Error syncing memberships to database:', error);
    throw error;
  }
}

/**
 * Gets user's organization memberships from database cache
 * Useful for displaying user's orgs without calling WorkOS API
 *
 * @param {string} userId - Local database user ID
 * @returns {Promise<Array>} Array of cached memberships
 */
export async function getCachedMemberships(userId) {
  try {
    const memberships = await prisma.organization_memberships.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        organization: {
          select: {
            id: true,
            workos_org_id: true,
            title: true,
            logo_url: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return memberships;
  } catch (error) {
    console.error('Error getting cached memberships:', error);
    return [];
  }
}

/**
 * Cleanup function to close Prisma connection
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Export main functions
 */
export default {
  buildUserClaims,
  rebuildClaimsFromWorkOS,
  syncMembershipsToDatabase,
  getCachedMemberships,
  disconnectPrisma
};
