/**
 * PUT  /api/internal/organizations/[id]/users/[userId] — Edit user (Owner only)
 * DELETE /api/internal/organizations/[id]/users/[userId] — Hard delete user (Owner only)
 */

import { createHandler } from '../../../../../../lib/api/createHandler';
import prisma from '../../../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Revoke all WorkOS sessions for a user (non-blocking on failure)
 */
async function revokeUserSessions(workosUserId) {
  if (!workosUserId) return;

  try {
    if (typeof workos.userManagement.listSessions !== 'function') return;

    const sessionsResponse = await workos.userManagement.listSessions({
      userId: workosUserId
    });

    const sessions = sessionsResponse.data || [];
    for (const session of sessions) {
      try {
        await workos.userManagement.revokeSession(session.id);
      } catch (revokeError) {
        console.error(`   Failed to revoke session ${session.id}:`, revokeError.message);
      }
    }
  } catch (error) {
    console.error('Error revoking user sessions:', error.message);
  }
}

/**
 * Verify the caller is an owner. Sends error response and returns null if auth fails.
 */
async function verifyOwner(req, res) {
  const userId = req.cookies.workos_user_id;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  const membership = await prisma.organization_memberships.findFirst({
    where: { userId },
    select: { workos_role: true, organizationId: true, userId: true }
  });

  if (!membership || membership.workos_role !== 'owner') {
    res.status(403).json({ error: 'Owner access required' });
    return null;
  }
  return membership;
}

// ── PUT — Edit user fields ──
async function handlePut(req, res, membership) {
  const { id: orgId, userId } = req.query;
  const { firstName, lastName, isActive, sub_organizationId } = req.body;

  // Verify user belongs to this org (via membership or sub-org)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      workos_user_id: true,
      email: true,
      isActive: true,
      sub_organization: {
        select: { organizationId: true }
      },
      organization_memberships: {
        select: { organizationId: true }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const belongsToOrg =
    user.organization_memberships.some(m => m.organizationId === orgId) ||
    user.sub_organization?.organizationId === orgId;

  if (!belongsToOrg) {
    return res.status(400).json({ error: 'User does not belong to this organization' });
  }

  // Build update data
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (firstName !== undefined || lastName !== undefined) {
    updateData.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }
  if (isActive !== undefined) updateData.isActive = isActive;
  if (sub_organizationId !== undefined) {
    updateData.sub_organizationId = sub_organizationId || null;
  }

  // If deactivating, revoke sessions
  if (isActive === false && user.isActive === true && user.workos_user_id) {
    await revokeUserSessions(user.workos_user_id);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      sub_organization: { select: { id: true, title: true } }
    }
  });

  return res.status(200).json({ success: true, user: updated });
}

// ── DELETE — Hard delete user from WorkOS + DB ──
async function handleDelete(req, res, membership) {
  const { id: orgId, userId } = req.query;

  // Prevent owner from deleting themselves
  if (userId === membership.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  // Fetch user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      workos_user_id: true,
      sub_organization: {
        select: { organizationId: true }
      },
      organization_memberships: {
        select: { organizationId: true }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify user belongs to this org
  const belongsToOrg =
    user.organization_memberships.some(m => m.organizationId === orgId) ||
    user.sub_organization?.organizationId === orgId;

  if (!belongsToOrg) {
    return res.status(400).json({ error: 'User does not belong to this organization' });
  }

  // Audit log before deletion
  console.log(`[AUDIT] Hard-deleting user "${user.name || user.email}"`, {
    dbUserId: user.id,
    workosUserId: user.workos_user_id || null,
    email: user.email,
    orgId,
    deletedBy: membership.userId,
    deletedByWorkosId: req.cookies.workos_user_id
  });

  // 1. Resolve WorkOS user ID (fall back to email lookup if not in DB)
  let workosUserId = user.workos_user_id;
  if (!workosUserId && user.email) {
    try {
      const workosUsers = await workos.userManagement.listUsers({ email: user.email });
      const match = workosUsers.data?.[0];
      if (match) {
        workosUserId = match.id;
        console.log(`[AUDIT] Resolved WorkOS user by email: ${user.email} → ${workosUserId}`);
      }
    } catch (lookupError) {
      console.error('WorkOS user lookup by email failed:', lookupError.message);
    }
  }

  // 2. Revoke WorkOS sessions + delete from WorkOS
  if (workosUserId) {
    await revokeUserSessions(workosUserId);

    try {
      await workos.userManagement.deleteUser(workosUserId);
    } catch (deleteError) {
      console.error(`Failed to delete WorkOS user ${workosUserId}:`, deleteError.message);
    }
  }

  // 3. Delete user from DB (cascade handles related records)
  await prisma.user.delete({ where: { id: userId } });

  return res.status(200).json({
    success: true,
    message: `User "${user.name || user.email}" permanently deleted`,
    deleted: { id: user.id, email: user.email }
  });
}

export default createHandler({
  scope: 'public',
  PUT: async (req, res) => {
    const membership = await verifyOwner(req, res);
    if (!membership) return;
    return handlePut(req, res, membership);
  },
  DELETE: async (req, res) => {
    const membership = await verifyOwner(req, res);
    if (!membership) return;
    return handleDelete(req, res, membership);
  }
});
