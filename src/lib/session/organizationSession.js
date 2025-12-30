/**
 * Organization Session Management
 * Manages current organization context via encrypted cookies
 *
 * Cookie stores: DB organization.id (UUID)
 * Validates: User membership before setting
 * Caching: Uses claimsCache for fast membership lookups
 */

import { serialize, parse } from 'cookie';
import { encrypt, decrypt } from '../crypto/index.js';
import { getCachedClaims } from '../auth/claimsCache.js';
import prisma from '../prisma.js';

const ORG_COOKIE_NAME = 'edwind_current_org';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Get current organization ID from encrypted cookie
 * @param {NextApiRequest} req - Request object
 * @returns {string|null} organization.id (UUID) or null
 */
export async function getCurrentOrganization(req) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const encryptedOrg = cookies[ORG_COOKIE_NAME];

    if (!encryptedOrg) {
      return null;
    }

    // Decrypt cookie data
    const data = decrypt(encryptedOrg);

    if (!data || !data.organizationId) {
      return null;
    }

    return data.organizationId;
  } catch (error) {
    console.error('Error reading organization cookie:', error);
    return null;
  }
}

/**
 * Set current organization in encrypted cookie
 * Validates user has access to the organization before setting
 *
 * @param {NextApiRequest} req - Request object
 * @param {NextApiResponse} res - Response object
 * @param {string} organizationId - DB organization.id (UUID)
 * @param {WorkOS} workos - WorkOS instance
 * @throws {Error} If user doesn't have access to organization
 */
export async function setCurrentOrganization(req, res, organizationId, workos) {
  try {
    // Validate organizationId is provided
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    // Get user claims to verify membership
    const claims = await getCachedClaims(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      throw new Error('User has no organization memberships');
    }

    // Fetch the organization from DB to get workos_org_id
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        workos_org_id: true,
        title: true
      }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Verify user has access to this organization
    const hasAccess = claims.organizations.some(
      org => org.workos_org_id === organization.workos_org_id
    );

    if (!hasAccess) {
      throw new Error('User does not have access to this organization');
    }

    // Encrypt organization data
    const encryptedData = encrypt({
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title,
      setAt: new Date().toISOString()
    });

    // Set cookie
    const cookie = serialize(ORG_COOKIE_NAME, encryptedData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    return {
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title
    };

  } catch (error) {
    console.error('Error setting organization cookie:', error);
    throw error;
  }
}

/**
 * Get user's available organizations from claims
 * Returns list with DB IDs for organization switcher
 *
 * @param {NextApiRequest} req - Request object
 * @param {WorkOS} workos - WorkOS instance
 * @returns {Array<{id: string, workosOrgId: string, title: string, role: string}>}
 */
export async function getUserOrganizations(req, workos) {
  try {
    // Get user claims
    const claims = await getCachedClaims(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      return [];
    }

    // Get WorkOS org IDs from claims
    const workosOrgIds = claims.organizations.map(org => org.workos_org_id);

    // Fetch corresponding DB organizations
    const organizations = await prisma.organizations.findMany({
      where: {
        workos_org_id: {
          in: workosOrgIds
        }
      },
      select: {
        id: true,
        workos_org_id: true,
        title: true
      }
    });

    // Merge with role information from claims
    return organizations.map(org => {
      const claimOrg = claims.organizations.find(
        co => co.workos_org_id === org.workos_org_id
      );

      return {
        id: org.id,
        workosOrgId: org.workos_org_id,
        title: org.title,
        role: claimOrg?.role || 'Member'
      };
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
}

/**
 * Clear organization cookie (on logout or org access revoked)
 * @param {NextApiResponse} res - Response object
 */
export function clearOrganizationCookie(res) {
  const cookie = serialize(ORG_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  res.setHeader('Set-Cookie', cookie);
}

/**
 * Get full organization context with sub-organizations
 * Used by middleware to build req.orgContext
 *
 * @param {string} organizationId - DB organization.id
 * @returns {Object} Full org context with sub-org IDs
 */
export async function getOrganizationContext(organizationId) {
  try {
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        workos_org_id: true,
        title: true
      }
    });

    if (!organization) {
      return null;
    }

    // Get all sub-organizations for this organization
    const subOrganizations = await prisma.sub_organizations.findMany({
      where: { organizationId: organizationId },
      select: {
        id: true,
        title: true
      }
    });

    const subOrganizationIds = subOrganizations.map(so => so.id);

    return {
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title,
      subOrganizationIds
    };

  } catch (error) {
    console.error('Error fetching organization context:', error);
    return null;
  }
}
