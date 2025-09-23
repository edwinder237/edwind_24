import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Participant ID is required' 
      });
    }

    // First, check if participant exists
    const existingParticipant = await prisma.participants.findUnique({
      where: {
        id: participantId
      }
    });

    if (!existingParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Delete all related project_participants records first
    await prisma.project_participants.deleteMany({
      where: {
        participantId: participantId
      }
    });

    // Delete any tool access records
    await prisma.toolAccesses.deleteMany({
      where: {
        participantId: participantId
      }
    });

    // Delete the participant
    await prisma.participants.delete({
      where: {
        id: participantId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Participant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting participant:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to delete participant',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}