/**
 * ============================================
 * POST /api/projects/add-participant-to-group
 * ============================================
 *
 * Adds a participant to a group.
 * FIXED: Previously accepted any groupId/participantId without validation.
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

    // Verify the participant exists in project_participants table
    const participantExists = await prisma.project_participants.findUnique({
      where: { id: parseInt(participantId) }
    });

    if (!participantExists) {
      throw new NotFoundError('Participant not found in project participants');
    }

    // Check if the participant is already in the group
    const existingRelation = await prisma.group_participants.findFirst({
      where: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

    if (existingRelation) {
      throw new ValidationError('Participant is already in this group');
    }

    // Add participant to group
    const groupParticipant = await prisma.group_participants.create({
      data: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

    // CASCADE: Add participant to all events that have this group assigned
    const eventGroups = await prisma.event_groups.findMany({
      where: { groupId: parseInt(groupId) },
      select: { eventsId: true }
    });

    const affectedEventIds = [];
    for (const eg of eventGroups) {
      // Use upsert to avoid duplicates (schema has @@unique([eventsId, enrolleeId]))
      await prisma.event_attendees.upsert({
        where: {
          eventsId_enrolleeId: {
            eventsId: eg.eventsId,
            enrolleeId: parseInt(participantId)
          }
        },
        update: {
          attendance_status: 'scheduled'
        },
        create: {
          eventsId: eg.eventsId,
          enrolleeId: parseInt(participantId),
          attendance_status: 'scheduled',
          attendanceType: 'group'
        }
      });
      affectedEventIds.push(eg.eventsId);
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
      message: 'Participant added to group successfully',
      group: updatedGroup,
      affectedEventIds
    });
  } catch (error) {
    console.error('Error adding participant to group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
