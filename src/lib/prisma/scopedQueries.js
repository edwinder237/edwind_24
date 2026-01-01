/**
 * Scoped Prisma Query Helpers
 *
 * Provides organization-scoped query functions that automatically
 * filter by sub_organizationId to prevent cross-org data leaks.
 *
 * Key Features:
 * - Auto-filters queries by accessible sub-organization IDs
 * - Returns null instead of throwing for unauthorized access (404 semantics)
 * - Validates ownership before mutations (create/update/delete)
 * - Type-safe wrappers around Prisma client
 *
 * Usage:
 * const projects = await scopedFindMany(req.orgContext, 'projects', { ... });
 * const project = await scopedFindUnique(req.orgContext, 'projects', { where: { id: 1 } });
 */

import prisma from '../prisma.js';
import {
  NotFoundError,
  ResourceNotInOrganizationError,
  InvalidSubOrganizationError,
  ValidationError
} from '../errors/index.js';

/**
 * Validate that a sub-organization ID belongs to the current organization
 * @param {Object} orgContext - Organization context from middleware
 * @param {number} subOrganizationId - Sub-organization ID to validate
 * @throws {InvalidSubOrganizationError} If sub-org doesn't belong to org
 */
function validateSubOrganization(orgContext, subOrganizationId) {
  if (!orgContext || !orgContext.subOrganizationIds) {
    throw new ValidationError('Organization context is required');
  }

  if (!subOrganizationId) {
    throw new ValidationError('sub_organizationId is required');
  }

  if (!orgContext.subOrganizationIds.includes(subOrganizationId)) {
    throw new InvalidSubOrganizationError(
      'Sub-organization does not belong to current organization'
    );
  }
}

/**
 * Add sub-organization filter to where clause
 * @param {Object} orgContext - Organization context
 * @param {Object} where - Original where clause
 * @returns {Object} Where clause with sub-org filter
 */
function addSubOrgFilter(orgContext, where = {}) {
  if (!orgContext || !orgContext.subOrganizationIds) {
    return where;
  }

  return {
    ...where,
    sub_organizationId: {
      in: orgContext.subOrganizationIds
    }
  };
}

/**
 * Find many records filtered by organization
 * @param {Object} orgContext - Organization context from req.orgContext
 * @param {string} model - Prisma model name (e.g., 'projects', 'participants')
 * @param {Object} options - Prisma query options (where, include, orderBy, etc.)
 * @returns {Promise<Array>} Filtered records
 */
export async function scopedFindMany(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const { where, ...rest } = options;

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].findMany({
    where: scopedWhere,
    ...rest
  });
}

/**
 * Find unique record and verify it belongs to organization
 * Returns null if record doesn't exist OR doesn't belong to org (404 semantics)
 *
 * @param {Object} orgContext - Organization context from req.orgContext
 * @param {string} model - Prisma model name
 * @param {Object} options - Prisma query options
 * @returns {Promise<Object|null>} Record or null
 */
export async function scopedFindUnique(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const record = await prisma[model].findUnique(options);

  // Record doesn't exist
  if (!record) {
    return null;
  }

  // Check if record belongs to accessible sub-organizations
  if (record.sub_organizationId && !orgContext.subOrganizationIds.includes(record.sub_organizationId)) {
    // Return null to hide existence (404 semantics)
    return null;
  }

  return record;
}

/**
 * Find first record filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} options - Prisma query options
 * @returns {Promise<Object|null>} First matching record or null
 */
export async function scopedFindFirst(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const { where, ...rest } = options;

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].findFirst({
    where: scopedWhere,
    ...rest
  });
}

/**
 * Count records filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} options - Prisma query options
 * @returns {Promise<number>} Count of matching records
 */
export async function scopedCount(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const { where } = options;

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].count({
    where: scopedWhere
  });
}

/**
 * Create record with sub-organization validation
 * Validates that sub_organizationId belongs to current org
 *
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} data - Data to create
 * @returns {Promise<Object>} Created record
 */
export async function scopedCreate(orgContext, model, data) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  // Validate sub_organizationId if provided
  if (data.sub_organizationId) {
    validateSubOrganization(orgContext, data.sub_organizationId);
  } else {
    // Default to first sub-org if not specified
    if (orgContext.subOrganizationIds.length === 0) {
      throw new ValidationError('No sub-organizations available');
    }
    data.sub_organizationId = orgContext.subOrganizationIds[0];
  }

  return await prisma[model].create({
    data
  });
}

/**
 * Update record with ownership verification
 * Verifies record belongs to org before updating
 *
 * Supports two call signatures:
 * 1. scopedUpdate(orgContext, model, { where, data, include, select })  - Prisma-style options
 * 2. scopedUpdate(orgContext, model, where, data)  - Legacy separate args
 *
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} whereOrOptions - Where clause OR full options object { where, data, include, select }
 * @param {Object} [data] - Data to update (only if using legacy signature)
 * @returns {Promise<Object>} Updated record
 * @throws {NotFoundError} If record doesn't exist or doesn't belong to org
 */
export async function scopedUpdate(orgContext, model, whereOrOptions, data) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  // Detect call signature - if whereOrOptions has 'where' and 'data' keys, it's Prisma-style
  let where, updateData, include, select;

  if (whereOrOptions.where && whereOrOptions.data) {
    // Prisma-style: scopedUpdate(ctx, model, { where, data, include?, select? })
    where = whereOrOptions.where;
    updateData = whereOrOptions.data;
    include = whereOrOptions.include;
    select = whereOrOptions.select;
  } else {
    // Legacy style: scopedUpdate(ctx, model, where, data)
    where = whereOrOptions;
    updateData = data;
  }

  // First verify record exists and belongs to org
  const existing = await scopedFindUnique(orgContext, model, { where });

  if (!existing) {
    throw new NotFoundError(`${model} not found`);
  }

  // If updating sub_organizationId, validate new value
  if (updateData.sub_organizationId && updateData.sub_organizationId !== existing.sub_organizationId) {
    validateSubOrganization(orgContext, updateData.sub_organizationId);
  }

  // Build update options
  const updateOptions = { where, data: updateData };
  if (include) updateOptions.include = include;
  if (select) updateOptions.select = select;

  // Perform update
  return await prisma[model].update(updateOptions);
}

/**
 * Update many records filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @param {Object} data - Data to update
 * @returns {Promise<{count: number}>} Update result
 */
export async function scopedUpdateMany(orgContext, model, where, data) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].updateMany({
    where: scopedWhere,
    data
  });
}

/**
 * Delete record with ownership verification
 * Verifies record belongs to org before deleting
 *
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause to find record
 * @returns {Promise<Object>} Deleted record
 * @throws {NotFoundError} If record doesn't exist or doesn't belong to org
 */
export async function scopedDelete(orgContext, model, where) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  // First verify record exists and belongs to org
  const existing = await scopedFindUnique(orgContext, model, { where });

  if (!existing) {
    throw new NotFoundError(`${model} not found`);
  }

  // Perform delete
  return await prisma[model].delete({
    where
  });
}

/**
 * Delete many records filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @returns {Promise<{count: number}>} Delete result
 */
export async function scopedDeleteMany(orgContext, model, where) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].deleteMany({
    where: scopedWhere
  });
}

/**
 * Aggregate records filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} options - Aggregate options
 * @returns {Promise<Object>} Aggregation result
 */
export async function scopedAggregate(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const { where, ...rest } = options;

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].aggregate({
    where: scopedWhere,
    ...rest
  });
}

/**
 * Group by records filtered by organization
 * @param {Object} orgContext - Organization context
 * @param {string} model - Prisma model name
 * @param {Object} options - Group by options
 * @returns {Promise<Array>} Grouped results
 */
export async function scopedGroupBy(orgContext, model, options = {}) {
  if (!orgContext) {
    throw new ValidationError('Organization context is required');
  }

  const { where, ...rest } = options;

  const scopedWhere = addSubOrgFilter(orgContext, where);

  return await prisma[model].groupBy({
    where: scopedWhere,
    ...rest
  });
}

/**
 * Export all scoped query helpers
 */
export default {
  scopedFindMany,
  scopedFindUnique,
  scopedFindFirst,
  scopedCount,
  scopedCreate,
  scopedUpdate,
  scopedUpdateMany,
  scopedDelete,
  scopedDeleteMany,
  scopedAggregate,
  scopedGroupBy,
  validateSubOrganization,
  addSubOrgFilter
};
