import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, participantId } = req.body;
    
    if (!groupId || !participantId) {
      return res.status(400).json({ error: 'Group ID and Participant ID are required' });
    }

    // Remove participant from group
    const deletedRelation = await prisma.group_participants.deleteMany({
      where: {
        groupId: parseInt(groupId),
        participantId: parseInt(participantId),
      },
    });

    if (deletedRelation.count === 0) {
      return res.status(404).json({ error: 'Participant not found in this group' });
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
      message: 'Participant removed from group successfully',
      group: updatedGroup 
    });
  } catch (error) {
    console.error('Error removing participant from group:', error);
    res.status(500).json({ error: 'Failed to remove participant from group', details: error.message });
  }
}