import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, participantId } = req.body;
    
    if (!groupId || !participantId) {
      return res.status(400).json({ error: 'Group ID and Participant ID are required' });
    }

    // Check if the participant is already in the group
    const existingRelation = await prisma.group_participants.findFirst({
      where: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

    if (existingRelation) {
      return res.status(400).json({ error: 'Participant is already in this group' });
    }

    // Add participant to group
    const groupParticipant = await prisma.group_participants.create({
      data: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

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
      group: updatedGroup 
    });
  } catch (error) {
    console.error('Error adding participant to group:', error);
    res.status(500).json({ error: 'Failed to add participant to group', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}