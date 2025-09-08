/**
 * Central configuration file for all application constants
 * This file manages hardcoded statuses and other constant values
 * to make them easier to maintain and update across the application
 */

// Project Status Options
export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'pending',
  ONGOING: 'ongoing',
  STARTED: 'started',
  COMPLETED: 'completed',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
  SUSPENDED: 'suspended',
  ON_HOLD: 'on_hold'
};

// Participant Status Options
export const PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  LOA: 'LOA', // Leave of Absence
  TERMINATED: 'Terminated',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

// Course Status Options
export const COURSE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

// Module Status Options
export const MODULE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'archived',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Activity Status Options
export const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'archived',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Training Record Status
export const TRAINING_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
};

// Event Status Options
export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed'
};

// User Status Options
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected'
};

// Organization Status Options
export const ORGANIZATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

// Instructor Status Options
export const INSTRUCTOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated'
};

// Import Job Status
export const IMPORT_JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Curriculum Status Options
export const CURRICULUM_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

// Default Values
export const DEFAULTS = {
  USER_STATUS: USER_STATUS.ACTIVE,
  PROJECT_STATUS: PROJECT_STATUS.ACTIVE,
  PARTICIPANT_STATUS: PARTICIPANT_STATUS.ACTIVE,
  COURSE_STATUS: COURSE_STATUS.DRAFT,
  MODULE_STATUS: MODULE_STATUS.DRAFT,
  ACTIVITY_STATUS: ACTIVITY_STATUS.DRAFT,
  EVENT_STATUS: EVENT_STATUS.SCHEDULED,
  INSTRUCTOR_STATUS: INSTRUCTOR_STATUS.ACTIVE,
  CURRICULUM_STATUS: CURRICULUM_STATUS.DRAFT
};

// Role Types (for sub_organization_participant_role)
export const PARTICIPANT_ROLES = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  COORDINATOR: 'Coordinator',
  OBSERVER: 'Observer',
  ADMIN: 'Admin'
};

// User Roles (system-wide)
export const USER_ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  INSTRUCTOR: 'Instructor',
  PARTICIPANT: 'Participant',
  VIEWER: 'Viewer'
};

// Status Colors for UI (Material-UI chip colors)
export const STATUS_COLORS = {
  active: 'success',
  completed: 'default',
  pending: 'warning',
  inactive: 'error',
  draft: 'info',
  published: 'success',
  archived: 'default',
  ongoing: 'primary',
  terminated: 'error',
  LOA: 'warning'
};

// Import Options
export const IMPORT_OPTIONS = {
  REPLACE: 'replace',
  APPEND: 'append',
  SKIP_EXISTING: 'skip_existing'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm',
  FULL: 'MMMM DD, YYYY HH:mm A'
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  DEFAULT_PAGE: 1
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_SPREADSHEET_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
};

// API Response Messages
export const API_MESSAGES = {
  SUCCESS: {
    CREATE: 'Successfully created',
    UPDATE: 'Successfully updated',
    DELETE: 'Successfully deleted',
    FETCH: 'Successfully fetched data'
  },
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    VALIDATION: 'Validation error. Please check your input.',
    SERVER: 'Server error. Please try again later.'
  }
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[\d\s\-\+\(\)]+$/
};

// Duration Units (for courses, activities, etc.)
export const DURATION_UNITS = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Languages
export const LANGUAGES = {
  EN: 'en',
  //ES: 'es',
  FR: 'fr',
  //DE: 'de',
 // IT: 'it',
 // PT: 'pt',
 // NL: 'nl',
 // RU: 'ru',
  //ZH: 'zh',
//  JA: 'ja',
 // KO: 'ko',
 // AR: 'ar'
};

// Export all constants as default
export default {
  PROJECT_STATUS,
  PARTICIPANT_STATUS,
  COURSE_STATUS,
  MODULE_STATUS,
  ACTIVITY_STATUS,
  TRAINING_STATUS,
  EVENT_STATUS,
  USER_STATUS,
  ORGANIZATION_STATUS,
  INSTRUCTOR_STATUS,
  IMPORT_JOB_STATUS,
  CURRICULUM_STATUS,
  DEFAULTS,
  PARTICIPANT_ROLES,
  USER_ROLES,
  STATUS_COLORS,
  IMPORT_OPTIONS,
  DATE_FORMATS,
  PAGINATION,
  FILE_LIMITS,
  API_MESSAGES,
  VALIDATION,
  DURATION_UNITS,
  PRIORITY_LEVELS,
  LANGUAGES
};