/**
 * Debug Selectors
 * 
 * Quick selectors to inspect the current state and diagnose data flow issues.
 */

import { createSelector } from '@reduxjs/toolkit';

// Debug current project agenda state
export const selectProjectAgendaDebug = createSelector(
  [(state) => state.projectAgenda],
  (projectAgenda) => {
    if (!projectAgenda) {
      return { error: 'No projectAgenda state found' };
    }

    const events = projectAgenda.events || [];
    const participants = projectAgenda.participants || [];
    const groups = projectAgenda.groups || [];

    // Count total attendance records
    let totalAttendanceRecords = 0;
    let attendanceByStatus = { present: 0, absent: 0, late: 0, scheduled: 0 };

    events.forEach(event => {
      if (event.event_attendees) {
        event.event_attendees.forEach(ea => {
          totalAttendanceRecords++;
          const status = ea.attendance_status || 'scheduled';
          attendanceByStatus[status] = (attendanceByStatus[status] || 0) + 1;
        });
      }
    });

    return {
      structure: {
        hasProjectAgenda: !!projectAgenda,
        hasEvents: events.length > 0,
        hasParticipants: participants.length > 0,
        hasGroups: groups.length > 0
      },
      counts: {
        events: events.length,
        participants: participants.length,
        groups: groups.length,
        totalAttendanceRecords
      },
      attendance: {
        byStatus: attendanceByStatus,
        totalRecords: totalAttendanceRecords,
        rate: totalAttendanceRecords > 0 
          ? Math.round(((attendanceByStatus.present + attendanceByStatus.late) / totalAttendanceRecords) * 100)
          : 0
      },
      sampleEvent: events[0] || null,
      sampleParticipant: participants[0] || null,
      sampleGroup: groups[0] || null,
      sampleEventAttendees: events[0]?.event_attendees || null,
      lastUpdate: new Date().toISOString()
    };
  }
);

// Debug normalized entities state
export const selectNormalizedEntitiesDebug = createSelector(
  [(state) => state.participants, (state) => state.events, (state) => state.groups],
  (participantsState, eventsState, groupsState) => ({
    participants: {
      exists: !!participantsState,
      count: participantsState?.ids?.length || 0,
      loading: participantsState?.loading || false,
      entities: Object.keys(participantsState?.entities || {}).length
    },
    events: {
      exists: !!eventsState,
      count: eventsState?.ids?.length || 0,
      loading: eventsState?.loading || false,
      entities: Object.keys(eventsState?.entities || {}).length
    },
    groups: {
      exists: !!groupsState,
      count: groupsState?.ids?.length || 0,
      loading: groupsState?.loading || false,
      entities: Object.keys(groupsState?.entities || {}).length
    },
    lastCheck: new Date().toISOString()
  })
);

// Debug full state structure
export const selectFullStateDebug = createSelector(
  [(state) => state],
  (state) => ({
    availableSlices: Object.keys(state),
    projectAgenda: {
      exists: !!state.projectAgenda,
      keys: state.projectAgenda ? Object.keys(state.projectAgenda) : []
    },
    normalizedEntities: {
      participants: !!state.participants,
      events: !!state.events,
      groups: !!state.groups
    },
    other: {
      // projectDashboard removed - using derived selectors
      projectSettings: !!state.projectSettings,
      calendar: !!state.calendar
    }
  })
);