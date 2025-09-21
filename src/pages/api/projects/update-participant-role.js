import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participantId, roleId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    // Update participant role using the role relationship
    const updatedParticipant = await prisma.participants.update({
      where: { id: participantId.toString() }, // participants.id is a String in schema
      data: { 
        role: roleId ? {
          connect: { id: parseInt(roleId) }
        } : {
          disconnect: true
        },
        lastUpdated: new Date(),
        updatedby: 'system' // You can replace this with actual user ID
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
    res.status(500).json({ 
      error: 'Failed to update participant role',
      details: error.message 
    });
  }
}