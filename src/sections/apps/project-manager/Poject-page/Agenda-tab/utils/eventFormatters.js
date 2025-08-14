import { formatTime, formatDate, areEventsSameDay, isEventToday } from './timeHelpers';

export const groupEventsByDate = (events = []) => {
  const grouped = {};
  
  events.forEach(event => {
    if (!event.start_time) return;
    
    const dateKey = formatDate(event.start_time, 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  // Sort events within each day by start time
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => {
      const timeA = new Date(a.start_time);
      const timeB = new Date(b.start_time);
      return timeA - timeB;
    });
  });
  
  return grouped;
};

export const getEventsByWeek = (events = [], weekStart) => {
  if (!weekStart) return [];
  
  return events.filter(event => {
    if (!event.start_time) return false;
    const eventDate = new Date(event.start_time);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return eventDate >= weekStart && eventDate < weekEnd;
  });
};

export const getEventsForDate = (events = [], targetDate) => {
  if (!targetDate) return [];
  
  return events.filter(event => {
    if (!event.start_time) return false;
    return areEventsSameDay(event.start_time, targetDate);
  });
};

export const getTodaysEvents = (events = []) => {
  return events.filter(event => {
    if (!event.start_time) return false;
    return isEventToday(event.start_time);
  });
};

export const sortEventsByDateTime = (events = []) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.start_time || 0);
    const dateB = new Date(b.start_time || 0);
    return dateA - dateB;
  });
};

export const getEventParticipantCount = (event) => {
  let count = 0;
  
  if (event.participants?.length) {
    count += event.participants.length;
  }
  
  if (event.groups?.length) {
    // Assuming each group has a participant count
    count += event.groups.reduce((total, group) => {
      return total + (group.participant_count || 0);
    }, 0);
  }
  
  return count;
};

export const getEventStatusColor = (event, theme) => {
  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  
  if (event.status === 'cancelled') {
    return theme.palette.error.main;
  }
  
  if (event.status === 'completed') {
    return theme.palette.success.main;
  }
  
  if (now >= startTime && now <= endTime) {
    return theme.palette.warning.main; // In progress
  }
  
  if (now > endTime) {
    return theme.palette.grey[500]; // Past event
  }
  
  return theme.palette.primary.main; // Future event
};

export const getEventTypeDisplayName = (eventType) => {
  const typeMap = {
    'course': 'Course',
    'supportActivity': 'Support Activity',
    'meeting': 'Meeting',
    'break': 'Break',
    'other': 'Other'
  };
  
  return typeMap[eventType] || eventType?.replace('_', ' ')?.toUpperCase() || 'Unknown';
};

export const createEventSummary = (event) => {
  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const duration = formatDuration(calculateEventDuration(event.start_time, event.end_time));
  const participantCount = getEventParticipantCount(event);
  
  return {
    title: event.title || 'Untitled Event',
    timeRange: `${startTime} - ${endTime}`,
    duration,
    participantCount,
    location: event.location || '',
    type: getEventTypeDisplayName(event.event_type),
    status: event.status || 'scheduled'
  };
};

export const filterEventsByType = (events = [], eventType) => {
  if (!eventType || eventType === 'all') return events;
  
  return events.filter(event => event.event_type === eventType);
};

export const filterEventsByStatus = (events = [], status) => {
  if (!status || status === 'all') return events;
  
  return events.filter(event => event.status === status);
};

export const searchEvents = (events = [], searchTerm) => {
  if (!searchTerm) return events;
  
  const term = searchTerm.toLowerCase();
  
  return events.filter(event => {
    return (
      event.title?.toLowerCase().includes(term) ||
      event.description?.toLowerCase().includes(term) ||
      event.location?.toLowerCase().includes(term) ||
      event.event_type?.toLowerCase().includes(term)
    );
  });
};

export const getUpcomingEvents = (events = [], limit = 5) => {
  const now = new Date();
  
  return events
    .filter(event => {
      const startTime = new Date(event.start_time);
      return startTime > now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      return dateA - dateB;
    })
    .slice(0, limit);
};

export const getConflictingEvents = (events = [], targetEvent) => {
  if (!targetEvent.start_time || !targetEvent.end_time) return [];
  
  const targetStart = new Date(targetEvent.start_time);
  const targetEnd = new Date(targetEvent.end_time);
  
  return events.filter(event => {
    if (event.id === targetEvent.id) return false;
    if (!event.start_time || !event.end_time) return false;
    
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    
    // Check for time overlap
    return (
      (targetStart >= eventStart && targetStart < eventEnd) ||
      (targetEnd > eventStart && targetEnd <= eventEnd) ||
      (targetStart <= eventStart && targetEnd >= eventEnd)
    );
  });
};