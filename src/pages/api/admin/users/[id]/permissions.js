import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';

export default createHandler({
  scope: 'admin',

  GET: async (req, res) => {
    const { subOrganizationIds, organizationId } = req.orgContext;
    const { id: userId } = req.query;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, sub_organizationId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    const allPermissions = await prisma.permissions.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const roleAssignment = await prisma.user_role_assignments.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUser.id,
          organizationId
        }
      },
      include: { role: true }
    });

    let defaultPermissionIds = new Set();
    if (roleAssignment) {
      const rolePerms = await prisma.role_permissions.findMany({
        where: { roleId: roleAssignment.roleId },
        select: { permissionId: true }
      });
      defaultPermissionIds = new Set(rolePerms.map(rp => rp.permissionId));
    }

    let orgOverrideMap = {};
    if (roleAssignment) {
      const orgOverrides = await prisma.organization_role_overrides.findMany({
        where: { organizationId, roleId: roleAssignment.roleId }
      });
      orgOverrideMap = Object.fromEntries(
        orgOverrides.map(o => [o.permissionId, o.isEnabled])
      );
    }

    const userOverrides = await prisma.user_permission_overrides.findMany({
      where: { userId: targetUser.id, organizationId }
    });
    const userOverrideMap = Object.fromEntries(
      userOverrides.map(o => [o.permissionId, o.isEnabled])
    );

    const permissionsByCategory = {};
    for (const perm of allPermissions) {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }

      const isRoleDefault = defaultPermissionIds.has(perm.id);
      const hasOrgOverride = orgOverrideMap.hasOwnProperty(perm.id);
      const hasUserOverride = userOverrideMap.hasOwnProperty(perm.id);
      const effectiveFromRole = hasOrgOverride ? orgOverrideMap[perm.id] : isRoleDefault;
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
  },

  PUT: async (req, res) => {
    const { subOrganizationIds, organizationId, userId: adminWorkosId } = req.orgContext;
    const { id: userId } = req.query;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, sub_organizationId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workos_user_id: adminWorkosId },
      select: { id: true }
    });

    const { permissionId, isEnabled, overrides } = req.body;

    if (overrides && Array.isArray(overrides)) {
      const results = [];
      for (const override of overrides) {
        const result = await updateUserOverride(
          targetUser.id, organizationId,
          override.permissionId, override.isEnabled,
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

    const result = await updateUserOverride(
      targetUser.id, organizationId,
      permissionId, isEnabled, adminUser?.id
    );

    return res.status(200).json({ success: true, result });
  }
});

async function updateUserOverride(userId, organizationId, permissionId, isEnabled, adminUserId) {
  const permission = await prisma.permissions.findUnique({
    where: { id: parseInt(permissionId, 10) }
  });

  if (!permission) {
    return { error: 'Permission not found', permissionId };
  }

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
