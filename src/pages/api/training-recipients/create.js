/**
 * ============================================
 * POST /api/training-recipients/create
 * ============================================
 *
 * Creates a new training recipient for the current organization.
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
    notes,
    location,
    img
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
    return res.status(409).json({
      error: 'Training recipient with this name already exists'
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
    location: location ? JSON.stringify(location) : null,
    img: img || null,
    createdBy: orgContext.userId
  });

  res.status(201).json({
    success: true,
    message: 'Training recipient created successfully',
    trainingRecipient: newRecipient
  });
}

export default withOrgScope(asyncHandler(handler));