import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { participantId, updates } = req.body;

  if (!participantId) {
    return res.status(400).json({ error: "Participant ID is required" });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: "Updates object is required" });
  }

  try {
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

    // Update the participant
    const updatedParticipant = await prisma.participants.update({
      where: {
        id: participantId
      },
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
      return res.status(404).json({ error: "Participant not found" });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Email already exists. Please use a different email address." 
      });
    }

    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}