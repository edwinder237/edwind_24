/**
 * ============================================
 * POST /api/projects/remove-participant-from-group
 * ============================================
 *
 * Removes a participant from a group.
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

  try {
    const { groupId, participantId } = req.body;

    if (!groupId || !participantId) {
      throw new ValidationError('Group ID and Participant ID are required');
    }

    // Get group and verify it belongs to a project in user's org
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

    // Remove participant from group
    const deletedRelation = await prisma.group_participants.deleteMany({
      where: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

    if (deletedRelation.count === 0) {
      throw new NotFoundError('Participant not found in this group');
    }

    // Fetch the updated group with all participants
    const updatedGroup = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                participant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    derpartement: true,
                    profileImg: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    res.status(200).json({
      success: true,
      message: 'Participant removed from group successfully',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error removing participant from group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
