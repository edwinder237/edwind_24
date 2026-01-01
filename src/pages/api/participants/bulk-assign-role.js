/**
 * ============================================
 * POST /api/participants/bulk-assign-role
 * ============================================
 *
 * Assigns a role to multiple participants at once.
 *
 * Body:
 * - participantIds (required): Array of participant IDs to update
 * - roleId (required): Role ID to assign (null to remove role)
 *
 * Response:
 * {
 *   success: true,
 *   updatedCount: number,
 *   participants: [...] // Updated participants
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orgContext } = req;
  const { participantIds, roleId } = req.body;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ValidationError('participantIds array is required and must not be empty');
  }

  try {
    // Verify all participants exist and belong to accessible sub-organizations
    // Note: participants table uses 'sub_organization' instead of 'sub_organizationId'
    const existingParticipants = await prisma.participants.findMany({
      where: {
        id: {
          in: participantIds
        },
        sub_organization: {
          in: orgContext.subOrganizationIds
        }
      },
      select: {
        id: true,
        sub_organization: true
      }
    });

    // Check if all requested participants were found
    const foundIds = existingParticipants.map(p => p.id);
    const missingIds = participantIds.filter(id => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotFoundError(`Participants not found or not accessible: ${missingIds.join(', ')}`);
    }

    // If roleId is provided, verify the role exists and is accessible
    if (roleId !== null && roleId !== undefined) {
      const role = await scopedFindMany(orgContext, 'sub_organization_participant_role', {
        where: {
          id: parseInt(roleId),
          isActive: true
        },
        select: {
          id: true,
          title: true
        }
      });

      if (role.length === 0) {
        throw new NotFoundError('Role not found or not accessible');
      }
    }

    // Build the update data
    const updateData = {
      lastUpdated: new Date()
    };

    if (roleId === null) {
      // Disconnect role
      updateData.role = { disconnect: true };
    } else {
      // Connect to role
      updateData.role = { connect: { id: parseInt(roleId) } };
    }

    // Update all participants
    const updatePromises = participantIds.map(participantId =>
      prisma.participants.update({
        where: { id: participantId },
        data: updateData,
        include: {
          role: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        }
      })
    );

    const updatedParticipants = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      updatedCount: updatedParticipants.length,
      participants: updatedParticipants
    });

  } catch (error) {
    console.error('Error bulk assigning role:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
