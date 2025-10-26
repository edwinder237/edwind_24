/**
 * Events Entity Slice
 * 
 * Normalized state management for calendar events using Redux Toolkit's EntityAdapter.
 * Handles training events, sessions, and scheduling.
 */

import { createSlice, createEntityAdapter, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'utils/axios';

// ==============================|| ENTITY ADAPTER ||============================== //

const eventsAdapter = createEntityAdapter({
  selectId: (event) => event.id,
  sortComparer: (a, b) => {
    // Sort by start date/time
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  }
});

// ==============================|| ASYNC THUNKS ||============================== //

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/projects/fetchEvents?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/calendar/db-create-event', eventData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/calendar/db-update-event', { id, ...changes });
      return { id, changes: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (eventId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/calendar/db-delete-event?eventId=${eventId}`);
      return eventId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete event');
    }
  }
);

// ==============================|| SLICE ||============================== //

const initialState = eventsAdapter.getInitialState({
  loading: false,
  error: null,
  selectedEventId: null,
  viewMode: 'month', // 'month', 'week', 'day', 'agenda'
  currentDate: new Date().toISOString(),
  filters: {
    instructor: null,
    course: null,
    group: null,
    status: null,
    dateRange: {
      start: null,
      end: null
    }
  },
  metadata: {
    lastFetch: null,
    totalCount: 0,
    projectId: null
  }
});

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    // Standard CRUD operations
    eventAdded: eventsAdapter.addOne,
    eventUpdated: eventsAdapter.updateOne,
    eventRemoved: eventsAdapter.removeOne,
    eventsReceived: eventsAdapter.setAll,
    eventsManyAdded: eventsAdapter.addMany,
    eventsUpserted: eventsAdapter.upsertMany,
    
    // Custom reducers
    selectEvent: (state, action) => {
      state.selectedEventId = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    
    setEventFilter: (state, action) => {
      const { filterType, value } = action.payload;
      if (filterType === 'dateRange') {
        state.filters.dateRange = value;
      } else {
        state.filters[filterType] = value;
      }
    },
    
    clearEventFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Attendance tracking
    updateEventAttendance: (state, action) => {
      const { eventId, participantId, status } = action.payload;
      const event = state.entities[eventId];
      if (event && event.participants) {
        const participant = event.participants.find(p => p.id === participantId);
        if (participant) {
          participant.attendanceStatus = status;
        }
      }
    },
    
    // Batch attendance update
    batchUpdateAttendance: (state, action) => {
      const updates = action.payload; // Array of { eventId, participantId, status }
      updates.forEach(({ eventId, participantId, status }) => {
        const event = state.entities[eventId];
        if (event && event.participants) {
          const participant = event.participants.find(p => p.id === participantId);
          if (participant) {
            participant.attendanceStatus = status;
          }
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        eventsAdapter.setAll(state, action.payload);
        state.metadata.lastFetch = new Date().toISOString();
        state.metadata.totalCount = action.payload.length;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create event
      .addCase(createEvent.fulfilled, (state, action) => {
        eventsAdapter.addOne(state, action.payload);
        state.metadata.totalCount += 1;
      })
      
      // Update event
      .addCase(updateEvent.fulfilled, (state, action) => {
        eventsAdapter.updateOne(state, action.payload);
      })
      
      // Delete event
      .addCase(deleteEvent.fulfilled, (state, action) => {
        eventsAdapter.removeOne(state, action.payload);
        state.metadata.totalCount -= 1;
      });
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  eventAdded,
  eventUpdated,
  eventRemoved,
  eventsReceived,
  eventsManyAdded,
  eventsUpserted,
  selectEvent,
  setViewMode,
  setCurrentDate,
  setEventFilter,
  clearEventFilters,
  updateEventAttendance,
  batchUpdateAttendance
} = eventsSlice.actions;

// ==============================|| SELECTORS ||============================== //

// Base selectors
export const {
  selectById: selectEventById,
  selectIds: selectEventIds,
  selectEntities: selectEventEntities,
  selectAll: selectAllEvents,
  selectTotal: selectTotalEvents
} = eventsAdapter.getSelectors(state => state.events);

// Custom selectors
export const selectEventsLoading = state => state.events.loading;
export const selectEventsError = state => state.events.error;
export const selectSelectedEventId = state => state.events.selectedEventId;
export const selectEventFilters = state => state.events.filters;
export const selectViewMode = state => state.events.viewMode;
export const selectCurrentDate = state => state.events.currentDate;

// Selected event with full details
export const selectSelectedEvent = createSelector(
  [selectEventEntities, selectSelectedEventId],
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Filtered events based on current filters
export const selectFilteredEvents = createSelector(
  [selectAllEvents, selectEventFilters],
  (events, filters) => {
    let filtered = events;
    
    // Apply instructor filter
    if (filters.instructor) {
      filtered = filtered.filter(e => 
        e.instructors?.some(i => i.id === filters.instructor)
      );
    }
    
    // Apply course filter
    if (filters.course) {
      filtered = filtered.filter(e => e.courseId === filters.course);
    }
    
    // Apply group filter
    if (filters.group) {
      filtered = filtered.filter(e => 
        e.groups?.some(g => g.id === filters.group)
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }
    
    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.start);
        if (filters.dateRange.start && eventDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && eventDate > new Date(filters.dateRange.end)) {
          return false;
        }
        return true;
      });
    }
    
    return filtered;
  }
);

// Events for current view (month/week/day)
export const selectEventsForCurrentView = createSelector(
  [selectFilteredEvents, selectCurrentDate, selectViewMode],
  (events, currentDate, viewMode) => {
    const current = new Date(currentDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const date = current.getDate();
    const day = current.getDay();
    
    switch (viewMode) {
      case 'month': {
        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        return events.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= firstDay && eventDate <= lastDay;
        });
      }
      
      case 'week': {
        // Get first and last day of week
        const firstDay = new Date(current);
        firstDay.setDate(date - day);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        
        return events.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= firstDay && eventDate <= lastDay;
        });
      }
      
      case 'day': {
        // Get events for current day
        const startOfDay = new Date(year, month, date);
        const endOfDay = new Date(year, month, date + 1);
        
        return events.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= startOfDay && eventDate < endOfDay;
        });
      }
      
      case 'agenda':
      default:
        // Return all filtered events for agenda view
        return events;
    }
  }
);

// Events grouped by date
export const selectEventsByDate = createSelector(
  [selectFilteredEvents],
  (events) => {
    const byDate = {};
    events.forEach(event => {
      const dateKey = new Date(event.start).toLocaleDateString();
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(event);
    });
    return byDate;
  }
);

// Attendance statistics for events
export const selectEventAttendanceStats = createSelector(
  [selectAllEvents],
  (events) => {
    const stats = {
      totalEvents: events.length,
      totalParticipants: 0,
      byStatus: {
        present: 0,
        absent: 0,
        late: 0,
        scheduled: 0
      },
      averageAttendanceRate: 0
    };
    
    events.forEach(event => {
      if (event.participants) {
        stats.totalParticipants += event.participants.length;
        event.participants.forEach(p => {
          const status = p.attendanceStatus || 'scheduled';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        });
      }
    });
    
    // Calculate average attendance rate
    if (stats.totalParticipants > 0) {
      stats.averageAttendanceRate = 
        ((stats.byStatus.present + stats.byStatus.late) / stats.totalParticipants) * 100;
    }
    
    return stats;
  }
);

// ==============================|| REDUCER ||============================== //

export default eventsSlice.reducer;