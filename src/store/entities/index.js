/**
 * Entity Store Index
 * 
 * Combines all normalized entity slices and provides unified access.
 * This creates a clean separation between normalized entity data and UI state.
 */

// Entity slices
import participantsReducer, * as participantsSelectors from './participantsSlice';
import eventsReducer, * as eventsSelectors from './eventsSlice';
import groupsReducer, * as groupsSelectors from './groupsSlice';
import settingsReducer, * as settingsSelectors from './settingsSlice';
import attendanceReducer, * as attendanceSelectors from './attendanceSlice';
import calendarReducer, * as calendarSelectors from './calendarSlice';

// Combine all entity reducers
export const entityReducers = {
  participants: participantsReducer,
  events: eventsReducer,
  groups: groupsReducer,
  settings: settingsReducer,
  attendance: attendanceReducer,
  calendar: calendarReducer
};

// Re-export all selectors with prefixed names for clarity
export const entitySelectors = {
  // Participants
  participants: participantsSelectors,

  // Events
  events: eventsSelectors,

  // Groups
  groups: groupsSelectors,

  // Settings
  settings: settingsSelectors,

  // Attendance
  attendance: attendanceSelectors,

  // Calendar
  calendar: calendarSelectors
};

// Convenience selectors that work across entities
import { createSelector } from '@reduxjs/toolkit';

/**
 * Cross-entity selectors for complex queries
 */

// Get participants for a specific event
export const selectParticipantsForEvent = createSelector(
  [
    participantsSelectors.selectAllParticipants,
    eventsSelectors.selectEventById,
    (state, eventId) => eventId
  ],
  (allParticipants, eventSelector, eventId) => {
    return (state) => {
      const event = eventSelector(state, eventId);
      if (!event?.participants) return [];
      
      const eventParticipantIds = event.participants.map(p => p.id);
      return allParticipants(state).filter(p => 
        eventParticipantIds.includes(p.id)
      );
    };
  }
);

// Get events for a specific participant
export const selectEventsForParticipant = createSelector(
  [
    eventsSelectors.selectAllEvents,
    (state, participantId) => participantId
  ],
  (events, participantId) => {
    return events.filter(event => 
      event.participants?.some(p => p.id === participantId)
    );
  }
);

// Get groups for a specific participant
export const selectGroupsForParticipant = createSelector(
  [
    groupsSelectors.selectAllGroups,
    (state, participantId) => participantId
  ],
  (groups, participantId) => {
    return groups.filter(group => 
      group.participants?.some(p => p.id === participantId)
    );
  }
);

// Get participants in a specific group
export const selectParticipantsInGroup = createSelector(
  [
    participantsSelectors.selectAllParticipants,
    groupsSelectors.selectGroupById,
    (state, groupId) => groupId
  ],
  (allParticipants, groupSelector, groupId) => {
    return (state) => {
      const group = groupSelector(state, groupId);
      if (!group?.participants) return [];
      
      const groupParticipantIds = group.participants.map(p => p.id);
      return allParticipants(state).filter(p => 
        groupParticipantIds.includes(p.id)
      );
    };
  }
);

// Get events for a specific group
export const selectEventsForGroup = createSelector(
  [
    eventsSelectors.selectAllEvents,
    (state, groupId) => groupId
  ],
  (events, groupId) => {
    return events.filter(event => 
      event.groups?.some(g => g.id === groupId)
    );
  }
);

// Project-wide statistics combining all entities
export const selectProjectStatistics = createSelector(
  [
    participantsSelectors.selectParticipantStatistics,
    eventsSelectors.selectEventAttendanceStats,
    groupsSelectors.selectGroupStatistics
  ],
  (participantStats, eventStats, groupStats) => {
    return {
      participants: participantStats,
      events: eventStats,
      groups: groupStats,
      overview: {
        totalParticipants: participantStats.total,
        totalEvents: eventStats.totalEvents,
        totalGroups: groupStats.totalGroups,
        averageAttendanceRate: eventStats.averageAttendanceRate,
        averageGroupSize: groupStats.averageGroupSize
      }
    };
  }
);

// Search across all entities
export const selectGlobalSearch = createSelector(
  [
    participantsSelectors.selectAllParticipants,
    eventsSelectors.selectAllEvents,
    groupsSelectors.selectAllGroups,
    (state, searchTerm) => searchTerm
  ],
  (participants, events, groups, searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      return { participants: [], events: [], groups: [] };
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    const matchingParticipants = participants.filter(p =>
      p.firstName?.toLowerCase().includes(searchLower) ||
      p.lastName?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower)
    );
    
    const matchingEvents = events.filter(e =>
      e.title?.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    );
    
    const matchingGroups = groups.filter(g =>
      g.groupName?.toLowerCase().includes(searchLower) ||
      g.description?.toLowerCase().includes(searchLower)
    );
    
    return {
      participants: matchingParticipants,
      events: matchingEvents,
      groups: matchingGroups,
      totalResults: matchingParticipants.length + matchingEvents.length + matchingGroups.length
    };
  }
);

// Entity relationship health check
export const selectEntityIntegrity = createSelector(
  [
    participantsSelectors.selectAllParticipants,
    eventsSelectors.selectAllEvents,
    groupsSelectors.selectAllGroups
  ],
  (participants, events, groups) => {
    const issues = [];
    const participantIds = new Set(participants.map(p => p.id));
    const eventIds = new Set(events.map(e => e.id));
    const groupIds = new Set(groups.map(g => g.id));
    
    // Check for orphaned references in events
    events.forEach(event => {
      if (event.participants) {
        event.participants.forEach(p => {
          if (!participantIds.has(p.id)) {
            issues.push({
              type: 'orphaned_participant_reference',
              entity: 'event',
              entityId: event.id,
              referenceId: p.id
            });
          }
        });
      }
      
      if (event.groups) {
        event.groups.forEach(g => {
          if (!groupIds.has(g.id)) {
            issues.push({
              type: 'orphaned_group_reference',
              entity: 'event',
              entityId: event.id,
              referenceId: g.id
            });
          }
        });
      }
    });
    
    // Check for orphaned references in groups
    groups.forEach(group => {
      if (group.participants) {
        group.participants.forEach(p => {
          if (!participantIds.has(p.id)) {
            issues.push({
              type: 'orphaned_participant_reference',
              entity: 'group',
              entityId: group.id,
              referenceId: p.id
            });
          }
        });
      }
    });
    
    return {
      isHealthy: issues.length === 0,
      issues,
      summary: {
        totalParticipants: participants.length,
        totalEvents: events.length,
        totalGroups: groups.length,
        issueCount: issues.length
      }
    };
  }
);

/**
 * Helper function to create entity-aware hooks
 */
export const createEntityHooks = (useSelector) => {
  return {
    // Participants
    useParticipants: () => useSelector(participantsSelectors.selectAllParticipants),
    useParticipant: (id) => useSelector(state => participantsSelectors.selectParticipantById(state, id)),
    useFilteredParticipants: () => useSelector(participantsSelectors.selectFilteredParticipants),
    useParticipantStats: () => useSelector(participantsSelectors.selectParticipantStatistics),
    
    // Events
    useEvents: () => useSelector(eventsSelectors.selectAllEvents),
    useEvent: (id) => useSelector(state => eventsSelectors.selectEventById(state, id)),
    useFilteredEvents: () => useSelector(eventsSelectors.selectFilteredEvents),
    useEventsForCurrentView: () => useSelector(eventsSelectors.selectEventsForCurrentView),
    
    // Groups
    useGroups: () => useSelector(groupsSelectors.selectAllGroups),
    useGroup: (id) => useSelector(state => groupsSelectors.selectGroupById(state, id)),
    useFilteredGroups: () => useSelector(groupsSelectors.selectFilteredGroups),
    useGroupStats: () => useSelector(groupsSelectors.selectGroupStatistics),
    
    // Cross-entity
    useProjectStats: () => useSelector(selectProjectStatistics),
    useGlobalSearch: (searchTerm) => useSelector(state => selectGlobalSearch(state, searchTerm)),
    useEntityIntegrity: () => useSelector(selectEntityIntegrity)
  };
};

// Default export combines everything
export default {
  reducers: entityReducers,
  selectors: entitySelectors,
  crossSelectors: {
    selectParticipantsForEvent,
    selectEventsForParticipant,
    selectGroupsForParticipant,
    selectParticipantsInGroup,
    selectEventsForGroup,
    selectProjectStatistics,
    selectGlobalSearch,
    selectEntityIntegrity
  },
  createHooks: createEntityHooks
};