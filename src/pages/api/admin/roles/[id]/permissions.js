import { parse } from 'cookie';
import prisma from '../../../../../lib/prisma';
import { getCurrentOrganization } from '../../../../../lib/session/organizationSession';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

/**
 * Verify admin access
 */
async function verifyAdmin(req) {
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

  return { user: currentUser, organizationId: currentOrgId };
}

/**
 * GET /api/admin/roles/[id]/permissions
 * Returns role with all permissions and organization-specific overrides
 *
 * PUT /api/admin/roles/[id]/permissions
 * Updates organization-specific permission overrides
 */
export default async function handler(req, res) {
  try {
    const adminCheck = await verifyAdmin(req);
    if (adminCheck.error) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { user: currentUser, organizationId } = adminCheck;
    const { id: roleId } = req.query;

    // Get the role
    const role = await prisma.system_roles.findUnique({
      where: { id: parseInt(roleId, 10) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(res, role, organizationId);
      case 'PUT':
        return handlePut(req, res, role, organizationId, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in role permissions endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * GET - Get role with permissions and org overrides
 */
async function handleGet(res, role, organizationId) {
  // Get all permissions grouped by category
  const allPermissions = await prisma.permissions.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });

  // Get default role permissions
  const rolePermissions = await prisma.role_permissions.findMany({
    where: { roleId: role.id },
    select: { permissionId: true }
  });
  const defaultPermissionIds = new Set(rolePermissions.map(rp => rp.permissionId));

  // Get organization-specific overrides
  const orgOverrides = await prisma.organization_role_overrides.findMany({
    where: {
      organizationId,
      roleId: role.id
    }
  });
  const overrideMap = Object.fromEntries(
    orgOverrides.map(o => [o.permissionId, o.isEnabled])
  );

  // Build permissions list with effective state
  const permissionsByCategory = {};

  for (const perm of allPermissions) {
    if (!permissionsByCategory[perm.category]) {
      permissionsByCategory[perm.category] = [];
    }

    // Determine effective permission state
    const hasDefault = defaultPermissionIds.has(perm.id);
    const hasOverride = overrideMap.hasOwnProperty(perm.id);
    const overrideValue = overrideMap[perm.id];

    // Effective = override if exists, otherwise default
    const isEnabled = hasOverride ? overrideValue : hasDefault;

    permissionsByCategory[perm.category].push({
      id: perm.id,
      key: perm.key,
      name: perm.name,
      description: perm.description,
      resource: perm.resource,
      action: perm.action,
      scope: perm.scope,
      // Permission states
      isDefault: hasDefault,
      hasOverride: hasOverride,
      isEnabled: isEnabled
    });
  }

  return res.status(200).json({
    role: {
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      hierarchyLevel: role.hierarchyLevel
    },
    permissionsByCategory,
    overrideCount: orgOverrides.length
  });
}

/**
 * PUT - Update organization-specific permission overrides
 * Body: { permissionId: number, isEnabled: boolean } or { overrides: [{ permissionId, isEnabled }] }
 */
async function handlePut(req, res, role, organizationId, userId) {
  const { permissionId, isEnabled, overrides } = req.body;

  // Handle bulk updates
  if (overrides && Array.isArray(overrides)) {
    const results = [];

    for (const override of overrides) {
      const result = await updateOverride(
        organizationId,
        role.id,
        override.permissionId,
        override.isEnabled,
        userId
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

  const result = await updateOverride(organizationId, role.id, permissionId, isEnabled, userId);

  return res.status(200).json({
    success: true,
    message: result.action === 'removed'
      ? 'Override removed (using default)'
      : `Permission ${isEnabled ? 'enabled' : 'disabled'} for this organization`,
    result
  });
}

/**
 * Update or remove a permission override
 */
async function updateOverride(organizationId, roleId, permissionId, isEnabled, userId) {
  // Check if permission exists
  const permission = await prisma.permissions.findUnique({
    where: { id: parseInt(permissionId, 10) }
  });

  if (!permission) {
    return { error: 'Permission not found', permissionId };
  }

  // Check if this is the default state - if so, remove override
  const defaultPerm = await prisma.role_permissions.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId: permission.id
      }
    }
  });

  const isDefault = !!defaultPerm;

  // If setting to default state, remove the override
  if (isEnabled === isDefault) {
    await prisma.organization_role_overrides.deleteMany({
      where: {
        organizationId,
        roleId,
        permissionId: permission.id
      }
    });

    return {
      action: 'removed',
      permissionId: permission.id,
      permissionKey: permission.key,
      isEnabled,
      isDefault: true
    };
  }

  // Otherwise, create/update override
  const override = await prisma.organization_role_overrides.upsert({
    where: {
      organizationId_roleId_permissionId: {
        organizationId,
        roleId,
        permissionId: permission.id
      }
    },
    update: {
      isEnabled,
      updatedBy: userId
    },
    create: {
      organizationId,
      roleId,
      permissionId: permission.id,
      isEnabled,
      updatedBy: userId
    }
  });

  return {
    action: 'updated',
    permissionId: permission.id,
    permissionKey: permission.key,
    isEnabled,
    isDefault: false,
    overrideId: override.id
  };
}
