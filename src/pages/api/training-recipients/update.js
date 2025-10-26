import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Update API received body:', req.body);
    
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
      location,
      img,
      status,
      updatedBy = 'system'
    } = req.body;

    console.log('Extracted fields:', { id, name, status, contactPerson });

    if (!id) {
      return res.status(400).json({
        error: 'ID is required'
      });
    }

    // If only updating status (for archive/activate), allow without name
    const isStatusOnlyUpdate = status && !name;

    if (!isStatusOnlyUpdate && !name) {
      console.log('Validation failed - missing required fields:', {
        id: !!id,
        name: !!name,
        contactPerson: !!contactPerson
      });
      return res.status(400).json({
        error: 'ID and name are required'
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

    // Only check for duplicate name if we're updating the name
    if (name) {
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
    }

    // Build update data object - only include fields that are provided
    const updateData = {
      updatedBy,
      updatedAt: new Date()
    };

    // Only add fields if they're provided
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location ? JSON.stringify(location) : null;
    if (img !== undefined) updateData.img = img;
    if (status !== undefined) updateData.status = status;

    // Update training recipient
    const updatedRecipient = await prisma.training_recipients.update({
      where: { id: parseInt(id) },
      data: updateData,
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