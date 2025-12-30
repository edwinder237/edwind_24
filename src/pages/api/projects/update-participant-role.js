/**
 * ============================================
 * PUT /api/projects/update-participant-role
 * ============================================
 *
 * Updates a participant's role.
 * FIXED: Previously accepted any participantId without validation.
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { participantId, roleId } = req.body;

    if (!participantId) {
      throw new ValidationError('Participant ID is required');
    }

    // Verify participant ownership
    const participant = await scopedFindUnique(orgContext, 'participants', {
      where: { id: participantId.toString() } // participants.id is a String in schema
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    // Update participant role using the role relationship
    const updatedParticipant = await prisma.participants.update({
      where: { id: participantId.toString() },
      data: {
        role: roleId ? {
          connect: { id: parseInt(roleId) }
        } : {
          disconnect: true
        },
        lastUpdated: new Date(),
        updatedby: orgContext.userId || 'system'
      },
      include: {
        role: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error updating participant role:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
