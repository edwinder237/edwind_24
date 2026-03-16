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
    include: { organization_memberships: true }
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

  const currentOrgId = await getCurrentOrganization(req);
  if (!currentOrgId) {
    return { error: 'No organization selected', status: 400 };
  }

  const orgContext = await getOrganizationContext(currentOrgId);
  if (!orgContext) {
    return { error: 'Organization not found', status: 400 };
  }

  return { user: currentUser, orgContext, currentOrgId };
}

/**
 * GET /api/admin/users/[id]/permissions - Get user's permissions with all layers
 * PUT /api/admin/users/[id]/permissions - Update user-specific permission overrides
 */
export default async function handler(req, res) {
  try {
    const adminCheck = await verifyAdminAndOrgAccess(req);
    if (adminCheck.error) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { user: currentUser, orgContext, currentOrgId } = adminCheck;
    const { id: userId } = req.query;

    // Verify target user exists and belongs to admin's organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, sub_organizationId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!orgContext.subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(res, targetUser, currentOrgId);
      case 'PUT':
        return handlePut(req, res, targetUser, currentOrgId, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in user permissions endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * GET - Get user's permissions with role defaults, org overrides, and user overrides
 */
async function handleGet(res, targetUser, organizationId) {
  // Get all active permissions
  const allPermissions = await prisma.permissions.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });

  // Get user's role assignment for this org
  const roleAssignment = await prisma.user_role_assignments.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUser.id,
        organizationId
      }
    },
    include: { role: true }
  });

  // Get role default permissions
  let defaultPermissionIds = new Set();
  if (roleAssignment) {
    const rolePerms = await prisma.role_permissions.findMany({
      where: { roleId: roleAssignment.roleId },
      select: { permissionId: true }
    });
    defaultPermissionIds = new Set(rolePerms.map(rp => rp.permissionId));
  }

  // Get org-level overrides for this role
  let orgOverrideMap = {};
  if (roleAssignment) {
    const orgOverrides = await prisma.organization_role_overrides.findMany({
      where: { organizationId, roleId: roleAssignment.roleId }
    });
    orgOverrideMap = Object.fromEntries(
      orgOverrides.map(o => [o.permissionId, o.isEnabled])
    );
  }

  // Get user-specific overrides
  const userOverrides = await prisma.user_permission_overrides.findMany({
    where: { userId: targetUser.id, organizationId }
  });
  const userOverrideMap = Object.fromEntries(
    userOverrides.map(o => [o.permissionId, o.isEnabled])
  );

  // Build permissions by category
  const permissionsByCategory = {};
  for (const perm of allPermissions) {
    if (!permissionsByCategory[perm.category]) {
      permissionsByCategory[perm.category] = [];
    }

    const isRoleDefault = defaultPermissionIds.has(perm.id);
    const hasOrgOverride = orgOverrideMap.hasOwnProperty(perm.id);
    const hasUserOverride = userOverrideMap.hasOwnProperty(perm.id);

    // Effective value from role + org (the baseline)
    const effectiveFromRole = hasOrgOverride ? orgOverrideMap[perm.id] : isRoleDefault;

    // Final effective value including user override
    const isEnabled = hasUserOverride ? userOverrideMap[perm.id] : effectiveFromRole;

    permissionsByCategory[perm.category].push({
      id: perm.id,
      key: perm.key,
      name: perm.name,
      description: perm.description,
      resource: perm.resource,
      action: perm.action,
      scope: perm.scope,
      isRoleDefault,
      hasOrgOverride,
      hasUserOverride,
      effectiveFromRole,
      isEnabled
    });
  }

  return res.status(200).json({
    user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
    role: roleAssignment?.role || null,
    permissionsByCategory,
    userOverrideCount: userOverrides.length
  });
}

/**
 * PUT - Update user-specific permission overrides
 * Body: { permissionId, isEnabled } or { overrides: [{ permissionId, isEnabled }] }
 */
async function handlePut(req, res, targetUser, organizationId, adminUserId) {
  const { permissionId, isEnabled, overrides } = req.body;

  // Handle bulk updates
  if (overrides && Array.isArray(overrides)) {
    const results = [];
    for (const override of overrides) {
      const result = await updateUserOverride(
        targetUser.id, organizationId,
        override.permissionId, override.isEnabled,
        adminUserId
      );
      results.push(result);
    }
    return res.status(200).json({
      success: true,
      message: `Updated ${results.length} permission overrides`,
      results
    });
  }

  // Handle single update
  if (permissionId === undefined || isEnabled === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: permissionId and isEnabled'
    });
  }

  const result = await updateUserOverride(
    targetUser.id, organizationId,
    permissionId, isEnabled, adminUserId
  );

  return res.status(200).json({ success: true, result });
}

/**
 * Update or remove a user permission override.
 * Removes the override if setting to the effective role+org value (smart cleanup).
 */
async function updateUserOverride(userId, organizationId, permissionId, isEnabled, adminUserId) {
  const permission = await prisma.permissions.findUnique({
    where: { id: parseInt(permissionId, 10) }
  });

  if (!permission) {
    return { error: 'Permission not found', permissionId };
  }

  // Compute what role+org would give this user
  const roleAssignment = await prisma.user_role_assignments.findUnique({
    where: { userId_organizationId: { userId, organizationId } }
  });

  let effectiveFromRole = false;
  if (roleAssignment) {
    const roleDefault = await prisma.role_permissions.findUnique({
      where: { roleId_permissionId: { roleId: roleAssignment.roleId, permissionId: permission.id } }
    });
    const orgOverride = await prisma.organization_role_overrides.findFirst({
      where: { organizationId, roleId: roleAssignment.roleId, permissionId: permission.id }
    });
    effectiveFromRole = orgOverride ? orgOverride.isEnabled : !!roleDefault;
  }

  // If setting to the role+org effective value, remove the user override
  if (isEnabled === effectiveFromRole) {
    await prisma.user_permission_overrides.deleteMany({
      where: { userId, organizationId, permissionId: permission.id }
    });
    return {
      action: 'removed',
      permissionId: permission.id,
      permissionKey: permission.key,
      isEnabled,
      isDefault: true
    };
  }

  // Otherwise, upsert the user override
  await prisma.user_permission_overrides.upsert({
    where: {
      userId_organizationId_permissionId: {
        userId, organizationId, permissionId: permission.id
      }
    },
    update: { isEnabled, updatedBy: adminUserId },
    create: {
      userId, organizationId,
      permissionId: permission.id,
      isEnabled,
      updatedBy: adminUserId
    }
  });

  return {
    action: 'updated',
    permissionId: permission.id,
    permissionKey: permission.key,
    isEnabled,
    isDefault: false
  };
}
