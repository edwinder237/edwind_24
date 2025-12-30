/**
 * ============================================
 * POST /api/training-recipients/createOrFind
 * ============================================
 *
 * Creates a new training recipient or returns existing one.
 * Uses org scoping for proper sub-organization assignment.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedCreate, scopedFindFirst } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    taxId,
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
    taxId: taxId || null,
    notes: notes || null,
    createdBy: orgContext.userId
  });

  res.status(201).json({
    success: true,
    message: 'Training recipient created successfully',
    trainingRecipient: newRecipient,
    isNew: true
  });
}

export default withOrgScope(asyncHandler(handler));