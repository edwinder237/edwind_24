import { WorkOS } from '@workos-inc/node';
import { parse } from 'cookie';
import prisma from '../../../../../lib/prisma';
import { getCurrentOrganization, getOrganizationContext } from '../../../../../lib/session/organizationSession';

// Initialize WorkOS
let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

// Valid roles that can be assigned
const VALID_ROLES = ['admin', 'member', 'owner'];

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from cookie
    const cookies = parse(req.headers.cookie || '');
    const workosUserId = cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get current user and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId },
      include: {
        organization_memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get current organization from session
    const currentOrgId = await getCurrentOrganization(req);
    if (!currentOrgId) {
      return res.status(400).json({ error: 'No organization selected. Please select an organization first.' });
    }

    // Get organization context
    const orgContext = await getOrganizationContext(currentOrgId);
    if (!orgContext) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    // Check if user has admin role in the CURRENT organization
    const isAdmin = currentUser.organization_memberships.some(
      membership =>
        membership.organizationId === currentOrgId &&
        ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required for this organization' });
    }

    const { id } = req.query;
    const { role } = req.body;

    // Validate role
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (!VALID_ROLES.includes(role.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid role. Valid roles are: ${VALID_ROLES.join(', ')}`
      });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        organization_memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify target user belongs to admin's organization (by sub-organization)
    if (!orgContext.subOrganizationIds.includes(targetUser.sub_organizationId)) {
      return res.status(403).json({ error: 'User does not belong to your organization' });
    }

    if (!targetUser.workos_user_id) {
      return res.status(400).json({
        error: 'User is not linked to WorkOS. Cannot update role.'
      });
    }

    // Get WorkOS instance
    const workosInstance = getWorkOS();

    // Find the user's organization membership in WorkOS
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

    // Update role in WorkOS
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

    // Update local cache of the role
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

  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({
      error: 'Failed to update user role',
      details: error.message
    });
  }
}
