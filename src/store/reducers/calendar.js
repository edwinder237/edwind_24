import { createSlice } from "@reduxjs/toolkit";

// project import
import axios from "utils/axios";
import { dispatch } from "store";
import { openSnackbar } from "./snackbar";
import { updateProjectEvent } from "./project";

const initialState = {
  //calendarView: 'dayGridMonth',
  calendarView: "listWeek",
  error: false,
  isAdding: false,
  events: [],
  isLoader: false,
  isModalOpen: false,
  selectedEventId: null,
  selectedRange: null,
};

// ==============================|| CALENDAR - SLICE ||============================== //

const calendar = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    // loader
    loading(state) {
      state.isLoader = true;
    },

    // error
    hasError(state, action) {
      state.isLoader = false;
      state.error = action.payload;
    },
    // IS ADDING?
    isAdding(state, action) {
      console.log('from slice')
      state.isAdding = action.payload;
    },

    // event list
    setEvents(state, action) {
      state.isLoader = false;
      state.events = action.payload;
    },

    // update calendar view
    updateCalendarView(state, action) {
      state.calendarView = action.payload;
    },

    // select event
    selectEvent(state, action) {
      const eventId = action.payload;
      state.isModalOpen = true;
      state.selectedEventId = eventId;
    },

    // highlight event (for visual feedback without opening modal)
    highlightEvent(state, action) {
      const eventId = action.payload;
      state.selectedEventId = eventId;
    },

    // create event
    createEvent(state, action) {
      const newEvent = action.payload;
      state.isLoader = false;
      state.isModalOpen = false;
      state.selectedEventId = null;
      state.selectedRange = null; // Clear range to prevent modal reopening
      state.events = [...state.events, newEvent];
    },

    // update event
    updateEvent(state, action) {
      const event = action.payload;
      
      // Add null check to prevent errors
      if (!event || !event.id) {
        console.error('updateEvent: Invalid event object', event);
        state.isLoader = false;
        return;
      }

      const eventUpdate = state.events.map((item) => {
        if (item.id === event.id) {
          return event;
        }
        return item;
      });

      state.isLoader = false;
      state.isModalOpen = false;
      state.selectedEventId = null;
      state.selectedRange = null; // Clear range to prevent modal reopening
      state.events = eventUpdate;
    },

    // delete event
    deleteEvent(state, action) {
      const { eventId } = action.payload;
      state.isModalOpen = false;
      state.selectedEventId = null;
      state.selectedRange = null; // Clear range to prevent modal reopening
      state.events = state.events.filter((user) => user.id !== eventId);
    },

    // select date range
    selectRange(state, action) {
      const { start, end } = action.payload;
      state.isModalOpen = true;
      state.selectedRange = { start, end };
      state.selectedEventId = null; // Clear any previously selected event
    },

    // modal toggle
    toggleModal(state) {
      state.isModalOpen = !state.isModalOpen;
      if (state.isModalOpen === false) {
        state.selectedEventId = null;
        state.selectedRange = null;
      }
    },

    // close modal (for programmatic closing)
    closeModal(state) {
      state.isModalOpen = false;
      state.selectedEventId = null;
      state.selectedRange = null;
      state.isLoader = false;
    },

    // clear selection (for starting fresh add event)
    clearSelection(state) {
      state.selectedEventId = null;
      state.selectedRange = null;
    },
  },
});

export default calendar.reducer;

export const { selectEvent, highlightEvent, toggleModal, updateCalendarView, closeModal, clearSelection } =
  calendar.actions;

export function getEvents(projectId) {
  return async () => {
    dispatch(calendar.actions.loading());
    try {
      const response = await axios.post("/api/projects/fetchEvents", {
        projectId,
      });
      dispatch(calendar.actions.setEvents(response.data.events));
    } catch (error) {
      console.error('getEvents error:', error);
      dispatch(calendar.actions.hasError(error));
    }
  };
}

export function createEvent(newEvent, events, isAdding) {
  return async () => {
    dispatch(calendar.actions.loading());
    try {
      // Only save to database, don't add to local state immediately
      const serverResponse = await axios.post("/api/calendar/db-create-event", {
        newEvent,
        events,
        projectId: newEvent.projectId
      });
      console.log(serverResponse.data);
      
      // Reload events from database to get the complete event data
      if (newEvent.projectId) {
        await dispatch(getEvents(newEvent.projectId));
      }
      
      // Close the modal after successful creation
      dispatch(calendar.actions.closeModal());
      
      // Don't toggle isAdding here as it causes duplicate event loading
      // dispatch(calendar.actions.isAdding(!isAdding));
    } catch (error) {
      dispatch(calendar.actions.hasError(error));
    }
  };
}

export function updateEvent(eventId, event, events) {
  return async () => {
    // Add validation to prevent null/undefined errors
    if (!eventId || !event) {
      console.error('updateEvent: Missing eventId or event', { eventId, event });
      dispatch(openSnackbar({
        open: true,
        message: 'Error: Missing event data',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      throw new Error('Missing eventId or event');
    }

    // Find the original event to compare changes
    const originalEvent = events.find(e => e.id == eventId);

    dispatch(calendar.actions.loading());
    try {
      console.log('Updating event:', { eventId, event });
      console.log('Event colors being sent:', { 
        color: event.color, 
        backgroundColor: event.backgroundColor, 
        textColor: event.textColor 
      });
      
      // Update database first (most important operation)
      const serverResponse = await axios.post("/api/calendar/db-update-event", {
        event,
        eventId,
      });
      
      console.log('Database update response:', serverResponse.data);
      
      if (!serverResponse.data.success) {
        throw new Error(serverResponse.data.error || 'Failed to update event in database');
      }

      // Wait a moment for database to commit, then reload events
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload events from database to get the complete updated event data
      if (event.projectId) {
        await dispatch(getEvents(event.projectId));
        // Also update the event in projects reducer to sync with Overview tab
        dispatch(updateProjectEvent(event));
      }
      
      // Ensure modal is closed after successful update
      dispatch(calendar.actions.closeModal());
      
      // Create detailed message about what changed
      let changeMessage = 'Event updated successfully';
      if (originalEvent) {
        const changes = [];
        
        // Check for title changes
        if (originalEvent.title !== event.title) {
          changes.push(`title updated`);
        }
        
        // Check date changes
        const originalStart = new Date(originalEvent.start);
        const newStart = new Date(event.start);
        const originalEnd = new Date(originalEvent.end);
        const newEnd = new Date(event.end);
        
        if (originalStart.toDateString() !== newStart.toDateString()) {
          changes.push(`moved to ${newStart.toLocaleDateString()}`);
        } else if (originalStart.getTime() !== newStart.getTime() || originalEnd.getTime() !== newEnd.getTime()) {
          changes.push(`time changed to ${newStart.toLocaleTimeString()} - ${newEnd.toLocaleTimeString()}`);
        }
        
        if (changes.length > 0) {
          changeMessage = `Event ${changes.join(' and ')}`;
        }
      }
      
      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: changeMessage,
        variant: 'alert',
        alert: {
          color: 'success'
        }
      }));
      
      return serverResponse.data;
    } catch (error) {
      console.error('Error updating event:', error);
      dispatch(calendar.actions.hasError(error));
      
      // Show user-friendly error message
      dispatch(openSnackbar({
        open: true,
        message: `Failed to update event: ${error.message || 'Unknown error'}`,
        variant: 'alert',
        alert: {
          color: 'error'
        }
      }));
      
      throw error; // Re-throw to allow calling components to handle
    }
  };
}

export function deleteEvent(eventId, events) {
  return async () => {
    dispatch(calendar.actions.loading());
    try {
      await axios.post("/api/calendar/delete", { eventId, events });
      await dispatch(calendar.actions.deleteEvent({ eventId }));
      const serverResponse = await axios.post("/api/calendar/db-delete-event", {
        eventId,
      });
      //dispatch(calendar.actions.hasError(serverResponse.data));
      console.log(serverResponse.data);
    } catch (error) {
      dispatch(calendar.actions.hasError(error));
    }
  };
}

export function selectRange(start, end) {
  return async () => {
    dispatch(
      calendar.actions.selectRange({
        start: start.getTime(),
        end: end.getTime(),
      })
    );
  };
}
