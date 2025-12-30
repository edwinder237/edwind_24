/**
 * Central configuration file for all application constants
 * This file manages hardcoded statuses and other constant values
 * to make them easier to maintain and update across the application
 */

// Project Status Options - Normalized values
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
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

// Project Status Configuration - Single source of truth
// Contains value (for DB/logic), label (for display), and color (for UI)
export const PROJECT_STATUS_CONFIG = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'ongoing', label: 'Ongoing', color: 'primary' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'default' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
  { value: 'postponed', label: 'Postponed', color: 'warning' },
  { value: 'suspended', label: 'Suspended', color: 'error' },
  { value: 'on_hold', label: 'On Hold', color: 'warning' },
  { value: 'draft', label: 'Draft', color: 'info' },
  { value: 'archived', label: 'Archived', color: 'default' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'started', label: 'Started', color: 'primary' }
];

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

// Choice Options (with text/value structure for dropdowns)
export const PARTICIPANT_ROLE_CHOICES = [
  { text: 'Participant', value: 'Participant' },
  { text: 'Team Leader', value: 'Team Leader' },
  { text: 'Observer', value: 'Observer' }
];

export const EXPERIENCE_CHOICES = [
  { text: 'Start Up', value: '0' },
  { text: '6 Months', value: '0.5' },
  { text: '1 Year', value: '1' },
  { text: '2 Years', value: '2' },
  { text: '3 Years', value: '3' },
  { text: '4 Years', value: '4' },
  { text: '5 Years', value: '5' },
  { text: '6 Years', value: '6' },
  { text: '10+ Years', value: '10' }
];

export const PHONE_CODE_CHOICES = [
  { text: '+91', value: '91' },
  { text: '1-671', value: '1-671' },
  { text: '+36', value: '36' },
  { text: '(255)', value: '225' },
  { text: '+39', value: '39' },
  { text: '1-876', value: '1-876' },
  { text: '1-664', value: '1-664' },
  { text: '+95', value: '95' },
  { text: '(264)', value: '264' },
  { text: '+7', value: '7' },
  { text: '(254)', value: '254' },
  { text: '(373)', value: '373' }
];

export const PROJECT_STATUS_CHOICES = Object.entries(PROJECT_STATUS).map(([key, value]) => ({
  text: value.charAt(0).toUpperCase() + value.slice(1),
  value: value
}));

export const PARTICIPANT_STATUS_CHOICES = Object.entries(PARTICIPANT_STATUS).map(([key, value]) => ({
  text: value.charAt(0).toUpperCase() + value.slice(1),
  value: value
}));

export const USER_ROLE_CHOICES = Object.entries(USER_ROLES).map(([key, value]) => ({
  text: value,
  value: value
}));

export const TRAINING_STATUS_CHOICES = Object.entries(TRAINING_STATUS).map(([key, value]) => ({
  text: value,
  value: value
}));

// Attendance Status Options
export const ATTENDANCE_STATUS_CHOICES = [
  { text: 'Scheduled', value: 'scheduled', color: 'info.main' },
  { text: 'Present', value: 'present', color: 'success.main' },
  { text: 'Late', value: 'late', color: 'warning.main' },
  { text: 'Not Needed', value: 'not_needed', color: 'warning.main' },
  { text: 'Absent', value: 'absent', color: 'error.main' }
];

// Participant Action Options
export const PARTICIPANT_ACTION_CHOICES = [
  { text: 'Move to Group', value: 'move_to_group', icon: 'TeamOutlined' },
  { text: 'Remove from Event', value: 'remove_from_event', icon: 'Remove', color: 'error.main' }
];

// Export all constants as default
export default {
  PROJECT_STATUS,
  PROJECT_STATUS_CONFIG,
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
  LANGUAGES,
  PARTICIPANT_ROLE_CHOICES,
  EXPERIENCE_CHOICES,
  PHONE_CODE_CHOICES,
  PROJECT_STATUS_CHOICES,
  PARTICIPANT_STATUS_CHOICES,
  USER_ROLE_CHOICES,
  TRAINING_STATUS_CHOICES,
  ATTENDANCE_STATUS_CHOICES,
  PARTICIPANT_ACTION_CHOICES
};