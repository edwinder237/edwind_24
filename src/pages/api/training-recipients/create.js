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
      location,
      img,
      sub_organizationId = 1, // Default to first sub-organization for now
      createdBy = 'system' // Default value
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Name is required' 
      });
    }

    // Check if training recipient already exists
    const existingRecipient = await prisma.training_recipients.findFirst({
      where: {
        name: name.trim(),
        sub_organizationId: parseInt(sub_organizationId)
      }
    });

    if (existingRecipient) {
      return res.status(409).json({
        error: 'Training recipient with this name already exists'
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
        location: location ? JSON.stringify(location) : null,
        img: img || null,
        sub_organizationId: parseInt(sub_organizationId),
        createdBy
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

    res.status(201).json({
      success: true,
      message: 'Training recipient created successfully',
      trainingRecipient: newRecipient
    });
  } catch (error) {
    console.error('Error creating training recipient:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}