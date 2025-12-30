/**
 * ============================================
 * POST /api/projects/update-group
 * ============================================
 *
 * Updates a group in a project.
 * FIXED: Previously accepted any projectId/groupId without validation.
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { groupId, updates, projectId } = req.body;

    if (!groupId) {
      throw new ValidationError('Group ID is required');
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if group exists and belongs to the project
    const existingGroup = await prisma.groups.findFirst({
      where: {
        id: parseInt(groupId),
        projectId: parseInt(projectId)
      }
    });

    if (!existingGroup) {
      throw new NotFoundError('Group not found or does not belong to this project');
    }

    // Check if group name is unique within the project (if name is being updated)
    if (updates.groupName && updates.groupName !== existingGroup.groupName) {
      const existingGroupWithName = await prisma.groups.findFirst({
        where: {
          groupName: updates.groupName,
          projectId: parseInt(projectId),
          NOT: {
            id: parseInt(groupId)
          }
        }
      });

      if (existingGroupWithName) {
        throw new ValidationError('Group name already exists in this project');
      }
    }

    // Update the group
    const updatedGroup = await prisma.groups.update({
      where: { id: parseInt(groupId) },
      data: {
        ...(updates.groupName && { groupName: updates.groupName }),
        ...(updates.chipColor && { chipColor: updates.chipColor })
      },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    // Fetch all groups for this project to return complete list
    const allProjectGroups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    const result = {
      updatedGroup,
      allProjectGroups,
      projectId: parseInt(projectId)
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));