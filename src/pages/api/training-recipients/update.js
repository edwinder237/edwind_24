/**
 * ============================================
 * PUT /api/training-recipients/update
 * ============================================
 *
 * Updates a training recipient with org scoping verification.
 * Verifies recipient belongs to user's organization before updating.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedFindFirst } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
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
    status
  } = req.body;

  if (!id) {
    throw new ValidationError('ID is required');
  }

  // If only updating status (for archive/activate), allow without name
  const isStatusOnlyUpdate = status && !name;

  if (!isStatusOnlyUpdate && !name) {
    throw new ValidationError('ID and name are required');
  }

  const recipientId = parseInt(id);

  // Check if recipient exists and belongs to org
  const existingRecipient = await scopedFindUnique(orgContext, 'training_recipients', {
    where: { id: recipientId }
  });

  if (!existingRecipient) {
    throw new NotFoundError('Training recipient not found');
  }

  // Only check for duplicate name if we're updating the name
  if (name) {
    const duplicateCheck = await scopedFindFirst(orgContext, 'training_recipients', {
      where: {
        name: name.trim(),
        id: { not: recipientId }
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
    updatedBy: orgContext.userId,
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
    where: { id: recipientId },
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
}

export default withOrgScope(asyncHandler(handler));