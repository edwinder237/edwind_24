// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";

// Utility function to extract error message
const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // Handle network-specific errors
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET') {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (error?.response?.status === 500) {
    return 'Server error. Please try again in a few moments.';
  }
  if (error?.response?.status === 404) {
    return 'Requested resource not found.';
  }
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return error?.response?.data?.error || error?.response?.data?.message || 'Request failed. Please try again.';
  }
  
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || defaultMessage;
};

const dataRoutes = {
  fetchBySubOrganization: "/api/events/fetchBySubOrganization",
};

const initialState = {
  error: null,
  success: false,
  loading: false,
  events: [],
  selectedEvent: null,
  calendarView: 'dayGridMonth',
  calendarDate: new Date().toISOString(),
  response: null,
};

const slice = createSlice({
  name: "events",
  initialState,
  reducers: {
    // ERROR HANDLING
    hasError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    // SUCCESS
    hasSuccess(state, action) {
      state.success = true;
      state.response = action.payload;
      state.error = null;
    },

    // LOADING STATES
    setLoading(state, action) {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // CLEAR ERROR
    clearError(state) {
      state.error = null;
    },

    // CLEAR SUCCESS
    clearSuccess(state) {
      state.success = false;
      state.response = null;
    },

    // GET EVENTS
    getEventsSuccess(state, action) {
      if (Array.isArray(action.payload)) {
        state.events = action.payload;
        state.error = null;
        state.loading = false;
      } else {
        state.error = 'Invalid events data received';
        state.events = [];
        state.loading = false;
      }
    },

    // SET SELECTED EVENT
    setSelectedEvent(state, action) {
      state.selectedEvent = action.payload;
    },

    // SET CALENDAR VIEW
    setCalendarView(state, action) {
      state.calendarView = action.payload;
    },

    // SET CALENDAR DATE
    setCalendarDate(state, action) {
      // Ensure the date is stored as a string (ISO format)
      if (action.payload instanceof Date) {
        state.calendarDate = action.payload.toISOString();
      } else if (typeof action.payload === 'string') {
        // If it's already a string, ensure it's a valid date
        state.calendarDate = new Date(action.payload).toISOString();
      } else {
        state.calendarDate = new Date().toISOString();
      }
    },

    // UPDATE EVENT (for drag and drop)
    updateEventSuccess(state, action) {
      const updatedEvent = action.payload;
      const index = state.events.findIndex(event => event.id === updatedEvent.id);
      if (index !== -1) {
        state.events[index] = updatedEvent;
      }
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
export const {
  hasError,
  hasSuccess,
  setLoading,
  clearError,
  clearSuccess,
  getEventsSuccess,
  setSelectedEvent,
  setCalendarView,
  setCalendarDate,
  updateEventSuccess,
} = slice.actions;

// ----------------------------------------------------------------------

// GET EVENTS BY SUB-ORGANIZATION
export function getEventsBySubOrganization(subOrganizationId) {
  return async () => {
    dispatch(setLoading(true));
    try {
      const response = await axios.get(`${dataRoutes.fetchBySubOrganization}?sub_organizationId=${subOrganizationId}`);
      if (response.data.success) {
        dispatch(getEventsSuccess(response.data.events));
      } else {
        dispatch(hasError('Failed to fetch events'));
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch events');
      console.error('Error fetching events:', error);
      dispatch(hasError(errorMessage));
    }
  };
}

// UPDATE EVENT (for drag and drop operations)
export function updateEvent(eventData) {
  return async () => {
    try {
      // For now, just update the local state
      // In a real app, you'd call an API endpoint here
      dispatch(updateEventSuccess(eventData));
      dispatch(hasSuccess({ message: 'Event updated successfully' }));
      return eventData;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update event');
      console.error('Error updating event:', error);
      dispatch(hasError(errorMessage));
      throw error;
    }
  };
}