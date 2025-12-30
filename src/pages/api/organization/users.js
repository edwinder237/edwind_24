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

  // Get all users who are members of this organization
  // via their sub_organization -> organization relationship
  const users = await prisma.user.findMany({
    where: {
      sub_organizationId: {
        in: orgContext.subOrganizationIds
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Also fetch organization memberships to get role information
  const memberships = await prisma.organization_memberships.findMany({
    where: {
      organizationId: orgContext.organizationId,
      status: 'active'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Create a map of user IDs to their roles
  const userRoles = new Map();
  memberships.forEach(m => {
    userRoles.set(m.userId, m.workos_role);
  });

  // Format users with their roles
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    email: user.email,
    status: user.status,
    role: userRoles.get(user.id) || 'member',
    subOrganization: user.sub_organization?.title
  }));

  return res.status(200).json({
    success: true,
    users: formattedUsers
  });
}

export default withOrgScope(asyncHandler(handler));
