/**
 * ============================================
 * GET /api/organization/users
 * ============================================
 *
 * Returns all users in the current organization.
 * Uses org scoping to filter by organization membership.
 *
 * Response:
 * {
 *   success: true,
 *   users: [
 *     {
 *       id: string,
 *       name: string,
 *       email: string,
 *       role: string
 *     }
 *   ]
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  // Get all active users who are members of this organization
  // via their sub_organization -> organization relationship
  const users = await prisma.user.findMany({
    where: {
      sub_organizationId: {
        in: orgContext.subOrganizationIds
      },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      },
      role_assignments: {
        where: {
          organizationId: orgContext.organizationId,
          isActive: true
        },
        select: {
          role: {
            select: {
              name: true
            }
          }
        },
        take: 1
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Also fetch active organization memberships to get role information
  const memberships = await prisma.organization_memberships.findMany({
    where: {
      organizationId: orgContext.organizationId,
      status: 'active'
    },
    select: {
      userId: true,
      workos_role: true,
      status: true
    }
  });

  // Create maps of user IDs to their roles and membership status
  const userRoles = new Map();
  const activeMemberIds = new Set();
  memberships.forEach(m => {
    userRoles.set(m.userId, m.workos_role);
    activeMemberIds.add(m.userId);
  });

  // Only include users with active memberships, format with their roles
  const formattedUsers = users
    .filter(user => activeMemberIds.has(user.id))
    .map(user => ({
      id: user.id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      status: 'active',
      role: user.role_assignments[0]?.role?.name || 'member',
      subOrganization: user.sub_organization?.title
    }));

  return res.status(200).json({
    success: true,
    users: formattedUsers
  });
}

export default withOrgScope(asyncHandler(handler));
