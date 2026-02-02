import { parse } from 'cookie';
import prisma from '../../../../lib/prisma';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

/**
 * GET /api/admin/permissions
 * Returns list of all permissions grouped by category
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
      include: { organization_memberships: true }
    });

    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = currentUser.organization_memberships.some(
      membership => ADMIN_ROLES.includes(membership.workos_role?.toLowerCase())
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all active permissions
    const permissions = await prisma.permissions.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { resource: 'asc' }, { name: 'asc' }]
    });

    // Group by category
    const byCategory = {};
    for (const perm of permissions) {
      if (!byCategory[perm.category]) {
        byCategory[perm.category] = [];
      }
      byCategory[perm.category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope
      });
    }

    // Category labels
    const categoryLabels = {
      projects: 'Projects',
      courses: 'Courses & Curriculums',
      events: 'Events & Schedule',
      participants: 'Participants',
      assessments: 'Assessments',
      timeline: 'Timeline',
      kirkpatrick: 'Kirkpatrick Evaluations',
      reports: 'Reports & Certificates',
      resources: 'Resources',
      user_management: 'User Management',
      settings: 'Settings'
    };

    return res.status(200).json({
      permissions,
      byCategory,
      categoryLabels,
      total: permissions.length
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({
      error: 'Failed to fetch permissions',
      details: error.message
    });
  }
}
