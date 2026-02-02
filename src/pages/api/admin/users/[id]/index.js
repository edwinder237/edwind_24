import { parse } from 'cookie';
import { WorkOS } from '@workos-inc/node';
import prisma from '../../../../../lib/prisma';
import { getCurrentOrganization, getOrganizationContext } from '../../../../../lib/session/organizationSession';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Revoke all WorkOS sessions for a user
 * This forces immediate logout across all devices
 */
async function revokeUserSessions(workosUserId) {
  if (!workosUserId) return;

  try {
    // List all sessions for this user
    const sessionsResponse = await workos.userManagement.listSessions({
      userId: workosUserId
    });

    const sessions = sessionsResponse.data || [];
    console.log(`🔐 Found ${sessions.length} sessions for user ${workosUserId}`);

    // Revoke each session
    for (const session of sessions) {
      try {
        await workos.userManagement.revokeSession(session.id);
        console.log(`   ✅ Revoked session ${session.id}`);
      } catch (revokeError) {
        console.error(`   ⚠️ Failed to revoke session ${session.id}:`, revokeError.message);
      }
    }

    console.log(`🔐 Completed session revocation for user ${workosUserId}`);
  } catch (error) {
    console.error('Error revoking user sessions:', error.message);
    // Don't throw - session revocation failure shouldn't block deactivation
  }
}

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

async function verifyAdminAndOrgAccess(req) {
  const cookies = parse(req.headers.cookie || '');
  const workosUserId = cookies.workos_user_id;

  if (!workosUserId) {
    return { error: 'Not authenticated', status: 401 };
  }

  const currentUser = await prisma.user.findUnique({
    where: { workos_user_id: workosUserId },
    include: {
      organization_memberships: true
    }
  });

  if (!currentUser) {
    return { error: 'User not found', status: 401 };
  }

  const isAdmin = currentUser.organization_memberships.some(
    membership => ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
  );

  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 };
  }

  // Get current organization
  const currentOrgId = await getCurrentOrganization(req);
  if (!currentOrgId) {
    return { error: 'No organization selected', status: 400 };
  }

  // Get organization context
  const orgContext = await getOrganizationContext(currentOrgId);
  if (!orgContext) {
    return { error: 'Organization not found', status: 400 };
  }

  // Verify admin has access to this organization
  const hasAccessToOrg = currentUser.organization_memberships.some(
    m => m.organizationId === currentOrgId && ADMIN_ROLES.includes(m.workos_role?.toLowerCase())
  );

  if (!hasAccessToOrg) {
    return { error: 'You do not have admin access to this organization', status: 403 };
  }

  return { user: currentUser, orgContext };
}

export default async function handler(req, res) {
  try {
    // Verify admin access and get organization context
    const adminCheck = await verifyAdminAndOrgAccess(req);
    if (adminCheck.error) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { orgContext } = adminCheck;
    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, id, orgContext);
      case 'PUT':
        return handlePut(req, res, id, orgContext);
      case 'DELETE':
        return handleDelete(req, res, id, orgContext);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in user endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// GET - Fetch single user details
async function handleGet(req, res, id, orgContext) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      },
      organization_memberships: {
        include: {
          organization: {
            select: {
              id: true,
              title: true,
              workos_org_id: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify user belongs to admin's organization (by sub-organization)
  if (!orgContext.subOrganizationIds.includes(user.sub_organizationId)) {
    return res.status(403).json({ error: 'User does not belong to your organization' });
  }

  return res.status(200).json({
    id: user.id,
    workos_user_id: user.workos_user_id,
    name: user.name,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    sub_organization: user.sub_organization,
    sub_organizationId: user.sub_organizationId,
    info: user.info,
    organizations: user.organization_memberships.map(m => ({
      id: m.organization.id,
      title: m.organization.title,
      workos_org_id: m.organization.workos_org_id,
      role: m.workos_role,
      status: m.status,
      membershipId: m.workos_membership_id
    }))
  });
}

// PUT - Update user (local fields only: isActive, sub_organizationId)
async function handlePut(req, res, id, orgContext) {
  // First verify the user belongs to admin's organization
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { sub_organizationId: true, workos_user_id: true, isActive: true }
  });

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!orgContext.subOrganizationIds.includes(existingUser.sub_organizationId)) {
    return res.status(403).json({ error: 'User does not belong to your organization' });
  }

  const { isActive, sub_organizationId, firstName, lastName, name } = req.body;

  // Build update data
  const updateData = {};

  if (isActive !== undefined) {
    updateData.isActive = isActive;

    // If deactivating user, revoke their WorkOS sessions immediately
    if (isActive === false && existingUser.isActive === true) {
      await revokeUserSessions(existingUser.workos_user_id);
    }
  }

  if (sub_organizationId !== undefined) {
    // Verify sub-organization exists AND belongs to admin's organization
    if (sub_organizationId !== null) {
      if (!orgContext.subOrganizationIds.includes(sub_organizationId)) {
        return res.status(400).json({ error: 'Sub-organization does not belong to your organization' });
      }
      const subOrg = await prisma.sub_organizations.findUnique({
        where: { id: sub_organizationId }
      });
      if (!subOrg) {
        return res.status(400).json({ error: 'Sub-organization not found' });
      }
    }
    updateData.sub_organizationId = sub_organizationId;
  }

  if (firstName !== undefined) {
    updateData.firstName = firstName;
  }

  if (lastName !== undefined) {
    updateData.lastName = lastName;
  }

  if (name !== undefined) {
    updateData.name = name;
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  console.log(`✅ Updated user ${id}:`, updateData);

  return res.status(200).json({
    success: true,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isActive: updatedUser.isActive,
      sub_organization: updatedUser.sub_organization
    }
  });
}

// DELETE - Deactivate user (soft delete by setting isActive = false)
async function handleDelete(req, res, id, orgContext) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, sub_organizationId: true, workos_user_id: true }
  });

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify user belongs to admin's organization
  if (!orgContext.subOrganizationIds.includes(existingUser.sub_organizationId)) {
    return res.status(403).json({ error: 'User does not belong to your organization' });
  }

  // Revoke all WorkOS sessions for this user immediately
  await revokeUserSessions(existingUser.workos_user_id);

  // Soft delete by setting isActive to false
  const deactivatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  console.log(`✅ Deactivated user ${id}: ${deactivatedUser.email}`);

  return res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    user: {
      id: deactivatedUser.id,
      email: deactivatedUser.email,
      isActive: deactivatedUser.isActive
    }
  });
}
