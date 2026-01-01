/**
 * ============================================
 * POST /api/participants/bulk-assign-group
 * ============================================
 *
 * Assigns participants to a group (or removes from all groups).
 * Uses project_participants IDs since group_participants links to project_participants.
 *
 * Body:
 * - participantIds (required): Array of project_participant IDs
 * - groupId (required): Group ID to assign (null to remove from all groups)
 * - projectId (required): Project ID for validation
 *
 * Response:
 * {
 *   success: true,
 *   assignedCount: number,
 *   removedCount: number
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orgContext } = req;
  const { participantIds, groupId, projectId } = req.body;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ValidationError('participantIds array is required and must not be empty');
  }

  if (!projectId) {
    throw new ValidationError('projectId is required');
  }

  try {
    // Verify the project belongs to the user's organization
    const project = await prisma.projects.findFirst({
      where: {
        id: parseInt(projectId),
        sub_organizationId: {
          in: orgContext.subOrganizationIds
        }
      },
      select: { id: true }
    });

    if (!project) {
      throw new NotFoundError('Project not found or not accessible');
    }

    // Verify all project_participants exist and belong to this project
    const existingParticipants = await prisma.project_participants.findMany({
      where: {
        id: {
          in: participantIds.map(id => parseInt(id))
        },
        projectId: parseInt(projectId)
      },
      select: {
        id: true
      }
    });

    const foundIds = existingParticipants.map(p => p.id);
    const missingIds = participantIds.filter(id => !foundIds.includes(parseInt(id)));

    if (missingIds.length > 0) {
      throw new NotFoundError(`Project participants not found: ${missingIds.join(', ')}`);
    }

    let result = { assignedCount: 0, removedCount: 0 };

    if (groupId === null) {
      // Remove participants from all groups
      const deleteResult = await prisma.group_participants.deleteMany({
        where: {
          participantId: {
            in: participantIds.map(id => parseInt(id))
          }
        }
      });
      result.removedCount = deleteResult.count;
    } else {
      // Verify the group exists and belongs to the project
      const group = await prisma.groups.findFirst({
        where: {
          id: parseInt(groupId),
          projectId: parseInt(projectId)
        },
        select: { id: true, groupName: true }
      });

      if (!group) {
        throw new NotFoundError('Group not found or does not belong to this project');
      }

      // Get existing group assignments to avoid duplicates
      const existingAssignments = await prisma.group_participants.findMany({
        where: {
          groupId: parseInt(groupId),
          participantId: {
            in: participantIds.map(id => parseInt(id))
          }
        },
        select: { participantId: true }
      });

      const alreadyAssignedIds = new Set(existingAssignments.map(a => a.participantId));
      const newAssignments = participantIds
        .map(id => parseInt(id))
        .filter(id => !alreadyAssignedIds.has(id));

      if (newAssignments.length > 0) {
        // Create new group assignments
        await prisma.group_participants.createMany({
          data: newAssignments.map(participantId => ({
            groupId: parseInt(groupId),
            participantId
          })),
          skipDuplicates: true
        });
        result.assignedCount = newAssignments.length;
      }
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error bulk assigning group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
