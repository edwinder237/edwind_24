/**
 * ============================================
 * POST /api/projects/remove-group
 * ============================================
 *
 * Removes a group from a project and all related records.
 * FIXED: Previously accepted any groupId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { updatedGroups, index, groupId, projectId } = req.body;

  try {
    if (!groupId) {
      throw new ValidationError('Group ID is required');
    }

    // Get the group to find its projectId if not provided
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      select: { projectId: true }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: group.projectId }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete related records first to avoid foreign key constraint violations

      // 1. Delete from event_groups table
      await tx.event_groups.deleteMany({
        where: { groupId: parseInt(groupId) }
      });

      // 2. Delete from group_participants table
      await tx.group_participants.deleteMany({
        where: { groupId: parseInt(groupId) }
      });

      // 3. Delete from group_curriculums table
      await tx.group_curriculums.deleteMany({
        where: { groupId: parseInt(groupId) }
      });

      // 4. Finally delete the group itself
      await tx.groups.delete({
        where: { id: parseInt(groupId) }
      });
    });

    const result = {
      newGroupsArray: updatedGroups,
      projectIndex: index,
      deletedGroupId: groupId
    };

    return res.status(200).json({ ...result });
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));