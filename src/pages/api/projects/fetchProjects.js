/**
 * ============================================
 * GET /api/projects/fetchProjects
 * ============================================
 *
 * Returns projects for the current organization.
 * FIXED: Previously leaked projects across organizations even with accessallprojects check.
 *
 * Permissions:
 * - Admins or users with "projects:read": See all projects in their organization
 * - Regular users: See only projects they created or are assigned to
 *
 * Response:
 * {
 *   projects: [...]
 * }
 */

import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { canViewAll } from '../../../lib/auth/permissionService.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: orgContext.userId },
      select: { id: true }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user can view all projects:
    // - isAdmin (WorkOS admin)
    // - canViewAll checks for 'projects:read' or legacy 'accessallprojects' permission
    const hasAccessAllProjects = orgContext.isAdmin || canViewAll(orgContext.permissions, 'projects');

    // Build where clause based on permissions
    // Note: scopedFindMany will automatically add sub_organizationId filter
    const whereClause = hasAccessAllProjects
      ? {} // Can see all projects in organization (admin or has permission)
      : { CreatedBy: dbUser.id }; // Can only see their own projects

    // Fetch projects with organization scoping
    const projects = await scopedFindMany(orgContext, 'projects', {
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        training_recipient: true,
        project_settings: true,
        sub_organization: {
          include: {
            organization: true
          }
        },
        project_instructors: {
          include: {
            instructor: true
          }
        },
        project_curriculums: {
          include: {
            curriculum: true
          }
        }
      }
    });

    return res.status(200).json({ projects });
  }
});
