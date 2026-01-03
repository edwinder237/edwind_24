/**
 * Hook for accessing normalized events data
 * 
 * This hook uses the normalized entity store instead of denormalized agenda data
 * providing better performance and a single source of truth for events.
 */

import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectAllEvents,
  selectEventsLoading,
  selectEventsError,
  selectSelectedEvent,
  selectFilteredEvents,
  selectEventsForCurrentView,
  selectEventsByDate,
  selectEventAttendanceStats,
  selectViewMode,
  selectCurrentDate
} from 'store/entities/eventsSlice';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { selectAllGroups } from 'store/entities/groupsSlice';
import { useGetProjectAgendaQuery } from 'store/api/projectApi';

export const useNormalizedEvents = (projectId) => {
  // Trigger data fetching and normalization via RTK Query
  const {
    data: agendaData,
    error: agendaError,
    isLoading: agendaLoading,
    isFetching: refreshing,
    refetch: refreshData
  } = useGetProjectAgendaQuery(projectId, {
    skip: !projectId,
    // Disable automatic refetching for manual control
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  // Get normalized events from entity store
  const events = useSelector(selectAllEvents);
  const loading = useSelector(selectEventsLoading) || agendaLoading;
  const error = useSelector(selectEventsError) || agendaError;
  
  const selectedEvent = useSelector(selectSelectedEvent);
  const filteredEvents = useSelector(selectFilteredEvents);
  const viewMode = useSelector(selectViewMode);
  const currentDate = useSelector(selectCurrentDate);
  
  // Get related entities
  const participants = useSelector(selectAllParticipants);
  const groups = useSelector(selectAllGroups);
  
  // Get events for current view (month/week/day/agenda)
  const eventsForCurrentView = useSelector(selectEventsForCurrentView);
  const eventsByDate = useSelector(selectEventsByDate);
  const attendanceStats = useSelector(selectEventAttendanceStats);
  
  // Get project info from agenda (still denormalized for now)
  const projectInfo = agendaData?.projectInfo || null;
  const instructors = agendaData?.instructors || [];
  const curriculums = agendaData?.curriculums || [];
  
  // Filter events by current project
  const projectEvents = useMemo(() => {
    if (!projectId) return [];

    const parsedProjectId = parseInt(projectId);

    // Filter events to only include those for the current project
    // Events now have projectId added during normalization
    return events.filter(event =>
      event.projectId === parsedProjectId
    );
  }, [events, projectId]);
  
  // Computed metrics
  const metrics = useMemo(() => ({
    totalEvents: projectEvents.length,
    upcomingEvents: projectEvents.filter(e => 
      new Date(e.start) > new Date()
    ).length,
    pastEvents: projectEvents.filter(e => 
      new Date(e.start) < new Date()
    ).length,
    todayEvents: projectEvents.filter(e => {
      const today = new Date();
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === today.toDateString();
    }).length,
    eventsByStatus: projectEvents.reduce((acc, e) => {
      const status = e.status || 'scheduled';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    eventsByType: projectEvents.reduce((acc, e) => {
      const type = e.type || 'training';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    averageEventDuration: projectEvents.length > 0 
      ? projectEvents.reduce((acc, e) => {
          const duration = new Date(e.end) - new Date(e.start);
          return acc + (duration / (1000 * 60)); // in minutes
        }, 0) / projectEvents.length
      : 0,
    participantEngagement: attendanceStats
  }), [projectEvents, attendanceStats]);
  
  // Computed states
  const hasData = projectEvents.length > 0;
  const isEmpty = !loading && projectEvents.length === 0;
  
  // Force refresh implementation
  const forceRefresh = useCallback(async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Failed to refresh events:', error);
    }
  }, [refreshData]);
  

  return {
    // Normalized data
    events: projectEvents,
    participants,
    groups,
    instructors,
    curriculums,
    projectInfo,
    
    // Selected and filtered data
    selectedEvent,
    filteredEvents,
    eventsForCurrentView,
    eventsByDate,
    
    // State
    loading,
    refreshing,
    error,
    hasData,
    isEmpty,
    
    // View state
    viewMode,
    currentDate,
    
    // Metrics
    metrics,
    attendanceStats,
    
    // Actions
    refreshData,
    forceRefresh,
    
    // Selectors for advanced use cases
    selectors: {
      selectAllEvents,
      selectFilteredEvents,
      selectEventsForCurrentView,
      selectEventsByDate
    }
  };
};

/**
 * Hook for accessing a single event from normalized store
 */
export const useNormalizedEvent = (eventId) => {
  const event = useSelector(state => 
    state.events?.entities?.[eventId]
  );
  
  return event;
};

/**
 * Hook for accessing events by instructor from normalized store
 */
export const useEventsByInstructor = (instructorId) => {
  const allEvents = useSelector(selectAllEvents);
  
  const events = useMemo(() => {
    if (!instructorId) return [];
    
    return allEvents.filter(event => 
      event.instructors?.some(i => i.id === instructorId) ||
      event.instructorId === instructorId
    );
  }, [allEvents, instructorId]);
  
  return {
    events,
    count: events.length
  };
};

/**
 * Hook for accessing events by course from normalized store
 */
export const useEventsByCourse = (courseId) => {
  const allEvents = useSelector(selectAllEvents);
  
  const events = useMemo(() => {
    if (!courseId) return [];
    
    return allEvents.filter(event => 
      event.courseId === courseId ||
      event.course?.id === courseId
    );
  }, [allEvents, courseId]);
  
  return {
    events,
    count: events.length
  };
};

/**
 * Hook for event attendance tracking
 */
export const useEventAttendance = (eventId) => {
  const event = useNormalizedEvent(eventId);
  
  const attendanceData = useMemo(() => {
    if (!event || !event.participants) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        scheduled: 0,
        attendanceRate: 0
      };
    }
    
    const stats = event.participants.reduce((acc, p) => {
      const status = p.attendanceStatus || 'scheduled';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { present: 0, absent: 0, late: 0, scheduled: 0 });
    
    const total = event.participants.length;
    const attendanceRate = total > 0 
      ? ((stats.present + stats.late) / total) * 100 
      : 0;
    
    return {
      total,
      attendanceRate,
      ...stats
    };
  }, [event]);
  
  return attendanceData;
};