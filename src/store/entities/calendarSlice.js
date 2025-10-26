/**
 * Calendar Entity Slice - CQRS Pattern
 *
 * Manages calendar view state including:
 * - View modes (month, week, day, agenda)
 * - Date navigation and selection
 * - Event positioning and layout
 * - Calendar filters and preferences
 *
 * This is a normalized entity store that separates calendar UI state
 * from the event data itself (which lives in eventsSlice).
 */

import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';

// ==============================|| ENTITY ADAPTER ||============================== //

/**
 * Calendar view state adapter
 * Unlike attendance which has many records, calendar typically has one active view state
 * We still use EntityAdapter for consistency and to allow multiple calendar views in the future
 */
const calendarAdapter = createEntityAdapter({
  selectId: (calendar) => calendar.projectId,
  sortComparer: (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
});

// ==============================|| INITIAL STATE ||============================== //

const initialState = calendarAdapter.getInitialState({
  // Active calendar view state
  activeProjectId: null,

  // View preferences
  viewMode: 'month', // 'month', 'week', 'day', 'agenda'
  selectedDate: new Date().toISOString(),
  viewStart: null, // Start of current view range
  viewEnd: null,   // End of current view range

  // Event display preferences
  showWeekends: true,
  slotDuration: '00:30:00', // 30-minute slots
  slotMinTime: '08:00:00',
  slotMaxTime: '18:00:00',

  // Filters
  filters: {
    eventTypes: [],
    instructors: [],
    groups: [],
    participants: []
  },

  // UI state
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Drag & drop state
  draggedEvent: null,

  // Selection state
  selectedEventIds: [], // For multi-select

  // Layout cache (for performance)
  layoutCache: {}
});

// ==============================|| SLICE ||============================== //

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // ===== View Mode Management =====

    viewModeChanged: (state, action) => {
      const { projectId, viewMode } = action.payload;
      state.viewMode = viewMode;
      state.activeProjectId = projectId;
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] View mode changed:', { projectId, viewMode });
    },

    // ===== Date Navigation =====

    dateSelected: (state, action) => {
      const { date } = action.payload;
      state.selectedDate = typeof date === 'string' ? date : date.toISOString();
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Date selected:', state.selectedDate);
    },

    viewRangeSet: (state, action) => {
      const { start, end } = action.payload;
      state.viewStart = typeof start === 'string' ? start : start.toISOString();
      state.viewEnd = typeof end === 'string' ? end : end.toISOString();
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] View range set:', { start: state.viewStart, end: state.viewEnd });
    },

    navigatedToToday: (state) => {
      state.selectedDate = new Date().toISOString();
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Navigated to today');
    },

    navigatedToPrevious: (state) => {
      const currentDate = new Date(state.selectedDate);
      let newDate;

      switch (state.viewMode) {
        case 'month':
          newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
          break;
        case 'week':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() - 7);
          break;
        case 'day':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() - 1);
          break;
        default:
          newDate = currentDate;
      }

      state.selectedDate = newDate.toISOString();
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Navigated to previous:', state.viewMode);
    },

    navigatedToNext: (state) => {
      const currentDate = new Date(state.selectedDate);
      let newDate;

      switch (state.viewMode) {
        case 'month':
          newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          break;
        case 'week':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + 7);
          break;
        case 'day':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + 1);
          break;
        default:
          newDate = currentDate;
      }

      state.selectedDate = newDate.toISOString();
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Navigated to next:', state.viewMode);
    },

    // ===== Display Preferences =====

    displayPreferencesUpdated: (state, action) => {
      const { showWeekends, slotDuration, slotMinTime, slotMaxTime } = action.payload;

      if (showWeekends !== undefined) state.showWeekends = showWeekends;
      if (slotDuration !== undefined) state.slotDuration = slotDuration;
      if (slotMinTime !== undefined) state.slotMinTime = slotMinTime;
      if (slotMaxTime !== undefined) state.slotMaxTime = slotMaxTime;

      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Display preferences updated:', action.payload);
    },

    // ===== Filters =====

    filtersSet: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Filters set:', state.filters);
    },

    filterCleared: (state, action) => {
      const { filterType } = action.payload;
      if (state.filters[filterType]) {
        state.filters[filterType] = [];
      }
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Filter cleared:', filterType);
    },

    allFiltersCleared: (state) => {
      state.filters = {
        eventTypes: [],
        instructors: [],
        groups: [],
        participants: []
      };
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] All filters cleared');
    },

    // ===== Event Selection =====

    eventSelected: (state, action) => {
      const { eventId, multiSelect } = action.payload;

      if (multiSelect) {
        if (state.selectedEventIds.includes(eventId)) {
          state.selectedEventIds = state.selectedEventIds.filter(id => id !== eventId);
        } else {
          state.selectedEventIds.push(eventId);
        }
      } else {
        state.selectedEventIds = [eventId];
      }

      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Event selected:', { eventId, selectedCount: state.selectedEventIds.length });
    },

    eventDeselected: (state, action) => {
      const { eventId } = action.payload;
      state.selectedEventIds = state.selectedEventIds.filter(id => id !== eventId);
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] Event deselected:', eventId);
    },

    allEventsDeselected: (state) => {
      state.selectedEventIds = [];
      state.lastUpdated = new Date().toISOString();

      console.log('[CalendarSlice] All events deselected');
    },

    // ===== Drag & Drop =====

    eventDragStarted: (state, action) => {
      state.draggedEvent = action.payload;

      console.log('[CalendarSlice] Event drag started:', action.payload.eventId);
    },

    eventDragEnded: (state) => {
      state.draggedEvent = null;

      console.log('[CalendarSlice] Event drag ended');
    },

    // ===== Layout Cache =====

    layoutCacheUpdated: (state, action) => {
      const { viewMode, layout } = action.payload;
      state.layoutCache[viewMode] = layout;

      console.log('[CalendarSlice] Layout cache updated:', viewMode);
    },

    layoutCacheCleared: (state) => {
      state.layoutCache = {};

      console.log('[CalendarSlice] Layout cache cleared');
    },

    // ===== Project-specific Calendar State =====

    projectCalendarStateSet: (state, action) => {
      const { projectId, calendarState } = action.payload;

      calendarAdapter.upsertOne(state, {
        projectId,
        ...calendarState,
        lastUpdated: new Date().toISOString()
      });

      state.activeProjectId = projectId;

      console.log('[CalendarSlice] Project calendar state set:', projectId);
    },

    projectCalendarStateRemoved: (state, action) => {
      const { projectId } = action.payload;
      calendarAdapter.removeOne(state, projectId);

      if (state.activeProjectId === projectId) {
        state.activeProjectId = null;
      }

      console.log('[CalendarSlice] Project calendar state removed:', projectId);
    },

    // ===== State Management =====

    loadingSet: (state, action) => {
      state.isLoading = action.payload;
    },

    errorSet: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    calendarReset: (state) => {
      Object.assign(state, initialState);
      console.log('[CalendarSlice] Calendar reset to initial state');
    }
  },

  extraReducers: (builder) => {
    // Listen to project agenda fetch to sync calendar state
    builder.addMatcher(
      projectApi.endpoints.getProjectAgenda.matchFulfilled,
      (state, action) => {
        const projectId = action.meta.arg.originalArgs;
        state.activeProjectId = projectId;
        state.isLoading = false;

        console.log('[CalendarSlice] RTK Query: Agenda loaded for project:', projectId);
      }
    );

    builder.addMatcher(
      projectApi.endpoints.getProjectAgenda.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      projectApi.endpoints.getProjectAgenda.matchRejected,
      (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      }
    );
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  viewModeChanged,
  dateSelected,
  viewRangeSet,
  navigatedToToday,
  navigatedToPrevious,
  navigatedToNext,
  displayPreferencesUpdated,
  filtersSet,
  filterCleared,
  allFiltersCleared,
  eventSelected,
  eventDeselected,
  allEventsDeselected,
  eventDragStarted,
  eventDragEnded,
  layoutCacheUpdated,
  layoutCacheCleared,
  projectCalendarStateSet,
  projectCalendarStateRemoved,
  loadingSet,
  errorSet,
  calendarReset
} = calendarSlice.actions;

// ==============================|| REDUCER ||============================== //

export default calendarSlice.reducer;

// ==============================|| SELECTORS ||============================== //

// Get the selectors from the adapter
const adapterSelectors = calendarAdapter.getSelectors((state) => state.calendar);

// Basic selectors
export const selectAllProjectCalendars = adapterSelectors.selectAll;
export const selectProjectCalendarById = adapterSelectors.selectById;

// View state selectors
export const selectActiveProjectId = (state) => state.calendar.activeProjectId;
export const selectViewMode = (state) => state.calendar.viewMode;
export const selectSelectedDate = (state) => state.calendar.selectedDate;
export const selectViewRange = (state) => ({
  start: state.calendar.viewStart,
  end: state.calendar.viewEnd
});

// Display preferences selectors
export const selectDisplayPreferences = createSelector(
  [(state) => state.calendar],
  (calendar) => ({
    showWeekends: calendar.showWeekends,
    slotDuration: calendar.slotDuration,
    slotMinTime: calendar.slotMinTime,
    slotMaxTime: calendar.slotMaxTime
  })
);

// Filters selectors
export const selectCalendarFilters = (state) => state.calendar.filters;
export const selectActiveFilters = createSelector(
  [selectCalendarFilters],
  (filters) => {
    const active = {};
    Object.keys(filters).forEach(key => {
      if (filters[key].length > 0) {
        active[key] = filters[key];
      }
    });
    return active;
  }
);

export const selectHasActiveFilters = createSelector(
  [selectCalendarFilters],
  (filters) => {
    return Object.values(filters).some(arr => arr.length > 0);
  }
);

// Selection selectors
export const selectSelectedEventIds = (state) => state.calendar.selectedEventIds;
export const selectIsEventSelected = createSelector(
  [selectSelectedEventIds, (state, eventId) => eventId],
  (selectedIds, eventId) => selectedIds.includes(eventId)
);

export const selectSelectedEventCount = createSelector(
  [selectSelectedEventIds],
  (selectedIds) => selectedIds.length
);

// Drag & drop selectors
export const selectDraggedEvent = (state) => state.calendar.draggedEvent;
export const selectIsDragging = createSelector(
  [selectDraggedEvent],
  (draggedEvent) => draggedEvent !== null
);

// Layout cache selectors
export const selectLayoutCache = (state) => state.calendar.layoutCache;
export const selectLayoutForView = createSelector(
  [selectLayoutCache, (state, viewMode) => viewMode],
  (cache, viewMode) => cache[viewMode] || null
);

// Loading and error selectors
export const selectCalendarLoading = (state) => state.calendar.isLoading;
export const selectCalendarError = (state) => state.calendar.error;
export const selectLastUpdated = (state) => state.calendar.lastUpdated;

// Combined calendar state selector (useful for debugging)
export const selectCalendarState = createSelector(
  [
    selectViewMode,
    selectSelectedDate,
    selectViewRange,
    selectCalendarFilters,
    selectSelectedEventIds,
    selectDisplayPreferences
  ],
  (viewMode, selectedDate, viewRange, filters, selectedEventIds, displayPreferences) => ({
    viewMode,
    selectedDate,
    viewRange,
    filters,
    selectedEventIds,
    displayPreferences
  })
);

// Calendar statistics
export const selectCalendarStats = createSelector(
  [
    selectAllProjectCalendars,
    selectActiveProjectId,
    selectSelectedEventCount,
    selectHasActiveFilters
  ],
  (projectCalendars, activeProjectId, selectedEventCount, hasActiveFilters) => ({
    totalProjectCalendars: projectCalendars.length,
    activeProjectId,
    selectedEventCount,
    hasActiveFilters
  })
);
