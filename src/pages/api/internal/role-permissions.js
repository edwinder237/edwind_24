import { parse } from 'cookie';
import prisma from '../../../lib/prisma';

/**
 * Verify owner access (Level 0 only)
 */
async function verifyOwner(req) {
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

  const isOwner = currentUser.organization_memberships.some(
    membership => membership.workos_role?.toLowerCase() === 'owner'
  );

  if (!isOwner) {
    return { error: 'Owner access required', status: 403 };
  }

  return { user: currentUser };
}

/**
 * GET /api/internal/role-permissions
 *   ?roleId=<id>  — returns permissions for a specific role, grouped by category
 *   (no roleId)   — returns all roles with their permission counts
 *
 * PUT /api/internal/role-permissions
 *   Body: { roleId, permissionId, isEnabled }          — toggle one permission
 *   Body: { roleId, updates: [{ permissionId, isEnabled }] } — bulk update
 */
export default async function handler(req, res) {
  try {
    const ownerCheck = await verifyOwner(req);
    if (ownerCheck.error) {
      return res.status(ownerCheck.status).json({ error: ownerCheck.error });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'PUT':
        return handlePut(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in role-permissions endpoint:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function handleGet(req, res) {
  const { roleId } = req.query;

  if (roleId) {
    // Get specific role with permissions grouped by category
    const role = await prisma.system_roles.findUnique({
      where: { id: parseInt(roleId, 10) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Get all permissions
    const allPermissions = await prisma.permissions.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    // Get this role's default permissions
    const rolePerms = await prisma.role_permissions.findMany({
      where: { roleId: role.id },
      select: { permissionId: true }
    });
    const enabledIds = new Set(rolePerms.map(rp => rp.permissionId));

    // Group by category
    const permissionsByCategory = {};
    for (const perm of allPermissions) {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }
      permissionsByCategory[perm.category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        isEnabled: enabledIds.has(perm.id)
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
      totalEnabled: enabledIds.size,
      totalPermissions: allPermissions.length
    });
  }

  // No roleId — return all roles with permission counts
  const roles = await prisma.system_roles.findMany({
    where: { isActive: true },
    orderBy: { hierarchyLevel: 'asc' },
    include: {
      _count: { select: { role_permissions: true } }
    }
  });

  return res.status(200).json({
    roles: roles.map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      hierarchyLevel: r.hierarchyLevel,
      permissionCount: r._count.role_permissions
    }))
  });
}

async function handlePut(req, res) {
  const { roleId, permissionId, isEnabled, updates } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'roleId is required' });
  }

  const role = await prisma.system_roles.findUnique({
    where: { id: parseInt(roleId, 10) }
  });

  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  // Handle bulk updates
  if (updates && Array.isArray(updates)) {
    let added = 0;
    let removed = 0;

    for (const update of updates) {
      const result = await togglePermission(role.id, update.permissionId, update.isEnabled);
      if (result.action === 'added') added++;
      if (result.action === 'removed') removed++;
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updates.length} permissions (${added} added, ${removed} removed)`
    });
  }

  // Handle single update
  if (permissionId === undefined || isEnabled === undefined) {
    return res.status(400).json({ error: 'permissionId and isEnabled are required' });
  }

  const result = await togglePermission(role.id, permissionId, isEnabled);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ success: true, ...result });
}

async function togglePermission(roleId, permissionId, isEnabled) {
  const permission = await prisma.permissions.findUnique({
    where: { id: parseInt(permissionId, 10) }
  });

  if (!permission) {
    return { error: 'Permission not found' };
  }

  if (isEnabled) {
    // Add permission to role (upsert to avoid duplicates)
    await prisma.role_permissions.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId: permission.id }
      },
      update: {},
      create: { roleId, permissionId: permission.id }
    });
    return { action: 'added', permissionKey: permission.key };
  } else {
    // Remove permission from role
    await prisma.role_permissions.deleteMany({
      where: { roleId, permissionId: permission.id }
    });
    return { action: 'removed', permissionKey: permission.key };
  }
}
