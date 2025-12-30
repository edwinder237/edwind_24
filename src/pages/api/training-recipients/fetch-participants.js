/**
 * ============================================
 * GET /api/training-recipients/fetch-participants
 * ============================================
 *
 * Fetches participants for a training recipient with org scoping.
 * Verifies training recipient belongs to user's organization.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { trainingRecipientId, projectId } = req.query;

  if (!trainingRecipientId) {
    throw new ValidationError('Training recipient ID is required');
  }

  const trId = parseInt(trainingRecipientId);

  // Verify training recipient belongs to org
  const trainingRecipient = await scopedFindUnique(orgContext, 'training_recipients', {
    where: { id: trId }
  });

  if (!trainingRecipient) {
    throw new NotFoundError('Training recipient not found');
  }

  // Fetch all participants belonging to this training recipient
  const participants = await prisma.participants.findMany({
    where: {
      trainingRecipientId: trId
    },
    include: {
      role: true,
      training_recipient: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // If projectId is provided, include enrollment information
  let formattedParticipants = [];
  let enrolledIds = [];

  if (projectId) {
    // Get ALL participants (including removed) to determine enrollment status
    const allProjectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parseInt(projectId)
      },
      include: {
        participant: {
          include: {
            role: true,
            training_recipient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Only ACTIVE enrollments count as "enrolled"
    const activeEnrollments = allProjectParticipants.filter(p => p.status === 'active');

    // Separate by training recipient
    const fromThisTR = activeEnrollments.filter(p => p.participant.trainingRecipientId === trId);
    const fromOtherTRs = activeEnrollments.filter(p => p.participant.trainingRecipientId !== trId);

    enrolledIds = fromThisTR.map(p => p.participantId);

    // Format participants from this training recipient
    const thisTrainingRecipientParticipants = participants.map(participant => ({
      id: participant.id,
      firstName: participant.firstName,
      middleName: participant.middleName,
      lastName: participant.lastName,
      email: participant.email,
      status: participant.participantStatus || 'Active',
      department: participant.derpartement,
      role: participant.role?.title || 'Participant',
      roleId: participant.roleId,
      isEnrolled: enrolledIds.includes(participant.id),
      fromOtherTR: false,
      trainingRecipientName: participant.training_recipient?.name
    }));

    // Format enrolled participants from other TRs (read-only, for display)
    const otherTRParticipants = fromOtherTRs.map(enrollment => ({
      id: enrollment.participant.id,
      firstName: enrollment.participant.firstName,
      middleName: enrollment.participant.middleName,
      lastName: enrollment.participant.lastName,
      email: enrollment.participant.email,
      status: enrollment.participant.participantStatus || 'Active',
      department: enrollment.participant.derpartement,
      role: enrollment.participant.role?.title || 'Participant',
      roleId: enrollment.participant.roleId,
      isEnrolled: true,
      fromOtherTR: true,
      trainingRecipientName: enrollment.participant.training_recipient?.name
    }));

    // Combine both lists
    formattedParticipants = [...thisTrainingRecipientParticipants, ...otherTRParticipants];
  } else {
    // No project context - just return all participants from this TR
    formattedParticipants = participants.map(participant => ({
      id: participant.id,
      firstName: participant.firstName,
      middleName: participant.middleName,
      lastName: participant.lastName,
      email: participant.email,
      status: participant.participantStatus || 'Active',
      department: participant.derpartement,
      role: participant.role?.title || 'Participant',
      roleId: participant.roleId,
      isEnrolled: false,
      fromOtherTR: false,
      trainingRecipientName: participant.training_recipient?.name
    }));
  }

  // Count enrolled and available
  const enrolledCount = formattedParticipants.filter(p => p.isEnrolled).length;
  const availableCount = formattedParticipants.length - enrolledCount;

  return res.status(200).json({
    success: true,
    participants: formattedParticipants,
    total: formattedParticipants.length,
    debug: {
      totalFromTR: participants.length,
      enrolled: enrolledCount,
      available: availableCount
    }
  });
}

export default withOrgScope(asyncHandler(handler));
