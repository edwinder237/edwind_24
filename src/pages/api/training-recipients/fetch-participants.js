import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { trainingRecipientId, projectId } = req.query;

    console.log('[fetch-participants] Request params:', { trainingRecipientId, projectId });

    if (!trainingRecipientId) {
      return res.status(400).json({
        success: false,
        message: 'Training recipient ID is required'
      });
    }

    // Fetch all participants belonging to this training recipient
    const participants = await prisma.participants.findMany({
      where: {
        trainingRecipientId: parseInt(trainingRecipientId)
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

    console.log('[fetch-participants] Found participants from TR:', participants.length);
    console.log('[fetch-participants] Participant IDs:', participants.map(p => ({ id: p.id, email: p.email, trainingRecipientId: p.trainingRecipientId })));

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
      const fromThisTR = activeEnrollments.filter(p => p.participant.trainingRecipientId === parseInt(trainingRecipientId));
      const fromOtherTRs = activeEnrollments.filter(p => p.participant.trainingRecipientId !== parseInt(trainingRecipientId));

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

    // Debug response
    const response = {
      success: true,
      participants: formattedParticipants,
      total: formattedParticipants.length,
      debug: {
        totalFromTR: participants.length,
        enrolled: enrolledCount,
        available: availableCount
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching training recipient participants:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch participants',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}