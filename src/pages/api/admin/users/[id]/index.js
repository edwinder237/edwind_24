import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function revokeUserSessions(workosUserId) {
  if (!workosUserId) return;

  try {
    const sessionsResponse = await workos.userManagement.listSessions({
      userId: workosUserId
    });

    const sessions = sessionsResponse.data || [];

    for (const session of sessions) {
      try {
        await workos.userManagement.revokeSession(session.id);
      } catch (revokeError) {
        console.error(`   ⚠️ Failed to revoke session ${session.id}:`, revokeError.message);
      }
    }

  } catch (error) {
    console.error('Error revoking user sessions:', error.message);
  }
}

export default createHandler({
  scope: 'admin',

  GET: async (req, res) => {
    const { subOrganizationIds } = req.orgContext;
    const { id } = req.query;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sub_organization: {
          select: { id: true, title: true }
        },
        organization_memberships: {
          include: {
            organization: {
              select: { id: true, title: true, workos_org_id: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(user.sub_organizationId)) {
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
  },

  PUT: async (req, res) => {
    const { subOrganizationIds } = req.orgContext;
    const { id } = req.query;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { sub_organizationId: true, workos_user_id: true, isActive: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(existingUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    const { isActive, sub_organizationId, firstName, lastName, name } = req.body;
    const updateData = {};

    if (isActive !== undefined) {
      updateData.isActive = isActive;

      if (isActive === false && existingUser.isActive === true) {
        await revokeUserSessions(existingUser.workos_user_id);
      }
    }

    if (sub_organizationId !== undefined) {
      if (sub_organizationId !== null) {
        if (!subOrganizationIds.includes(sub_organizationId)) {
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

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (name !== undefined) updateData.name = name;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        sub_organization: {
          select: { id: true, title: true }
        }
      }
    });

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
  },

  DELETE: async (req, res) => {
    const { subOrganizationIds } = req.orgContext;
    const { id } = req.query;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, sub_organizationId: true, workos_user_id: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(existingUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    await revokeUserSessions(existingUser.workos_user_id);

    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

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
});
