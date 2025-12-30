/**
 * ============================================
 * POST /api/projects/move-participant-between-groups
 * ============================================
 *
 * Moves a participant between groups atomically.
 * FIXED: Previously accepted any groupId/participantId without validation.
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
  const { participantId, fromGroupId, toGroupId } = req.body;

  // Validate: participantId is always required
  if (!participantId) {
    throw new ValidationError('Participant ID is required');
  }

  // If both fromGroupId and toGroupId are null, nothing to do
  if (!fromGroupId && !toGroupId) {
    throw new ValidationError('At least one of fromGroupId or toGroupId must be specified');
  }

  try {
    // Verify ownership of involved groups through their project
    const groupsToVerify = [fromGroupId, toGroupId].filter(Boolean);

    for (const groupId of groupsToVerify) {
      const group = await prisma.groups.findUnique({
        where: { id: parseInt(groupId) },
        select: { id: true, projectId: true }
      });

      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Verify project ownership (validates group ownership)
      const project = await scopedFindUnique(orgContext, 'projects', {
        where: { id: group.projectId }
      });

      if (!project) {
        throw new NotFoundError('Group not found');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const operations = [];

      // Step 1: Remove from current group (if specified)
      if (fromGroupId) {
        const removeResult = await tx.group_participants.deleteMany({
          where: {
            participantId: parseInt(participantId),
            groupId: parseInt(fromGroupId)
          }
        });
        operations.push({
          type: 'remove',
          groupId: fromGroupId,
          count: removeResult.count
        });
      }

      // Step 2: Add to target group (if specified)
      if (toGroupId) {
        // First check if participant is already in the target group
        const existingMembership = await tx.group_participants.findFirst({
          where: {
            participantId: parseInt(participantId),
            groupId: parseInt(toGroupId)
          }
        });

        if (!existingMembership) {
          const addResult = await tx.group_participants.create({
            data: {
              participantId: parseInt(participantId),
              groupId: parseInt(toGroupId)
            }
          });
          operations.push({
            type: 'add',
            groupId: toGroupId,
            result: addResult
          });
        } else {
          operations.push({
            type: 'add',
            groupId: toGroupId,
            result: 'already_member'
          });
        }
      }

      return {
        operations,
        participantId: parseInt(participantId),
        fromGroupId: fromGroupId ? parseInt(fromGroupId) : null,
        toGroupId: toGroupId ? parseInt(toGroupId) : null
      };
    });

    // Generate appropriate success message
    let message;
    if (toGroupId && fromGroupId) {
      message = `Participant moved from group ${fromGroupId} to group ${toGroupId}`;
    } else if (toGroupId) {
      message = `Participant added to group ${toGroupId}`;
    } else if (fromGroupId) {
      message = `Participant removed from group ${fromGroupId}`;
    }

    res.status(200).json({
      success: true,
      data: result,
      message
    });

  } catch (error) {
    console.error('Error moving participant between groups:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
