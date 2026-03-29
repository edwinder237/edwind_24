import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

const VALID_ROLES = ['admin', 'member', 'owner'];

export default createHandler({
  scope: 'admin',
  PUT: async (req, res) => {
    const { subOrganizationIds } = req.orgContext;
    const { id } = req.query;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (!VALID_ROLES.includes(role.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid role. Valid roles are: ${VALID_ROLES.join(', ')}`
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        organization_memberships: {
          include: { organization: true }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    if (!targetUser.workos_user_id) {
      return res.status(400).json({
        error: 'User is not linked to WorkOS. Cannot update role.'
      });
    }

    const workosInstance = getWorkOS();

    let membershipToUpdate = null;
    try {
      const memberships = await workosInstance.userManagement.listOrganizationMemberships({
        userId: targetUser.workos_user_id
      });
      if (memberships.data?.length > 0) {
        membershipToUpdate = memberships.data[0];
      }
    } catch (err) {
      console.error('Error fetching WorkOS memberships:', err);
      return res.status(500).json({
        error: 'Failed to fetch user memberships from WorkOS'
      });
    }

    if (!membershipToUpdate) {
      return res.status(400).json({
        error: 'User does not have any organization memberships in WorkOS'
      });
    }

    try {
      await workosInstance.userManagement.updateOrganizationMembership(
        membershipToUpdate.id,
        { roleSlug: role.toLowerCase() }
      );
      console.log(`✅ Updated WorkOS role for user ${targetUser.email} to ${role}`);
    } catch (workosError) {
      console.error('WorkOS role update error:', workosError);
      return res.status(500).json({
        error: 'Failed to update role in WorkOS',
        details: workosError.message
      });
    }

    if (targetUser.organization_memberships.length > 0) {
      await prisma.organization_memberships.updateMany({
        where: { userId: targetUser.id },
        data: {
          workos_role: role.toLowerCase(),
          cached_at: new Date()
        }
      });
      console.log(`✅ Updated local role cache for user ${targetUser.email}`);
    }

    return res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: role.toLowerCase()
      }
    });
  }
});
