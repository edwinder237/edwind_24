/**
 * Domain Event Definitions
 * 
 * This file contains all domain event type definitions for the EDWIND application.
 * Domain events represent significant business moments that have occurred.
 * 
 * Event Naming Convention:
 * - Past tense (something that has happened)
 * - Domain-specific context
 * - Clear and descriptive
 */

// ==============================|| ATTENDANCE EVENTS ||============================== //

export const AttendanceEvents = {
  // Attendance status changes
  PARTICIPANT_MARKED_PRESENT: 'attendance.participant_marked_present',
  PARTICIPANT_MARKED_ABSENT: 'attendance.participant_marked_absent',
  PARTICIPANT_ARRIVED_LATE: 'attendance.participant_arrived_late',
  ATTENDANCE_STATUS_CHANGED: 'attendance.status_changed',
  
  // Bulk operations
  ALL_PARTICIPANTS_MARKED_PRESENT: 'attendance.all_marked_present',
  ATTENDANCE_BATCH_UPDATED: 'attendance.batch_updated',
  
  // Tracking
  ATTENDANCE_REPORT_GENERATED: 'attendance.report_generated',
  ATTENDANCE_THRESHOLD_REACHED: 'attendance.threshold_reached'
};

// ==============================|| ENROLLMENT EVENTS ||============================== //

export const EnrollmentEvents = {
  // Individual enrollment
  PARTICIPANT_ENROLLED_IN_EVENT: 'enrollment.participant_enrolled',
  PARTICIPANT_REMOVED_FROM_EVENT: 'enrollment.participant_removed',
  PARTICIPANT_ENROLLMENT_FAILED: 'enrollment.participant_failed',
  
  // Group enrollment
  GROUP_ENROLLED_IN_EVENT: 'enrollment.group_enrolled',
  GROUP_REMOVED_FROM_EVENT: 'enrollment.group_removed',
  
  // Bulk operations
  BULK_ENROLLMENT_COMPLETED: 'enrollment.bulk_completed',
  BULK_ENROLLMENT_PARTIALLY_FAILED: 'enrollment.bulk_partial_failure',
  
  // Capacity
  EVENT_CAPACITY_REACHED: 'enrollment.capacity_reached',
  EVENT_CAPACITY_WARNING: 'enrollment.capacity_warning'
};

// ==============================|| PROJECT EVENTS ||============================== //

export const ProjectEvents = {
  // Lifecycle
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_ARCHIVED: 'project.archived',
  PROJECT_ACTIVATED: 'project.activated',
  
  // Status changes
  PROJECT_STATUS_CHANGED: 'project.status_changed',
  PROJECT_STARTED: 'project.started',
  PROJECT_COMPLETED: 'project.completed',
  PROJECT_CANCELLED: 'project.cancelled',
  
  // Participants
  PARTICIPANT_ADDED_TO_PROJECT: 'project.participant_added',
  PARTICIPANT_REMOVED_FROM_PROJECT: 'project.participant_removed',
  
  // Progress
  PROJECT_MILESTONE_REACHED: 'project.milestone_reached',
  PROJECT_PROGRESS_UPDATED: 'project.progress_updated'
};

// ==============================|| GROUP EVENTS ||============================== //

export const GroupEvents = {
  // Lifecycle
  GROUP_CREATED: 'group.created',
  GROUP_UPDATED: 'group.updated',
  GROUP_DELETED: 'group.deleted',

  // Membership
  PARTICIPANT_ADDED_TO_GROUP: 'group.participant_added',
  PARTICIPANT_ADD_TO_GROUP_FAILED: 'group.participant_add_failed',
  PARTICIPANT_REMOVED_FROM_GROUP: 'group.participant_removed',
  PARTICIPANT_REMOVE_FROM_GROUP_FAILED: 'group.participant_remove_failed',
  PARTICIPANT_MOVED_BETWEEN_GROUPS: 'group.participant_moved',
  PARTICIPANT_MOVE_BETWEEN_GROUPS_FAILED: 'group.participant_move_failed',

  // Curriculum
  CURRICULUM_ASSIGNED_TO_GROUP: 'group.curriculum_assigned',
  CURRICULUM_REMOVED_FROM_GROUP: 'group.curriculum_removed',

  // Progress
  GROUP_PROGRESS_CALCULATED: 'group.progress_calculated',
  GROUP_COMPLETION_REACHED: 'group.completion_reached'
};

// ==============================|| EVENT (CALENDAR) EVENTS ||============================== //

export const CalendarEvents = {
  // Lifecycle
  EVENT_CREATED: 'calendar.event_created',
  EVENT_UPDATED: 'calendar.event_updated',
  EVENT_DELETED: 'calendar.event_deleted',
  EVENT_CANCELLED: 'calendar.event_cancelled',
  
  // Scheduling
  EVENT_RESCHEDULED: 'calendar.event_rescheduled',
  EVENT_TIME_CONFLICT_DETECTED: 'calendar.time_conflict',
  
  // Instructors
  INSTRUCTOR_ASSIGNED_TO_EVENT: 'calendar.instructor_assigned',
  INSTRUCTOR_REMOVED_FROM_EVENT: 'calendar.instructor_removed',
  
  // Notifications
  EVENT_REMINDER_SENT: 'calendar.reminder_sent',
  EVENT_STARTING_SOON: 'calendar.starting_soon',
  EVENT_STARTED: 'calendar.started',
  EVENT_ENDED: 'calendar.ended'
};

// ==============================|| CURRICULUM EVENTS ||============================== //

export const CurriculumEvents = {
  // Progress tracking
  MODULE_STARTED: 'curriculum.module_started',
  MODULE_COMPLETED: 'curriculum.module_completed',
  ACTIVITY_COMPLETED: 'curriculum.activity_completed',
  COURSE_COMPLETED: 'curriculum.course_completed',
  CURRICULUM_COMPLETED: 'curriculum.curriculum_completed',
  
  // Updates
  CURRICULUM_UPDATED: 'curriculum.updated',
  COURSE_ADDED_TO_CURRICULUM: 'curriculum.course_added',
  COURSE_REMOVED_FROM_CURRICULUM: 'curriculum.course_removed'
};

// ==============================|| PARTICIPANT EVENTS ||============================== //

export const ParticipantEvents = {
  // Lifecycle
  PARTICIPANT_CREATED: 'participant.created',
  PARTICIPANT_UPDATED: 'participant.updated',
  PARTICIPANT_UPDATE_FAILED: 'participant.update.failed',
  PARTICIPANT_DELETED: 'participant.deleted',

  // Role management
  PARTICIPANT_ROLE_UPDATED: 'participant.role_updated',
  PARTICIPANT_ROLE_UPDATE_FAILED: 'participant.role_update_failed',
  PARTICIPANT_ROLE_ASSIGNED: 'participant.role_assigned',
  PARTICIPANT_ROLE_REMOVED: 'participant.role_removed',

  // Profile updates
  PARTICIPANT_PROFILE_UPDATED: 'participant.profile_updated',
  PARTICIPANT_CONTACT_UPDATED: 'participant.contact_updated',

  // Credentials
  PARTICIPANT_CREDENTIALS_SENT: 'participant.credentials_sent',
  PARTICIPANT_CREDENTIALS_FAILED: 'participant.credentials_failed'
};

// ==============================|| USER EVENTS ||============================== //

export const UserEvents = {
  // Authentication
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_SESSION_EXPIRED: 'user.session_expired',

  // Profile
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_PERMISSIONS_UPDATED: 'user.permissions_updated',

  // Activity
  USER_ACTION_PERFORMED: 'user.action_performed',
  USER_IDLE_DETECTED: 'user.idle_detected'
};

// ==============================|| SYSTEM EVENTS ||============================== //

export const SystemEvents = {
  // Data synchronization
  DATA_SYNC_STARTED: 'system.sync_started',
  DATA_SYNC_COMPLETED: 'system.sync_completed',
  DATA_SYNC_FAILED: 'system.sync_failed',
  
  // Cache
  CACHE_INVALIDATED: 'system.cache_invalidated',
  CACHE_REFRESHED: 'system.cache_refreshed',
  
  // Errors
  CRITICAL_ERROR_OCCURRED: 'system.critical_error',
  ERROR_RECOVERED: 'system.error_recovered',
  
  // Performance
  SLOW_OPERATION_DETECTED: 'system.slow_operation',
  MEMORY_WARNING: 'system.memory_warning'
};

// ==============================|| NOTIFICATION EVENTS ||============================== //

export const NotificationEvents = {
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_DISMISSED: 'notification.dismissed',
  EMAIL_SENT: 'notification.email_sent',
  EMAIL_FAILED: 'notification.email_failed'
};

// ==============================|| SETTINGS EVENTS ||============================== //

export const SettingsEvents = {
  // Project settings
  PROJECT_SETTINGS_UPDATED: 'settings.project_updated',
  PROJECT_SCHEDULE_UPDATED: 'settings.schedule_updated',
  PROJECT_INFO_UPDATED: 'settings.project_info_updated',

  // Instructor management
  INSTRUCTOR_ADDED_TO_PROJECT: 'settings.instructor_added',
  INSTRUCTOR_REMOVED_FROM_PROJECT: 'settings.instructor_removed',

  // Topics and curriculums
  PROJECT_TOPICS_UPDATED: 'settings.topics_updated',
  PROJECT_CURRICULUMS_UPDATED: 'settings.curriculums_updated',

  // Training recipient
  TRAINING_RECIPIENT_UPDATED: 'settings.training_recipient_updated',

  // Settings sync
  SETTINGS_SYNCED: 'settings.synced',
  SETTINGS_SYNC_FAILED: 'settings.sync_failed'
};

// ==============================|| ALL EVENTS ||============================== //

export const DomainEvents = {
  ...AttendanceEvents,
  ...EnrollmentEvents,
  ...ProjectEvents,
  ...GroupEvents,
  ...CalendarEvents,
  ...CurriculumEvents,
  ...ParticipantEvents,
  ...UserEvents,
  ...SystemEvents,
  ...NotificationEvents,
  ...SettingsEvents
};

// ==============================|| EVENT FACTORIES ||============================== //

/**
 * Create attendance event payload
 */
export const createAttendanceEvent = (participant, event, status, metadata = {}) => ({
  participant: {
    id: participant.id,
    name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim(),
    role: participant.role?.title
  },
  event: {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end
  },
  status,
  previousStatus: metadata.previousStatus,
  reason: metadata.reason,
  timestamp: new Date().toISOString(),
  ...metadata
});

/**
 * Create enrollment event payload
 */
export const createEnrollmentEvent = (participant, event, action, metadata = {}) => ({
  participant: {
    id: participant.id,
    name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim(),
    role: participant.role?.title
  },
  event: {
    id: event.id,
    title: event.title,
    capacity: event.maxParticipants,
    currentCount: event.participants?.length || 0
  },
  action,
  timestamp: new Date().toISOString(),
  ...metadata
});

/**
 * Create project event payload
 */
export const createProjectEvent = (project, action, metadata = {}) => ({
  project: {
    id: project.id,
    name: project.name,
    status: project.status,
    participantCount: project.participants?.length || 0,
    groupCount: project.groups?.length || 0
  },
  action,
  timestamp: new Date().toISOString(),
  ...metadata
});

/**
 * Create group event payload
 */
export const createGroupEvent = (group, action, metadata = {}) => ({
  group: {
    id: group.id,
    name: group.groupName,
    participantCount: group.participants?.length || 0,
    curriculums: group.curriculums?.map(c => c.name) || []
  },
  action,
  timestamp: new Date().toISOString(),
  ...metadata
});

/**
 * Create participant event payload
 */
export const createParticipantEvent = (participant, action, metadata = {}) => ({
  participant: {
    id: participant.id,
    name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim(),
    email: participant.email,
    role: participant.role?.title,
    roleId: participant.role?.id
  },
  action,
  timestamp: new Date().toISOString(),
  ...metadata
});

// ==============================|| EVENT METADATA HELPERS ||============================== //

/**
 * Add user context to event metadata
 */
export const withUserContext = (metadata, user) => ({
  ...metadata,
  userId: user?.id,
  userName: user?.name,
  userRole: user?.role,
  userEmail: user?.email
});

/**
 * Add source context to event metadata
 */
export const withSourceContext = (metadata, source) => ({
  ...metadata,
  source: source || 'unknown',
  sourceComponent: metadata.sourceComponent,
  sourceAction: metadata.sourceAction
});

/**
 * Add correlation context for related events
 */
export const withCorrelation = (metadata, correlationId) => ({
  ...metadata,
  correlationId: correlationId || `cor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
});