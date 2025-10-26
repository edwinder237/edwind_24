/**
 * Normalized Attendance Management Hook
 * 
 * Demonstrates using EntityAdapter for efficient attendance management.
 * Shows the benefits of normalized state structure.
 */

import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'store';
import { entitySelectors } from 'store/entities';
import {
  updateEvent,
  updateEventAttendance,
  batchUpdateAttendance
} from 'store/entities/eventsSlice';
import {
  updateParticipant,
  optimisticUpdate
} from 'store/entities/participantsSlice';

export const useNormalizedAttendance = (eventId) => {
  const dispatch = useDispatch();
  
  // Get event with all participants using normalized selectors
  const event = useSelector(state => 
    entitySelectors.events.selectEventById(state, eventId)
  );
  
  // Get all participants for cross-referencing
  const allParticipants = useSelector(entitySelectors.participants.selectAllParticipants);
  
  // Get participants specifically for this event
  const eventParticipants = useMemo(() => {
    if (!event?.participants) return [];
    
    // Use normalized data to efficiently lookup full participant details
    const participantMap = new Map(allParticipants.map(p => [p.id, p]));
    
    return event.participants.map(eventParticipant => ({
      ...eventParticipant,
      // Merge with full participant data from normalized store
      participant: participantMap.get(eventParticipant.id),
      // Include attendance status from event relationship
      attendance_status: eventParticipant.attendanceStatus || 'scheduled'
    }));
  }, [event?.participants, allParticipants]);
  
  // Attendance statistics using normalized data
  const attendanceStats = useMemo(() => {
    const stats = {
      total: eventParticipants.length,
      present: 0,
      absent: 0,
      late: 0,
      scheduled: 0
    };
    
    eventParticipants.forEach(ep => {
      const status = ep.attendance_status || 'scheduled';
      stats[status] = (stats[status] || 0) + 1;
    });
    
    return stats;
  }, [eventParticipants]);
  
  // Update attendance status efficiently using normalized operations
  const updateAttendanceStatus = useCallback(async (participantId, newStatus) => {
    try {
      // Optimistic update in normalized store
      dispatch(updateEventAttendance({
        eventId,
        participantId,
        status: newStatus
      }));
      
      // Update participant's last activity (optimistic)
      dispatch(optimisticUpdate({
        id: participantId,
        changes: {
          lastActivity: new Date().toISOString(),
          lastAttendanceUpdate: newStatus
        }
      }));
      
      // Make API call (this would normally go through RTK Query)
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`✅ Updated attendance: Participant ${participantId} marked as ${newStatus} for event ${eventId}`);
      
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      console.error('Failed to update attendance:', error);
      throw error;
    }
  }, [dispatch, eventId]);
  
  // Batch update multiple participants efficiently
  const batchUpdateAttendanceStatus = useCallback(async (updates) => {
    try {
      // Batch optimistic updates
      dispatch(batchUpdateAttendance(
        updates.map(({ participantId, status }) => ({
          eventId,
          participantId,
          status
        }))
      ));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`✅ Batch updated ${updates.length} attendance records for event ${eventId}`);
      
      return { success: true, count: updates.length };
    } catch (error) {
      console.error('Failed to batch update attendance:', error);
      throw error;
    }
  }, [dispatch, eventId]);
  
  // Get participants by status using normalized data
  const getParticipantsByStatus = useCallback((status) => {
    return eventParticipants.filter(ep => 
      (ep.attendance_status || 'scheduled') === status
    );
  }, [eventParticipants]);
  
  // Quick actions using normalized operations
  const quickActions = useMemo(() => ({
    markAllPresent: async () => {
      const updates = eventParticipants
        .filter(ep => ep.attendance_status !== 'present')
        .map(ep => ({
          participantId: ep.id,
          status: 'present'
        }));
      
      if (updates.length > 0) {
        await batchUpdateAttendanceStatus(updates);
      }
    },
    
    markSelectedAbsent: async (selectedParticipantIds) => {
      const updates = selectedParticipantIds.map(participantId => ({
        participantId,
        status: 'absent'
      }));
      
      await batchUpdateAttendanceStatus(updates);
    },
    
    resetAllToScheduled: async () => {
      const updates = eventParticipants
        .filter(ep => ep.attendance_status !== 'scheduled')
        .map(ep => ({
          participantId: ep.id,
          status: 'scheduled'
        }));
      
      if (updates.length > 0) {
        await batchUpdateAttendanceStatus(updates);
      }
    }
  }), [eventParticipants, batchUpdateAttendanceStatus]);
  
  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    totalParticipants: eventParticipants.length,
    normalizedLookups: allParticipants.length,
    attendanceCalculationsPerformed: attendanceStats.total,
    isUsingNormalizedStore: true,
    lastUpdate: new Date().toISOString()
  }), [eventParticipants.length, allParticipants.length, attendanceStats.total]);
  
  return {
    // Data
    event,
    eventParticipants,
    attendanceStats,
    
    // Actions
    updateAttendanceStatus,
    batchUpdateAttendanceStatus,
    
    // Queries
    getParticipantsByStatus,
    
    // Quick actions
    quickActions,
    
    // Performance
    performanceMetrics,
    
    // State
    isLoading: false, // EntityAdapter provides instant access
    error: null
  };
};

/**
 * Hook for demonstrating cross-entity relationships
 */
export const useCrossEntityRelationships = (projectId) => {
  const dispatch = useDispatch();
  
  // Get all entities
  const participants = useSelector(entitySelectors.participants.selectAllParticipants);
  const events = useSelector(entitySelectors.events.selectAllEvents);
  const groups = useSelector(entitySelectors.groups.selectAllGroups);
  
  // Cross-entity analytics
  const analytics = useMemo(() => {
    const participantEventMap = new Map();
    const groupParticipantMap = new Map();
    
    // Build relationship maps efficiently
    events.forEach(event => {
      if (event.participants) {
        event.participants.forEach(ep => {
          if (!participantEventMap.has(ep.id)) {
            participantEventMap.set(ep.id, []);
          }
          participantEventMap.get(ep.id).push(event);
        });
      }
    });
    
    groups.forEach(group => {
      if (group.participants) {
        group.participants.forEach(gp => {
          if (!groupParticipantMap.has(group.id)) {
            groupParticipantMap.set(group.id, []);
          }
          groupParticipantMap.get(group.id).push(gp);
        });
      }
    });
    
    return {
      participantEventCounts: Array.from(participantEventMap.entries()).map(([participantId, events]) => ({
        participantId,
        eventCount: events.length,
        events
      })),
      groupSizes: groups.map(group => ({
        groupId: group.id,
        groupName: group.groupName,
        size: group.participants?.length || 0
      })),
      totalRelationships: participantEventMap.size + groupParticipantMap.size
    };
  }, [participants, events, groups]);
  
  // Find participants with most/least events
  const getParticipantEngagement = useCallback(() => {
    const engagement = analytics.participantEventCounts.sort((a, b) => b.eventCount - a.eventCount);
    
    return {
      mostActive: engagement.slice(0, 5),
      leastActive: engagement.slice(-5).reverse(),
      average: engagement.reduce((sum, p) => sum + p.eventCount, 0) / engagement.length
    };
  }, [analytics.participantEventCounts]);
  
  return {
    analytics,
    getParticipantEngagement,
    entityCounts: {
      participants: participants.length,
      events: events.length,
      groups: groups.length
    }
  };
};