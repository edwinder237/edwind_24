import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { trainingRecipientId, projectId } = req.query;

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
        role: true
      }
    });

    // If projectId is provided, filter out participants already in the project
    let availableParticipants = participants;
    
    if (projectId) {
      // Get IDs of participants already in the project
      const enrolledParticipantIds = await prisma.project_participants.findMany({
        where: {
          projectId: parseInt(projectId)
        },
        select: {
          participantId: true
        }
      });

      const enrolledIds = enrolledParticipantIds.map(p => p.participantId);
      
      // Filter out already enrolled participants
      availableParticipants = participants.filter(p => !enrolledIds.includes(p.id));
    }

    // Format the response
    const formattedParticipants = availableParticipants.map(participant => ({
      id: participant.id,
      firstName: participant.firstName,
      middleName: participant.middleName,
      lastName: participant.lastName,
      email: participant.email,
      status: participant.participantStatus || 'Active',
      department: participant.derpartement,
      role: participant.role?.title || 'Participant',
      roleId: participant.roleId,
      isEnrolled: false
    }));

    return res.status(200).json({
      success: true,
      participants: formattedParticipants,
      total: formattedParticipants.length
    });

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