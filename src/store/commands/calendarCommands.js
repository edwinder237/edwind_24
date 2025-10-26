import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  viewModeChanged,
  dateSelected,
  navigatedToToday,
  navigatedToPrevious,
  navigatedToNext,
  displayPreferencesUpdated,
  filtersSet,
  allFiltersCleared,
  eventSelected,
  allEventsDeselected
} from '../entities/calendarSlice';

/**
 * Semantic Commands for Calendar Management
 *
 * These commands provide a user-friendly API for calendar operations
 * that integrates with the calendar entity store.
 */

// ==============================|| VIEW NAVIGATION COMMANDS ||============================== //

/**
 * Change the calendar view mode
 * @param {string} viewMode - 'month', 'week', 'day', or 'agenda'
 * @param {string} projectId - The project ID
 */
export const changeCalendarView = createAsyncThunk(
  'calendar/changeView',
  async ({ viewMode, projectId }, { dispatch }) => {
    const command = {
      type: 'CHANGE_CALENDAR_VIEW',
      viewMode,
      projectId,
      timestamp: new Date().toISOString()
    };

    // Update the calendar state
    dispatch(viewModeChanged({ projectId, viewMode }));

    console.log(`[CalendarCommands] View changed to ${viewMode} for project ${projectId}`);

    return { command };
  }
);

/**
 * Navigate to today's date
 */
export const goToToday = createAsyncThunk(
  'calendar/goToToday',
  async (_, { dispatch }) => {
    const command = {
      type: 'GO_TO_TODAY',
      date: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    dispatch(navigatedToToday());

    console.log('[CalendarCommands] Navigated to today');

    return { command };
  }
);

/**
 * Navigate to previous period (based on current view mode)
 */
export const goToPrevious = createAsyncThunk(
  'calendar/goToPrevious',
  async (_, { dispatch, getState }) => {
    const viewMode = getState().calendar.viewMode;

    const command = {
      type: 'GO_TO_PREVIOUS',
      viewMode,
      timestamp: new Date().toISOString()
    };

    dispatch(navigatedToPrevious());

    console.log(`[CalendarCommands] Navigated to previous ${viewMode}`);

    return { command };
  }
);

/**
 * Navigate to next period (based on current view mode)
 */
export const goToNext = createAsyncThunk(
  'calendar/goToNext',
  async (_, { dispatch, getState }) => {
    const viewMode = getState().calendar.viewMode;

    const command = {
      type: 'GO_TO_NEXT',
      viewMode,
      timestamp: new Date().toISOString()
    };

    dispatch(navigatedToNext());

    console.log(`[CalendarCommands] Navigated to next ${viewMode}`);

    return { command };
  }
);

/**
 * Navigate to a specific date
 * @param {Date|string} date - The date to navigate to
 */
export const goToDate = createAsyncThunk(
  'calendar/goToDate',
  async ({ date }, { dispatch }) => {
    const dateString = typeof date === 'string' ? date : date.toISOString();

    const command = {
      type: 'GO_TO_DATE',
      date: dateString,
      timestamp: new Date().toISOString()
    };

    dispatch(dateSelected({ date: dateString }));

    console.log(`[CalendarCommands] Navigated to date: ${dateString}`);

    return { command };
  }
);

// ==============================|| DISPLAY PREFERENCE COMMANDS ||============================== //

/**
 * Toggle weekend display
 * @param {boolean} showWeekends - Whether to show weekends
 */
export const toggleWeekends = createAsyncThunk(
  'calendar/toggleWeekends',
  async ({ showWeekends }, { dispatch }) => {
    const command = {
      type: 'TOGGLE_WEEKENDS',
      showWeekends,
      timestamp: new Date().toISOString()
    };

    dispatch(displayPreferencesUpdated({ showWeekends }));

    console.log(`[CalendarCommands] Weekends ${showWeekends ? 'shown' : 'hidden'}`);

    return { command };
  }
);

/**
 * Update calendar time slot settings
 * @param {string} slotDuration - Time slot duration (e.g., '00:30:00')
 * @param {string} slotMinTime - Start time (e.g., '08:00:00')
 * @param {string} slotMaxTime - End time (e.g., '18:00:00')
 */
export const updateTimeSlotSettings = createAsyncThunk(
  'calendar/updateTimeSlots',
  async ({ slotDuration, slotMinTime, slotMaxTime }, { dispatch }) => {
    const command = {
      type: 'UPDATE_TIME_SLOT_SETTINGS',
      slotDuration,
      slotMinTime,
      slotMaxTime,
      timestamp: new Date().toISOString()
    };

    dispatch(displayPreferencesUpdated({ slotDuration, slotMinTime, slotMaxTime }));

    console.log('[CalendarCommands] Time slot settings updated');

    return { command };
  }
);

// ==============================|| FILTER COMMANDS ||============================== //

/**
 * Apply filters to the calendar
 * @param {Object} filters - Filter object with arrays for each filter type
 */
export const applyCalendarFilters = createAsyncThunk(
  'calendar/applyFilters',
  async ({ filters }, { dispatch }) => {
    const command = {
      type: 'APPLY_CALENDAR_FILTERS',
      filters,
      filterCount: Object.values(filters).reduce((sum, arr) => sum + arr.length, 0),
      timestamp: new Date().toISOString()
    };

    dispatch(filtersSet(filters));

    console.log(`[CalendarCommands] Applied ${command.filterCount} filters`);

    return { command };
  }
);

/**
 * Filter calendar by instructor
 * @param {Array} instructorIds - Array of instructor IDs to filter by
 */
export const filterByInstructor = createAsyncThunk(
  'calendar/filterByInstructor',
  async ({ instructorIds }, { dispatch }) => {
    const command = {
      type: 'FILTER_BY_INSTRUCTOR',
      instructorIds,
      timestamp: new Date().toISOString()
    };

    dispatch(filtersSet({ instructors: instructorIds }));

    console.log(`[CalendarCommands] Filtered by ${instructorIds.length} instructors`);

    return { command };
  }
);

/**
 * Filter calendar by group
 * @param {Array} groupIds - Array of group IDs to filter by
 */
export const filterByGroup = createAsyncThunk(
  'calendar/filterByGroup',
  async ({ groupIds }, { dispatch }) => {
    const command = {
      type: 'FILTER_BY_GROUP',
      groupIds,
      timestamp: new Date().toISOString()
    };

    dispatch(filtersSet({ groups: groupIds }));

    console.log(`[CalendarCommands] Filtered by ${groupIds.length} groups`);

    return { command };
  }
);

/**
 * Clear all calendar filters
 */
export const clearAllFilters = createAsyncThunk(
  'calendar/clearAllFilters',
  async (_, { dispatch }) => {
    const command = {
      type: 'CLEAR_ALL_FILTERS',
      timestamp: new Date().toISOString()
    };

    dispatch(allFiltersCleared());

    console.log('[CalendarCommands] All filters cleared');

    return { command };
  }
);

// ==============================|| EVENT SELECTION COMMANDS ||============================== //

/**
 * Select an event on the calendar
 * @param {string} eventId - The event ID to select
 * @param {boolean} multiSelect - Whether to add to selection or replace it
 */
export const selectEvent = createAsyncThunk(
  'calendar/selectEvent',
  async ({ eventId, multiSelect = false }, { dispatch }) => {
    const command = {
      type: 'SELECT_EVENT',
      eventId,
      multiSelect,
      timestamp: new Date().toISOString()
    };

    dispatch(eventSelected({ eventId, multiSelect }));

    console.log(`[CalendarCommands] Event ${eventId} selected (multi: ${multiSelect})`);

    return { command };
  }
);

/**
 * Clear all event selections
 */
export const clearEventSelection = createAsyncThunk(
  'calendar/clearSelection',
  async (_, { dispatch }) => {
    const command = {
      type: 'CLEAR_EVENT_SELECTION',
      timestamp: new Date().toISOString()
    };

    dispatch(allEventsDeselected());

    console.log('[CalendarCommands] Event selection cleared');

    return { command };
  }
);

/**
 * Select multiple events at once
 * @param {Array} eventIds - Array of event IDs to select
 */
export const selectMultipleEvents = createAsyncThunk(
  'calendar/selectMultiple',
  async ({ eventIds }, { dispatch }) => {
    const command = {
      type: 'SELECT_MULTIPLE_EVENTS',
      eventIds,
      count: eventIds.length,
      timestamp: new Date().toISOString()
    };

    // Clear existing selection first
    dispatch(allEventsDeselected());

    // Select each event
    eventIds.forEach(eventId => {
      dispatch(eventSelected({ eventId, multiSelect: true }));
    });

    console.log(`[CalendarCommands] Selected ${eventIds.length} events`);

    return { command };
  }
);

// ==============================|| EXPORTS ||============================== //

export const calendarCommands = {
  // Navigation
  changeCalendarView,
  goToToday,
  goToPrevious,
  goToNext,
  goToDate,

  // Display Preferences
  toggleWeekends,
  updateTimeSlotSettings,

  // Filters
  applyCalendarFilters,
  filterByInstructor,
  filterByGroup,
  clearAllFilters,

  // Event Selection
  selectEvent,
  clearEventSelection,
  selectMultipleEvents
};
