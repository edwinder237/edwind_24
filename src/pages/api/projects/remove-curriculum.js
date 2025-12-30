/**
 * ============================================
 * DELETE /api/projects/remove-curriculum
 * ============================================
 *
 * Removes a curriculum from a project and all groups.
 * FIXED: Previously accepted any projectId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { projectId, curriculumId } = req.body;

    if (!projectId || !curriculumId) {
      throw new ValidationError('Project ID and Curriculum ID are required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Use a transaction for atomicity and better performance
    const result = await prisma.$transaction(async (tx) => {
      // Check if the relationship exists and delete it in one query
      const deletedRelation = await tx.project_curriculums.deleteMany({
        where: {
          projectId: parseInt(projectId),
          curriculumId: parseInt(curriculumId)
        }
      });

      if (deletedRelation.count === 0) {
        throw new Error('Curriculum is not associated with this project');
      }

      // Remove the curriculum from all groups in this project (single optimized query)
      await tx.group_curriculums.deleteMany({
        where: {
          curriculumId: parseInt(curriculumId),
          group: {
            projectId: parseInt(projectId)
          }
        }
      });

      return deletedRelation;
    });

    if (!result || result.count === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curriculum is not associated with this project' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Curriculum removed from project and all groups successfully'
    });

  } catch (error) {
    console.error('Error removing curriculum from project:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));