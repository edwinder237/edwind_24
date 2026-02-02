import { parse } from 'cookie';
import prisma from '../../../../../lib/prisma';
import { getCurrentOrganization, getOrganizationContext } from '../../../../../lib/session/organizationSession';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

/**
 * Verify admin access and get organization context
 */
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

  return { user: currentUser, orgContext, currentOrgId };
}

/**
 * GET /api/admin/users/[id]/app-role - Get user's application role
 * PUT /api/admin/users/[id]/app-role - Update user's application role
 */
export default async function handler(req, res) {
  try {
    // Verify admin access and get organization context
    const adminCheck = await verifyAdminAndOrgAccess(req);
    if (adminCheck.error) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { user: currentUser, orgContext, currentOrgId } = adminCheck;
    const { id: userId } = req.query;

    // Verify the target user belongs to admin's organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, sub_organizationId: true, email: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!orgContext.subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(res, userId, currentOrgId);
      case 'PUT':
        return handlePut(req, res, userId, currentOrgId, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in app-role endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * GET - Get user's current application role
 */
async function handleGet(res, userId, organizationId) {
  const assignment = await prisma.user_role_assignments.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    },
    include: {
      role: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          hierarchyLevel: true
        }
      }
    }
  });

  return res.status(200).json({
    appRole: assignment?.role || null,
    assignedAt: assignment?.assignedAt || null
  });
}

/**
 * PUT - Update user's application role
 */
async function handlePut(req, res, userId, organizationId, assignedBy) {
  const { roleId } = req.body;

  // If roleId is null/empty, remove the assignment
  if (!roleId) {
    await prisma.user_role_assignments.deleteMany({
      where: {
        userId,
        organizationId
      }
    });

    console.log(`Removed app role assignment for user ${userId}`);
    return res.status(200).json({
      success: true,
      message: 'Role assignment removed',
      appRole: null
    });
  }

  // Verify the role exists
  const role = await prisma.system_roles.findUnique({
    where: { id: parseInt(roleId, 10) }
  });

  if (!role) {
    return res.status(400).json({ error: 'Invalid role ID' });
  }

  // Upsert the role assignment
  const assignment = await prisma.user_role_assignments.upsert({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    },
    update: {
      roleId: role.id,
      assignedBy,
      isActive: true
    },
    create: {
      userId,
      organizationId,
      roleId: role.id,
      assignedBy,
      isActive: true
    },
    include: {
      role: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          hierarchyLevel: true
        }
      }
    }
  });

  console.log(`Updated app role for user ${userId} to ${role.name}`);

  return res.status(200).json({
    success: true,
    message: `Role updated to ${role.name}`,
    appRole: assignment.role,
    assignedAt: assignment.assignedAt
  });
}
