import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';

export default createHandler({
  scope: 'admin',

  GET: async (req, res) => {
    const { organizationId } = req.orgContext;
    const { id: roleId } = req.query;

    const role = await prisma.system_roles.findUnique({
      where: { id: parseInt(roleId, 10) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const allPermissions = await prisma.permissions.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const rolePermissions = await prisma.role_permissions.findMany({
      where: { roleId: role.id },
      select: { permissionId: true }
    });
    const defaultPermissionIds = new Set(rolePermissions.map(rp => rp.permissionId));

    const orgOverrides = await prisma.organization_role_overrides.findMany({
      where: { organizationId, roleId: role.id }
    });
    const overrideMap = Object.fromEntries(
      orgOverrides.map(o => [o.permissionId, o.isEnabled])
    );

    const permissionsByCategory = {};

    for (const perm of allPermissions) {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }

      const hasDefault = defaultPermissionIds.has(perm.id);
      const hasOverride = overrideMap.hasOwnProperty(perm.id);
      const overrideValue = overrideMap[perm.id];
      const isEnabled = hasOverride ? overrideValue : hasDefault;

      permissionsByCategory[perm.category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
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
  },

  PUT: async (req, res) => {
    const { organizationId, userId: adminWorkosId } = req.orgContext;
    const { id: roleId } = req.query;

    const role = await prisma.system_roles.findUnique({
      where: { id: parseInt(roleId, 10) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Get admin's DB user ID for audit trail
    const adminUser = await prisma.user.findUnique({
      where: { workos_user_id: adminWorkosId },
      select: { id: true }
    });

    const { permissionId, isEnabled, overrides } = req.body;

    if (overrides && Array.isArray(overrides)) {
      const results = [];

      for (const override of overrides) {
        const result = await updateOverride(
          organizationId,
          role.id,
          override.permissionId,
          override.isEnabled,
          adminUser?.id
        );
        results.push(result);
      }

      return res.status(200).json({
        success: true,
        message: `Updated ${results.length} permission overrides`,
        results
      });
    }

    if (permissionId === undefined || isEnabled === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: permissionId and isEnabled'
      });
    }

    const result = await updateOverride(organizationId, role.id, permissionId, isEnabled, adminUser?.id);

    return res.status(200).json({
      success: true,
      message: result.action === 'removed'
        ? 'Override removed (using default)'
        : `Permission ${isEnabled ? 'enabled' : 'disabled'} for this organization`,
      result
    });
  }
});

async function updateOverride(organizationId, roleId, permissionId, isEnabled, userId) {
  const permission = await prisma.permissions.findUnique({
    where: { id: parseInt(permissionId, 10) }
  });

  if (!permission) {
    return { error: 'Permission not found', permissionId };
  }

  const defaultPerm = await prisma.role_permissions.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId: permission.id
      }
    }
  });

  const isDefault = !!defaultPerm;

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
