/**
 * Custom Error Classes
 *
 * Provides consistent error handling with proper HTTP status codes
 * for organization-scoped operations.
 *
 * Error Semantics:
 * - 401 Unauthorized: No organization selected or invalid authentication
 * - 403 Forbidden: User authenticated but lacks permission for action
 * - 404 Not Found: Resource doesn't exist OR user doesn't have access (hides existence)
 * - 400 Bad Request: Invalid input or validation failure
 * - 500 Internal Server Error: Unexpected server error
 */

/**
 * Base Application Error
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * 401 Unauthorized
 * User is not authenticated or session is invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden
 * User is authenticated but lacks permission for the requested action
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found
 * Resource doesn't exist OR user doesn't have access to it
 * Used to hide existence of resources outside user's organization
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 400 Bad Request
 * Invalid input, validation failure, or malformed request
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 409 Conflict
 * Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 500 Internal Server Error
 * Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

/**
 * Organization-Specific Errors
 */

/**
 * No organization selected in session
 * User must select an organization before accessing resources
 */
export class NoOrganizationError extends UnauthorizedError {
  constructor(message = 'No organization selected') {
    super(message, { requiresOrgSelection: true });
    this.code = 'NO_ORGANIZATION_SELECTED';
  }
}

/**
 * User is not a member of the requested organization
 */
export class OrganizationAccessDeniedError extends ForbiddenError {
  constructor(message = 'Access denied to organization') {
    super(message);
    this.code = 'ORGANIZATION_ACCESS_DENIED';
  }
}

/**
 * Resource belongs to a different organization
 * Returns 404 to hide existence
 */
export class ResourceNotInOrganizationError extends NotFoundError {
  constructor(resourceType = 'Resource', message = null) {
    super(message || `${resourceType} not found`);
    this.code = 'RESOURCE_NOT_IN_ORGANIZATION';
  }
}

/**
 * Sub-organization validation failed
 */
export class InvalidSubOrganizationError extends ValidationError {
  constructor(message = 'Invalid sub-organization') {
    super(message);
    this.code = 'INVALID_SUB_ORGANIZATION';
  }
}

/**
 * Admin-only action attempted by non-admin user
 */
export class AdminRequiredError extends ForbiddenError {
  constructor(message = 'Administrator privileges required') {
    super(message);
    this.code = 'ADMIN_REQUIRED';
  }
}

/**
 * User account is inactive/deactivated
 */
export class AccountInactiveError extends UnauthorizedError {
  constructor(message = 'Your account has been deactivated') {
    super(message);
    this.code = 'ACCOUNT_INACTIVE';
  }
}

/**
 * Error Handler Middleware
 * Converts errors to consistent API responses
 */
export function errorHandler(error, req, res) {
  // Handle custom AppError instances
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Handle Prisma errors
  if (error.code === 'P2025') {
    // Record not found
    return res.status(404).json({
      error: 'Resource not found',
      code: 'NOT_FOUND'
    });
  }

  if (error.code?.startsWith('P')) {
    // Other Prisma errors
    console.error('Prisma error:', error);
    return res.status(500).json({
      error: 'Database error',
      code: 'DATABASE_ERROR'
    });
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

/**
 * Async Error Handler Wrapper
 * Wraps async API route handlers to catch errors
 *
 * Usage:
 * export default asyncHandler(async (req, res) => {
 *   // Your route logic
 * });
 */
export function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  };
}

/**
 * Assert Utilities
 * Throw errors if conditions aren't met
 */

export function assertOrganizationSelected(organizationId) {
  if (!organizationId) {
    throw new NoOrganizationError();
  }
}

export function assertAdmin(role) {
  const isAdminRole = role === 'admin' || role === 'Admin' || role === 'owner';
  if (!isAdminRole) {
    throw new AdminRequiredError();
  }
}

export function assertResourceExists(resource, resourceType = 'Resource') {
  if (!resource) {
    throw new NotFoundError(`${resourceType} not found`);
  }
}

export function assertResourceInOrganization(resource, subOrganizationIds, resourceType = 'Resource') {
  if (!resource || !subOrganizationIds.includes(resource.sub_organizationId)) {
    throw new ResourceNotInOrganizationError(resourceType);
  }
}

export function assertValidInput(condition, message = 'Invalid input') {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * Export all error classes and utilities
 */
export default {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalServerError,
  NoOrganizationError,
  OrganizationAccessDeniedError,
  ResourceNotInOrganizationError,
  InvalidSubOrganizationError,
  AdminRequiredError,
  AccountInactiveError,
  errorHandler,
  asyncHandler,
  assertOrganizationSelected,
  assertAdmin,
  assertResourceExists,
  assertResourceInOrganization,
  assertValidInput
};
