import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
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
      sub_organizationId, 
      createdBy 
    } = req.body;

    if (!name || !sub_organizationId || !createdBy) {
      return res.status(400).json({ 
        error: 'Name, sub_organizationId, and createdBy are required' 
      });
    }

    // Check if training recipient already exists for this sub-organization
    const existingRecipient = await prisma.training_recipients.findFirst({
      where: {
        name: name.trim(),
        sub_organizationId: parseInt(sub_organizationId)
      }
    });

    if (existingRecipient) {
      return res.status(200).json({
        success: true,
        message: 'Training recipient already exists',
        trainingRecipient: existingRecipient,
        isNew: false
      });
    }

    // Create new training recipient
    const newRecipient = await prisma.training_recipients.create({
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
        sub_organizationId: parseInt(sub_organizationId),
        createdBy
      }
    });

    res.status(201).json({
      success: true,
      message: 'Training recipient created successfully',
      trainingRecipient: newRecipient,
      isNew: true
    });
  } catch (error) {
    console.error('Error creating training recipient:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}