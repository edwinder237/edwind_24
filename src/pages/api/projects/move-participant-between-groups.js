import prisma from "../../../lib/prisma";

/**
 * API endpoint for moving a participant between groups
 * Handles atomic operation to remove from one group and add to another
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { participantId, fromGroupId, toGroupId } = req.body;

  // Validate: participantId is always required
  if (!participantId) {
    return res.status(400).json({
      error: 'Participant ID is required'
    });
  }

  // If both fromGroupId and toGroupId are null, nothing to do
  if (!fromGroupId && !toGroupId) {
    return res.status(400).json({
      error: 'At least one of fromGroupId or toGroupId must be specified'
    });
  }

  try {
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
      // If toGroupId is null, we're just removing from groups without adding to a new one
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
    res.status(500).json({ 
      error: 'Failed to move participant between groups', 
      details: error.message 
    });
  }
}