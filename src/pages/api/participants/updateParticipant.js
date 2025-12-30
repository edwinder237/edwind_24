/**
 * ============================================
 * POST/PUT /api/participants/updateParticipant
 * ============================================
 *
 * Updates a participant's information.
 * FIXED: Previously updated any participant without org validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orgContext } = req;
  const { participantId, updates } = req.body;

  if (!participantId) {
    throw new ValidationError('Participant ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new ValidationError('Updates object is required');
  }

  try {
    // Verify participant ownership
    const existingParticipant = await scopedFindUnique(orgContext, 'participants', {
      where: { id: participantId }
    });

    if (!existingParticipant) {
      throw new NotFoundError('Participant not found');
    }

    // Extract valid fields for updating
    const validFields = {};

    if (updates.firstName !== undefined) validFields.firstName = updates.firstName;
    if (updates.lastName !== undefined) validFields.lastName = updates.lastName;
    if (updates.email !== undefined) validFields.email = updates.email;
    if (updates.derpartement !== undefined) validFields.derpartement = updates.derpartement;
    if (updates.notes !== undefined) validFields.notes = updates.notes;
    if (updates.participantStatus !== undefined) validFields.participantStatus = updates.participantStatus;
    if (updates.participantType !== undefined) validFields.participantType = updates.participantType;

    // Handle role relationship
    if (updates.role !== undefined) {
      if (updates.role === null) {
        // Disconnect role if null
        validFields.role = { disconnect: true };
      } else if (updates.role.id) {
        // Connect to role by ID
        validFields.role = { connect: { id: parseInt(updates.role.id) } };
      }
    }

    // Add updatedBy and lastUpdated
    validFields.updatedby = updates.updatedby || 'system';
    validFields.lastUpdated = new Date();

    // Update the participant with org scoping
    const updatedParticipant = await scopedUpdate(orgContext, 'participants', {
      where: { id: participantId },
      data: validFields,
      include: {
        role: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        training_recipient: true,
        toolAccesses: {
          where: {
            isActive: true
          },
          orderBy: {
            tool: 'asc'
          }
        }
      }
    });

    res.status(200).json({
      message: "Participant updated successfully",
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error updating participant:', error);

    if (error.code === 'P2025') {
      throw new NotFoundError('Participant not found');
    }

    if (error.code === 'P2002') {
      throw new ValidationError('Email already exists. Please use a different email address.');
    }

    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));