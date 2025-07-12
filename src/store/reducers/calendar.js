import { createSlice } from "@reduxjs/toolkit";

// project import
import axios from "utils/axios";
import { dispatch } from "store";

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

    // create event
    createEvent(state, action) {
      const newEvent = action.payload;
      state.isLoader = false;
      state.isModalOpen = false;
      state.events = [...state.events, newEvent];
    },

    // update event
    updateEvent(state, action) {
      const event = action.payload;
      const eventUpdate = state.events.map((item) => {
        if (item.id === event.id) {
          return event;
        }
        return item;
      });

      state.isLoader = false;
      state.isModalOpen = false;
      state.selectedEventId = null;
      state.events = eventUpdate;
    },

    // delete event
    deleteEvent(state, action) {
      const { eventId } = action.payload;
      state.isModalOpen = false;
      state.events = state.events.filter((user) => user.id !== eventId);
    },

    // select date range
    selectRange(state, action) {
      const { start, end } = action.payload;
      state.isModalOpen = true;
      state.selectedRange = { start, end };
    },

    // modal toggle
    toggleModal(state) {
      state.isModalOpen = !state.isModalOpen;
      if (state.isModalOpen === false) {
        state.selectedEventId = null;
        state.selectedRange = null;
      }
    },
  },
});

export default calendar.reducer;

export const { selectEvent, toggleModal, updateCalendarView } =
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
      dispatch(calendar.actions.hasError(error));
    }
  };
}

export function createEvent(newEvent, events,isAdding) {
  return async () => {
    dispatch(calendar.actions.loading());
    try {
      const response = await axios.post("/api/calendar/add", {
        newEvent,
        events,
      });
      await dispatch(calendar.actions.createEvent(response.data));
      const serverResponse = await axios.post("/api/calendar/db-create-event", {
        newEvent,
        events,
      });
      console.log(serverResponse.data);
      dispatch(calendar.actions.isAdding(!isAdding));
    } catch (error) {
      dispatch(calendar.actions.hasError(error));
    }
  };
}

export function updateEvent(eventId, event, events) {
  return async () => {
    dispatch(calendar.actions.loading());
    try {
      const response = await axios.post("/api/calendar/update", {
        eventId,
        update: event,
        events,
      });
      await dispatch(calendar.actions.updateEvent(response.data));
      const serverResponse = await axios.post("/api/calendar/db-update-event", {
        event,
        eventId,
      });
      //dispatch(calendar.actions.hasError(serverResponse.data));
      console.log(serverResponse.data);
    } catch (error) {
      dispatch(calendar.actions.hasError(error));
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
