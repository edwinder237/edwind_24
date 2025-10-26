import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "../../index";
import { getErrorMessage } from "./utils";

const dataRoutes = {
  fetchProjectParticipantsDetails: "/api/projects/fetchParticipantsDetails",
  getEmployees: "/api/projects/employees",
};

const initialState = {
  project_participants: [],
  employees: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "projectParticipants",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    hasError(state, action) {
      state.error = action.payload;
    },
    getParticipantsSuccess(state, action) {
      state.project_participants = action.payload;
    },
    getEmployeesSuccess(state, action) {
      state.employees = action.payload;
    },
  },
});

export default slice.reducer;

export function getParticipants(projectId) {
  return async () => {
    try {
      const response = await axios.post(
        dataRoutes.fetchProjectParticipantsDetails,
        { projectId }
      );
      dispatch(slice.actions.getParticipantsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export const {
  getParticipantsSuccess,
} = slice.actions;