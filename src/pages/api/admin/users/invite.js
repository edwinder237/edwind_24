import { WorkOS } from '@workos-inc/node';
import { parse } from 'cookie';
import prisma from '../../../../lib/prisma';
import { getCurrentOrganization, getOrganizationContext } from '../../../../lib/session/organizationSession';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const adminMembership = currentUser.organization_memberships.find(
      membership =>
        membership.organizationId === currentOrgId &&
        ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
    );

    if (!adminMembership) {
      return res.status(403).json({ error: 'Admin access required for this organization' });
    }

    // Get invitation data
    const { email, firstName, lastName, role = 'member', sub_organizationId } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Get organization's WorkOS ID
    const workosOrgId = adminMembership.organization.workos_org_id;

    if (!workosOrgId) {
      return res.status(400).json({
        error: 'Organization is not linked to WorkOS. Please contact support.'
      });
    }

    // Initialize WorkOS
    const workosInstance = getWorkOS();

    // Send invitation via WorkOS
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

      // Handle specific WorkOS errors
      if (workosError.message?.includes('already exists')) {
        return res.status(400).json({
          error: 'This email is already registered in the system'
        });
      }

      return res.status(500).json({
        error: 'Failed to send invitation via WorkOS',
        details: workosError.message
      });
    }

    // Validate sub-organization if provided - must belong to current organization
    // If not provided, default to the first sub-organization of the current organization
    let finalSubOrgId = null;

    if (sub_organizationId) {
      if (!orgContext.subOrganizationIds.includes(sub_organizationId)) {
        return res.status(400).json({ error: 'Sub-organization does not belong to your organization' });
      }
      const subOrg = await prisma.sub_organizations.findUnique({
        where: { id: sub_organizationId }
      });
      if (!subOrg) {
        return res.status(400).json({ error: 'Sub-organization not found' });
      }
      finalSubOrgId = sub_organizationId;
    } else if (orgContext.subOrganizationIds.length > 0) {
      // Default to first sub-organization if none specified
      finalSubOrgId = orgContext.subOrganizationIds[0];
      console.log(`📋 No sub-org specified, defaulting to first: ${finalSubOrgId}`);
    }

    if (!finalSubOrgId) {
      return res.status(400).json({ error: 'No sub-organization available for this organization' });
    }

    // Create pending user in local database
    // This user will be updated when they accept the invitation and complete signup
    const pendingUser = await prisma.user.create({
      data: {
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        username: email.split('@')[0],
        password: 'pending_invitation', // Placeholder - user will set via WorkOS
        isActive: false, // Will be activated when invitation is accepted
        sub_organizationId: finalSubOrgId,
        info: {
          invitedBy: currentUser.id,
          invitedAt: new Date().toISOString(),
          workos_invitation_id: invitation.id,
          pendingRole: role,
          invitedToOrganizationId: orgContext.organizationId
        }
      }
    });

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

  } catch (error) {
    console.error('Error inviting user:', error);
    return res.status(500).json({
      error: 'Failed to invite user',
      details: error.message
    });
  }
}
