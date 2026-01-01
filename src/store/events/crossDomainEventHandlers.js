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
  console.log('[Cross-Domain] Initializing event handlers...');

  // ========== GROUPS → AGENDA EVENTS ========== //

  /**
   * When participant added to group
   * CASCADE: If group is assigned to events, add participant to those events
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_ADDED_TO_GROUP, (event) => {
    const { cascadeInfo, participant, group } = event.payload;

    console.log(`[Cross-Domain] Participant ${participant?.id} added to group ${group?.id}`);

    // Check if cascade occurred
    if (cascadeInfo?.affectedEvents && cascadeInfo.affectedEvents.length > 0) {
      console.log(`[Cross-Domain] Cascaded to ${cascadeInfo.addedToEventCount} events, invalidating Agenda cache`);

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

    console.log(`[Cross-Domain] Participant ${participant?.id} removed from group ${group?.id}`);

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

    console.log(`[Cross-Domain] Participant ${participant?.id} moved from group ${previousGroup?.id} to ${newGroup?.id}`);

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

    console.log(`[Cross-Domain] Group ${group.id} deleted, updating events`);

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

    console.log(`[Cross-Domain] Curriculum ${curriculum?.id} assigned to group ${group.id}, updating event expectations`);

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

    console.log(`[Cross-Domain] Curriculum ${curriculum?.id} removed from group ${group.id}`);

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

    console.log(`[Cross-Domain] Group ${group.id} enrolled in event ${agendaEvent.id}`);

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

    console.log(`[Cross-Domain] Group ${group.id} removed from event ${agendaEvent.id}`);

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

    console.log(`[Cross-Domain] Attendance changed for participant ${participant.id}, invalidating group progress`);

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

    console.log(`[Cross-Domain] Participant ${participant.id} enrolled in event ${agendaEvent.id}`);

    // Refresh Groups to show updated event enrollments
    store.dispatch(projectApi.util.invalidateTags(['Group']));
  });

  /**
   * When participant removed from event (from Agenda tab)
   */
  eventBus.subscribe(DomainEvents.PARTICIPANT_REMOVED_FROM_EVENT, (event) => {
    const { participant, event: agendaEvent } = event.payload;

    console.log(`[Cross-Domain] Participant ${participant.id} removed from event ${agendaEvent.id}`);

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

    if (bulkUpdate) {
      console.log(`[Cross-Domain] Bulk role update: ${participantIds?.length || 0} participants assigned to "${roleName || 'No Role'}"`);
    } else if (participant) {
      console.log(`[Cross-Domain] Participant ${participant.id} role updated from ${previousRole} to ${newRole}`);
    }

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
      console.log(`[Cross-Domain] Progress trigger: ${eventType}, recalculating group progress`);

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

    console.log(`[Cross-Domain] Project ${projectId} schedule updated, affecting ${affectedEvents?.length || 0} events`);

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

    console.log(`[Cross-Domain] Instructor ${instructor?.id} added to project ${projectId}`);

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

    console.log(`[Cross-Domain] Instructor ${instructor?.id} removed from project ${projectId}`);

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

    console.log(`[Cross-Domain] Topics updated for project ${projectId}`);

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

    console.log(`[Cross-Domain] Curriculums updated for project ${projectId}`);

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

    console.log(`[Cross-Domain] Training recipient updated for project ${projectId}`);

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

    console.log(`[Cross-Domain] Project ${projectId} info updated:`, Object.keys(updates));

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
      console.log('[Cross-Domain] Group cache invalidated');
      store.dispatch(projectApi.util.invalidateTags(['Group', 'GroupParticipants']));
    }

    if (entities.includes('event')) {
      console.log('[Cross-Domain] Event cache invalidated');
      store.dispatch(projectApi.util.invalidateTags(['Event', 'ProjectAgenda']));
    }
  });

  /**
   * When data sync completed
   * Ensure all affected domains are refreshed
   */
  eventBus.subscribe(DomainEvents.DATA_SYNC_COMPLETED, (event) => {
    const { entities } = event.payload;

    console.log('[Cross-Domain] Data sync completed for:', entities);

    // Invalidate all affected caches
    if (entities.includes('groups') || entities.includes('participants')) {
      store.dispatch(projectApi.util.invalidateTags([
        'Group',
        'GroupParticipants',
        'ProjectAgenda'
      ]));
    }
  });

  console.log('[Cross-Domain] Event handlers initialized successfully');
};

/**
 * Helper function to check if cascade should occur
 * Can be used by components to determine if they need to show cascade warnings
 */
export const shouldCascadeToEvents = (group, action) => {
  // If group has events assigned, cascade will occur
  if (group?.event_groups && group.event_groups.length > 0) {
    console.log(`[Cross-Domain] Cascade will occur: group ${group.id} is assigned to ${group.event_groups.length} events`);
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
