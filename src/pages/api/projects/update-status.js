/**
 * ============================================
 * PUT /api/projects/update-status
 * ============================================
 *
 * Updates a project's status.
 * FIXED: Previously updated any project without org validation.
 */

import prisma from '../../../lib/prisma';
import { PROJECT_STATUS } from '../../../constants';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { projectId, status } = req.body;

    if (!projectId || !status) {
      throw new ValidationError('Project ID and status are required');
    }

    // Validate status
    const validStatuses = Object.values(PROJECT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status value');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Update project status with org scoping
    const updatedProject = await scopedUpdate(orgContext, 'projects', {
      where: { id: parseInt(projectId) },
      data: {
        projectStatus: status,
        lastUpdated: new Date()
      }
    });

    res.status(200).json({
      message: 'Project status updated successfully',
      project: {
        id: updatedProject.id,
        projectStatus: updatedProject.projectStatus,
        lastUpdated: updatedProject.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));