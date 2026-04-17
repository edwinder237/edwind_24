/**
 * Cross-Domain Event Handlers
 *
 * Manages communication between Groups and Agenda tabs through the Event Bus.
 * Implements cascade logic so changes in one domain automatically update the other.
 *
 * Key Responsibilities:
 * - Groups → Agenda: When participants added/removed from groups, update events
 * - Agenda → Groups: When attendance changes, invalidate group progress
 * - Bidirectional: Ensure both tabs stay in sync
 */

import eventBus from './EventBus';
import { DomainEvents } from './domainEvents';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';

/**
 * Initialize cross-domain event handlers
 * Must be called after store is created
 */
export const initializeCrossDomainHandlers = (store) => {

  // ========== GROUPS → AGENDA EVENTS ========== //

  /**
   * When participant added to group
   * CASCADE: If group is assigned to events, add participant to those events
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_ADDED_TO_GROUP, (event) => {
    const { cascadeInfo, participant, group } = event.payload;

    // Check if cascade occurred
    if (cascadeInfo?.affectedEvents && cascadeInfo.affectedEvents.length > 0) {
      // Invalidate Agenda cache to force refresh with new participant in events
      store.dispatch(projectApi.util.invalidateTags([
        'ProjectAgenda',
        'Event',
        'Attendance'
      ]));

      // Show user notification about cascade
      store.dispatch(openSnackbar({
        open: true,
        message: `Participant added to group and ${cascadeInfo.addedToEventCount} event(s)`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
    } else {
      // No cascade, just update Groups
      store.dispatch(projectApi.util.invalidateTags(['Group', 'GroupParticipants']));
    }
  });

  /**
   * When participant removed from group
   * CASCADE: May remove participant from events if they're not in any other assigned group
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_REMOVED_FROM_GROUP, (event) => {
    const { participant, group } = event.payload;

    // Always invalidate both Groups and Agenda (backend determines cascade logic)
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'GroupParticipants',
      'ProjectAgenda',
      'Event'
    ]));
  });

  /**
   * When participant moved between groups
   * CASCADE: Update event enrollment based on old/new group assignments
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_MOVED_BETWEEN_GROUPS, (event) => {
    const { participant, previousGroup, newGroup } = event.payload;

    // Invalidate all affected caches
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'GroupParticipants',
      'ProjectAgenda',
      'Event',
      'Attendance'
    ]));

    // User-friendly notification
    let message = 'Participant group updated successfully';
    if (!previousGroup && newGroup) {
      message = 'Participant added to group and relevant events';
    } else if (previousGroup && !newGroup) {
      message = 'Participant removed from group and events';
    } else {
      message = 'Participant moved between groups, events updated';
    }

    store.dispatch(openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'success' },
      close: false
    }));
  });

  /**
   * When group deleted
   * CASCADE: Remove group from all events, may remove participants from events
   */
  eventBus.subscribe(DomainEvents.GROUP_DELETED, (event) => {
    const { group } = event.payload;

    // Invalidate everything - group deletion affects many entities
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'GroupParticipants',
      'ProjectAgenda',
      'Event',
      'Progress'
    ]));
  });

  /**
   * When curriculum assigned to group
   * CASCADE: Update expected modules for events where group is enrolled
   */
  eventBus.subscribe(DomainEvents.CURRICULUM_ASSIGNED_TO_GROUP, (event) => {
    const { group, curriculum } = event.payload;

    // Invalidate Agenda and Progress caches
    store.dispatch(projectApi.util.invalidateTags([
      'GroupCurriculum',
      'GroupProgress',
      'ProjectAgenda',
      'Event',
      'Progress'
    ]));

    store.dispatch(openSnackbar({
      open: true,
      message: 'Curriculum assigned to group, event expectations updated',
      variant: 'alert',
      alert: { color: 'info' },
      close: false
    }));
  });

  /**
   * When curriculum removed from group
   */
  eventBus.subscribe(DomainEvents.CURRICULUM_REMOVED_FROM_GROUP, (event) => {
    const { group, curriculum } = event.payload;

    store.dispatch(projectApi.util.invalidateTags([
      'GroupCurriculum',
      'GroupProgress',
      'ProjectAgenda',
      'Progress'
    ]));
  });

  // ========== AGENDA → GROUPS EVENTS ========== //

  /**
   * When group enrolled in event (from Agenda tab)
   * CASCADE: All group participants are added to the event
   */
  eventBus.subscribe(DomainEvents.GROUP_ENROLLED_IN_EVENT, (event) => {
    const { group, event: agendaEvent } = event.payload;

    // Invalidate Groups to reflect new event assignments
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'GroupParticipants',
      'ProjectAgenda'
    ]));

    // Notify user about cascade
    const participantCount = group.participants?.length || 0;
    if (participantCount > 0) {
      store.dispatch(openSnackbar({
        open: true,
        message: `${participantCount} participants from group added to event`,
        variant: 'alert',
        alert: { color: 'info' },
        close: false
      }));
    }
  });

  /**
   * When group removed from event (from Agenda tab)
   * CASCADE: May remove group participants from event
   */
  eventBus.subscribe(DomainEvents.GROUP_REMOVED_FROM_EVENT, (event) => {
    const { group, event: agendaEvent } = event.payload;

    // Invalidate caches
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'ProjectAgenda',
      'Event'
    ]));
  });

  /**
   * When attendance status changed (from Agenda tab)
   * Affects group progress calculations
   */
  eventBus.subscribe(DomainEvents.ATTENDANCE_STATUS_CHANGED, (event) => {
    const { participant, status, event: agendaEvent } = event.payload;

    // Invalidate group progress cache (attendance affects completion rates)
    store.dispatch(projectApi.util.invalidateTags([
      'GroupProgress',
      'Progress'
    ]));
  });

  /**
   * When participant enrolled in event (from Agenda tab)
   * May affect group statistics
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_ENROLLED_IN_EVENT, (event) => {
    const { participant, event: agendaEvent } = event.payload;

    // Refresh Groups to show updated event enrollments
    store.dispatch(projectApi.util.invalidateTags(['Group']));
  });

  /**
   * When participant removed from event (from Agenda tab)
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_REMOVED_FROM_EVENT, (event) => {
    const { participant, event: agendaEvent } = event.payload;

    // Refresh Groups
    store.dispatch(projectApi.util.invalidateTags(['Group']));
  });

  /**
   * When participant role updated
   * May affect group eligibility or permissions
   * Supports both single updates and bulk updates
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_ROLE_UPDATED, (event) => {
    const { participant, newRole, previousRole, participantIds, roleId, roleName, bulkUpdate } = event.payload;

    // Refresh Groups to reflect role changes
    store.dispatch(projectApi.util.invalidateTags([
      'Group',
      'GroupParticipants',
      'ProjectParticipants'
    ]));
  });

  // ========== PROGRESS RECALCULATION TRIGGERS ========== //

  /**
   * Aggregate progress calculation triggers
   * These events from Agenda should trigger group progress recalculation
   */
  const progressRecalcTriggers = [
    DomainEvents.MODULE_COMPLETED,
    DomainEvents.ACTIVITY_COMPLETED,
    DomainEvents.COURSE_COMPLETED,
    DomainEvents.CURRICULUM_COMPLETED,
    DomainEvents.ATTENDANCE_BATCH_UPDATED,
    DomainEvents.ALL_PARTICIPANTS_MARKED_PRESENT
  ];

  progressRecalcTriggers.forEach(eventType => {
    eventBus.subscribe(eventType, (event) => {
      // Debounced invalidation (avoid multiple recalcs in quick succession)
      // Using setTimeout to debounce - production should use proper debounce utility
      if (window.__groupProgressDebounce) {
        clearTimeout(window.__groupProgressDebounce);
      }

      window.__groupProgressDebounce = setTimeout(() => {
        store.dispatch(projectApi.util.invalidateTags([
          'GroupProgress',
          'Progress'
        ]));
      }, 500);
    });
  });

  // ========== SETTINGS → OTHER DOMAINS EVENTS ========== //

  /**
   * When project schedule updated
   * CASCADE: May affect events, participants, and groups
   */
  eventBus.subscribe(DomainEvents.PROJECT_SCHEDULE_UPDATED, (event) => {
    const { projectId, scheduleChanges, affectedEvents } = event.payload;

    // Invalidate all affected caches
    store.dispatch(projectApi.util.invalidateTags([
      'ProjectAgenda',
      'Event',
      'Group',
      'Dashboard'
    ]));

    // Notify user about cascade effects
    if (affectedEvents && affectedEvents.length > 0) {
      store.dispatch(openSnackbar({
        open: true,
        message: `Schedule updated, ${affectedEvents.length} events adjusted`,
        variant: 'alert',
        alert: { color: 'info' },
        close: false
      }));
    }
  });

  /**
   * When instructor added to project
   * CASCADE: Instructor becomes available for event assignments
   */
  eventBus.subscribe(DomainEvents.INSTRUCTOR_ADDED_TO_PROJECT, (event) => {
    const { projectId, instructor } = event.payload;

    // Invalidate Agenda to show new instructor in available list
    store.dispatch(projectApi.util.invalidateTags([
      'ProjectAgenda',
      'Event',
      'ProjectSettings'
    ]));

    store.dispatch(openSnackbar({
      open: true,
      message: `${instructor?.fullName || 'Instructor'} added to project`,
      variant: 'alert',
      alert: { color: 'success' },
      close: false
    }));
  });

  /**
   * When instructor removed from project
   * CASCADE: May affect events where instructor was assigned
   */
  eventBus.subscribe(DomainEvents.INSTRUCTOR_REMOVED_FROM_PROJECT, (event) => {
    const { projectId, instructor, affectedEvents } = event.payload;

    // Invalidate all affected caches
    store.dispatch(projectApi.util.invalidateTags([
      'ProjectAgenda',
      'Event',
      'ProjectSettings'
    ]));

    // Warn about cascade effects
    if (affectedEvents && affectedEvents.length > 0) {
      store.dispatch(openSnackbar({
        open: true,
        message: `Instructor removed from project and ${affectedEvents.length} event(s)`,
        variant: 'alert',
        alert: { color: 'warning' },
        close: false
      }));
    }
  });

  /**
   * When project topics updated
   * CASCADE: May affect content categorization
   */
  eventBus.subscribe(DomainEvents.PROJECT_TOPICS_UPDATED, (event) => {
    const { projectId, topics } = event.payload;

    // Invalidate related caches
    store.dispatch(projectApi.util.invalidateTags([
      'ProjectSettings',
      'Event'
    ]));
  });

  /**
   * When project curriculums updated
   * CASCADE: May affect group curriculum assignments
   */
  eventBus.subscribe(DomainEvents.PROJECT_CURRICULUMS_UPDATED, (event) => {
    const { projectId, curriculums } = event.payload;

    // Invalidate related caches
    store.dispatch(projectApi.util.invalidateTags([
      'ProjectSettings',
      'GroupCurriculum',
      'Progress'
    ]));

    store.dispatch(openSnackbar({
      open: true,
      message: 'Project curriculums updated',
      variant: 'alert',
      alert: { color: 'info' },
      close: false
    }));
  });

  /**
   * When training recipient updated
   * CASCADE: May affect project metadata and reporting
   */
  eventBus.subscribe(DomainEvents.TRAINING_RECIPIENT_UPDATED, (event) => {
    const { projectId, trainingRecipient } = event.payload;

    // Invalidate related caches
    store.dispatch(projectApi.util.invalidateTags([
      'Project',
      'ProjectSettings',
      'Dashboard'
    ]));
  });

  /**
   * When project info updated (title, summary, etc.)
   * CASCADE: Update all views showing project info
   */
  eventBus.subscribe(DomainEvents.PROJECT_INFO_UPDATED, (event) => {
    const { projectId, updates } = event.payload;

    // Invalidate all project-related caches
    store.dispatch(projectApi.util.invalidateTags([
      'Project',
      'ProjectSettings',
      'Dashboard',
      'ProjectAgenda'
    ]));

    // Notify user
    if (updates.title) {
      store.dispatch(openSnackbar({
        open: true,
        message: 'Project title updated',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
    }
  });

  // ========== SYSTEM EVENTS ========== //

  /**
   * When cache invalidated (system-wide)
   * Propagate to related caches
   */
  eventBus.subscribe(DomainEvents.CACHE_INVALIDATED, (event) => {
    const { entities, ids } = event.payload;

    if (entities.includes('group')) {
      store.dispatch(projectApi.util.invalidateTags(['Group', 'GroupParticipants']));
    }

    if (entities.includes('event')) {
      store.dispatch(projectApi.util.invalidateTags(['Event', 'ProjectAgenda']));
    }
  });

  /**
   * When data sync completed
   * Ensure all affected domains are refreshed
   */
  eventBus.subscribe(DomainEvents.DATA_SYNC_COMPLETED, (event) => {
    const { entities } = event.payload;

    // Invalidate all affected caches
    if (entities.includes('groups') || entities.includes('participants')) {
      store.dispatch(projectApi.util.invalidateTags([
        'Group',
        'GroupParticipants',
        'ProjectAgenda'
      ]));
    }
  });

};

/**
 * Helper function to check if cascade should occur
 * Can be used by components to determine if they need to show cascade warnings
 */
export const shouldCascadeToEvents = (group, action) => {
  // If group has events assigned, cascade will occur
  if (group?.event_groups && group.event_groups.length > 0) {
    return true;
  }
  return false;
};

/**
 * Helper function to get affected event count for user notifications
 */
export const getAffectedEventCount = (group) => {
  return group?.event_groups?.length || 0;
};
