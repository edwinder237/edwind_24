/**
 * ============================================
 * GET /api/projects/fetchProjects
 * ============================================
 *
 * Returns projects for the current organization.
 * FIXED: Previously leaked projects across organizations even with accessallprojects check.
 *
 * Permissions:
 * - Users with "accessallprojects": See all projects in their organization
 * - Regular users: See only projects they created
 *
 * Response:
 * {
 *   projects: [...]
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { orgContext } = req;

  console.log('📋 orgContext:', {
    organizationId: orgContext.organizationId,
    subOrganizationIds: orgContext.subOrganizationIds,
    userId: orgContext.userId
  });

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { workos_user_id: orgContext.userId },
    select: { id: true }
  });

  if (!dbUser) {
    return res.status(401).json({ error: 'User not found in database' });
  }

  // Check if user has "accessallprojects" permission OR is an admin
  const hasAccessAllProjects = orgContext.permissions.includes('accessallprojects') || orgContext.isAdmin;

  console.log(`🔐 User ${orgContext.userId} - accessallprojects: ${hasAccessAllProjects}, isAdmin: ${orgContext.isAdmin}`);

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

  console.log(`📊 Returning ${projects.length} projects for user ${orgContext.userId} in org ${orgContext.organizationId}`);
  console.log('📊 Project sub_organizationIds:', projects.map(p => ({ id: p.id, sub_org_id: p.sub_organizationId, title: p.title })));

  return res.status(200).json({ projects });
}

export default withOrgScope(asyncHandler(handler));
