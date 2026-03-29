import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../../lib/api/createHandler';
import prisma from '../../../../lib/prisma';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default createHandler({
  scope: 'admin',
  POST: async (req, res) => {
    const { organizationId, subOrganizationIds, workosOrgId, userId: workosUserId } = req.orgContext;

    const currentUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      select: { id: true }
    });

    const { email, firstName, lastName, role = 'member', sub_organizationId, appRoleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    if (!workosOrgId) {
      return res.status(400).json({
        error: 'Organization is not linked to WorkOS. Please contact support.'
      });
    }

    const workosInstance = getWorkOS();

    let invitation;
    try {
      invitation = await workosInstance.userManagement.sendInvitation({
        email,
        organizationId: workosOrgId,
        inviterUserId: workosUserId,
        roleSlug: role,
        expiresInDays: 7
      });

      console.log(`✅ WorkOS invitation sent to ${email}:`, invitation.id);
    } catch (workosError) {
      console.error('WorkOS invitation error:', workosError);
      const msg = workosError.message || '';
      const rawData = workosError.rawData || workosError.data || {};

      if (msg.includes('already invited') || rawData.code === 'invitation_already_exists') {
        return res.status(400).json({
          error: 'An invitation has already been sent to this email. Check pending invitations or wait for it to expire.'
        });
      }
      if (msg.includes('already exists') || rawData.code === 'user_already_exists') {
        return res.status(400).json({
          error: 'This email is already registered in WorkOS. The user may already have an account.'
        });
      }
      if (rawData.code === 'organization_not_found') {
        return res.status(400).json({
          error: 'Organization not found in WorkOS. Please contact support.'
        });
      }
      if (workosError.status === 422 || workosError.statusCode === 422) {
        return res.status(400).json({
          error: `Invalid invitation request: ${rawData.message || msg || 'Please check the email and role.'}`
        });
      }

      return res.status(500).json({
        error: 'Failed to send invitation via WorkOS',
        details: msg
      });
    }

    let finalSubOrgId = null;

    if (sub_organizationId) {
      if (!subOrganizationIds.includes(sub_organizationId)) {
        return res.status(400).json({ error: 'Sub-organization does not belong to your organization' });
      }
      const subOrg = await prisma.sub_organizations.findUnique({
        where: { id: sub_organizationId }
      });
      if (!subOrg) {
        return res.status(400).json({ error: 'Sub-organization not found' });
      }
      finalSubOrgId = sub_organizationId;
    } else if (subOrganizationIds.length > 0) {
      finalSubOrgId = subOrganizationIds[0];
      console.log(`📋 No sub-org specified, defaulting to first: ${finalSubOrgId}`);
    }

    if (!finalSubOrgId) {
      return res.status(400).json({ error: 'No sub-organization available for this organization' });
    }

    let pendingUser;
    try {
      pendingUser = await prisma.user.create({
        data: {
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
          username: email.split('@')[0],
          password: 'pending_invitation',
          isActive: false,
          sub_organization: { connect: { id: finalSubOrgId } },
          info: {
            invitedBy: currentUser?.id,
            invitedAt: new Date().toISOString(),
            workos_invitation_id: invitation.id,
            pendingRole: role,
            invitedToOrganizationId: organizationId
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        return res.status(400).json({
          error: `A user with this ${field} already exists`
        });
      }
      throw error;
    }

    if (appRoleId) {
      await prisma.user_role_assignments.create({
        data: {
          userId: pendingUser.id,
          roleId: appRoleId,
          organizationId,
          assignedBy: workosUserId
        }
      });
      console.log(`✅ Assigned role ${appRoleId} to pending user ${pendingUser.email}`);
    }

    console.log(`✅ Created pending user: ${pendingUser.email}`);

    return res.status(200).json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        state: invitation.state
      },
      user: {
        id: pendingUser.id,
        email: pendingUser.email,
        isActive: pendingUser.isActive
      }
    });
  }
});
