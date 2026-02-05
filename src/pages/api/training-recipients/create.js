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
import { getOrgSubscription } from '../../../lib/features/subscriptionService';
import { canAccessFeature } from '../../../lib/features/featureAccess';

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

  // Check training_recipients feature access
  const subscription = await getOrgSubscription(orgContext.organizationId);
  if (subscription) {
    const featureCheck = canAccessFeature({
      subscription,
      userClaims: orgContext,
      featureKey: 'training_recipients'
    });
    console.log('🔍 training_recipients feature check:', {
      planId: subscription.planId,
      canAccess: featureCheck.canAccess,
      reason: featureCheck.reason,
      hierarchyLevel: orgContext.hierarchyLevel,
      appRole: orgContext.appRole,
      isClientAdmin: orgContext.isClientAdmin,
      permissionsCount: orgContext.permissions?.length,
      hasCreatePerm: orgContext.permissions?.includes('training_recipients:create'),
      hasWildcard: orgContext.permissions?.includes('*:*')
    });
    if (!featureCheck.canAccess) {
      return res.status(403).json({
        error: 'Feature not available',
        message: featureCheck.message || 'Training recipients management is not available on your current plan',
        reason: featureCheck.reason,
        requiredPlan: featureCheck.requiredPlan,
        currentPlan: featureCheck.currentPlan,
        upgradeUrl: '/upgrade'
      });
    }
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