/**
 * ============================================
 * POST /api/training-recipients/createOrFind
 * ============================================
 *
 * Creates a new training recipient or returns existing one.
 * Uses org scoping for proper sub-organization assignment.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedCreate, scopedFindFirst } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {

  const { orgContext } = req;
  const {
    name,
    description,
    contactPerson,
    email,
    phone,
    address,
    website,
    industry,
    notes
  } = req.body;

  if (!name) {
    throw new ValidationError('Name is required');
  }

  // Check if training recipient already exists in this organization
  const existingRecipient = await scopedFindFirst(orgContext, 'training_recipients', {
    where: {
      name: name.trim()
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

  // Create new training recipient with automatic org scoping
  const newRecipient = await scopedCreate(orgContext, 'training_recipients', {
    name: name.trim(),
    description: description || null,
    contactPerson: contactPerson || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    website: website || null,
    industry: industry || null,
    notes: notes || null,
    createdBy: orgContext.userId
  });

  return res.status(201).json({
    success: true,
    message: 'Training recipient created successfully',
    trainingRecipient: newRecipient,
    isNew: true
  });
  }
});