import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';

export default createHandler({
  scope: 'admin',

  GET: async (req, res) => {
    const { subOrganizationIds, organizationId } = req.orgContext;
    const { id: userId } = req.query;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, sub_organizationId: true, email: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

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
  },

  PUT: async (req, res) => {
    const { subOrganizationIds, organizationId, userId: adminWorkosId } = req.orgContext;
    const { id: userId } = req.query;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, sub_organizationId: true, email: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    const { roleId } = req.body;

    if (!roleId) {
      await prisma.user_role_assignments.deleteMany({
        where: { userId, organizationId }
      });

      console.log(`Removed app role assignment for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'Role assignment removed',
        appRole: null
      });
    }

    const role = await prisma.system_roles.findUnique({
      where: { id: parseInt(roleId, 10) }
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const assignment = await prisma.user_role_assignments.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      update: {
        roleId: role.id,
        assignedBy: adminWorkosId,
        isActive: true
      },
      create: {
        userId,
        organizationId,
        roleId: role.id,
        assignedBy: adminWorkosId,
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
});
