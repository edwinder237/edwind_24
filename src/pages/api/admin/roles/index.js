import { parse } from 'cookie';
import prisma from '../../../../lib/prisma';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

/**
 * GET /api/admin/roles
 * Returns list of all system roles (Level 2-4)
 * Admin-only endpoint
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
        organization_memberships: true
      }
    });

    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user has admin role in any organization
    const isAdmin = currentUser.organization_memberships.some(
      membership => ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all active system roles with permission counts
    const roles = await prisma.system_roles.findMany({
      where: { isActive: true },
      orderBy: { hierarchyLevel: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        hierarchyLevel: true,
        _count: {
          select: {
            role_permissions: true
          }
        }
      }
    });

    // Format response
    const formattedRoles = roles.map(role => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      hierarchyLevel: role.hierarchyLevel,
      permissionCount: role._count.role_permissions
    }));

    return res.status(200).json({ roles: formattedRoles });
  } catch (error) {
    console.error('Error fetching system roles:', error);
    return res.status(500).json({
      error: 'Failed to fetch roles',
      details: error.message
    });
  }
}
