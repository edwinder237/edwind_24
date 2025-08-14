import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      id,
      name, 
      description, 
      contactPerson,
      email,
      phone,
      address,
      website,
      industry,
      taxId,
      notes,
      updatedBy = 'system'
    } = req.body;

    if (!id || !name || !contactPerson) {
      return res.status(400).json({ 
        error: 'ID, name, and contact person are required' 
      });
    }

    // Check if recipient exists
    const existingRecipient = await prisma.training_recipients.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecipient) {
      return res.status(404).json({
        error: 'Training recipient not found'
      });
    }

    // Check if another recipient with the same name exists (excluding current one)
    const duplicateCheck = await prisma.training_recipients.findFirst({
      where: {
        name: name.trim(),
        sub_organizationId: existingRecipient.sub_organizationId,
        id: { not: parseInt(id) }
      }
    });

    if (duplicateCheck) {
      return res.status(409).json({
        error: 'Training recipient with this name already exists'
      });
    }

    // Update training recipient
    const updatedRecipient = await prisma.training_recipients.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description,
        contactPerson,
        email,
        phone,
        address,
        website,
        industry,
        taxId,
        notes,
        updatedBy,
        updatedAt: new Date()
      },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Training recipient updated successfully',
      trainingRecipient: updatedRecipient
    });
  } catch (error) {
    console.error('Error updating training recipient:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}