import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "../../index";
import { getErrorMessage } from "./utils";

const dataRoutes = {
  getGroupsFromProjectEmployees: "/api/projects/groupsFromProjectEmployees",
  addGroup: "/api/projects/add-group",
  updateGroup: "/api/projects/update-group",
  fetchGroupsDetails: "/api/projects/fetchGroupsDetails",
  removeGroup: "/api/projects/remove-group",
  getGroups: "/api/projects/groups",
};

const initialState = {
  groups: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "projectGroups",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    hasError(state, action) {
      state.error = action.payload;
    },
    getGroupsSuccess(state, action) {
      state.groups = action.payload;
    },
  },
});

export default slice.reducer;

export function getGroupsDetails(projectId) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.post(dataRoutes.fetchGroupsDetails, {
        projectId,
      });
      dispatch(slice.actions.getGroupsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

export const {
  getGroupsSuccess,
} = slice.actions;