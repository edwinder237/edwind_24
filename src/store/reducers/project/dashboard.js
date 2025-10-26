import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "../../index";
import { getErrorMessage } from "./utils";

const initialState = {
  loading: false,
  error: null,
  dashboardData: null,
  lastFetch: null,
  projectId: null
};

const slice = createSlice({
  name: "projectDashboard",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setDashboardData(state, action) {
      state.dashboardData = action.payload;
      state.lastFetch = new Date().toISOString();
      state.error = null;
    },
    setProjectId(state, action) {
      state.projectId = action.payload;
    },
    clearDashboard(state) {
      state.dashboardData = null;
      state.error = null;
      state.lastFetch = null;
      state.projectId = null;
    },
    updateProjectInfo(state, action) {
      // Ensure dashboard data structure exists
      if (!state.dashboardData) {
        state.dashboardData = {};
      }
      
      // Ensure projectInfo exists
      if (!state.dashboardData.projectInfo) {
        state.dashboardData.projectInfo = {};
      }
      
      // Ensure metrics exists if instructor data is being updated
      if (action.payload.projectLeadInstructor && !state.dashboardData.metrics) {
        state.dashboardData.metrics = {};
      }
      
      // Update project info
      state.dashboardData.projectInfo = {
        ...state.dashboardData.projectInfo,
        ...action.payload
      };
      
      // Update metrics if instructor data is provided
      if (action.payload.projectLeadInstructor) {
        state.dashboardData.metrics = {
          ...state.dashboardData.metrics,
          projectLeadInstructor: action.payload.projectLeadInstructor
        };
      }
    }
  }
});

export default slice.reducer;

// Export actions
export const { updateProjectInfo } = slice.actions;

/**
 * Fetch project dashboard data
 * @param {number} projectId - The project ID to fetch dashboard data for
 * @param {boolean} forceRefresh - Force refresh even if data exists
 */
export function fetchProjectDashboard(projectId, forceRefresh = false) {
  return async (dispatch, getState) => {
    try {
      const currentState = getState();
      const { projectDashboard } = currentState;
      
      // Check if we already have data for this project and not forcing refresh
      const hasData = projectDashboard.dashboardData && 
                     projectDashboard.projectId === projectId;
      
      if (hasData && !forceRefresh) {
        console.log('Using cached dashboard data');
        return;
      }
      
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.setError(null));
      dispatch(slice.actions.setProjectId(projectId));
      
      const response = await axios.post('/api/projects/fetchProjectDashboard', {
        projectId: projectId
      });
      
      if (response.data.success) {
        dispatch(slice.actions.setDashboardData(response.data.data));
      } else {
        throw new Error(response.data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch project dashboard');
      dispatch(slice.actions.setError(errorMessage));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

/**
 * Clear dashboard data (useful when navigating away from project)
 */
export function clearProjectDashboard() {
  return async (dispatch) => {
    dispatch(slice.actions.clearDashboard());
  };
}

/**
 * Refresh dashboard data for current project
 */
export function refreshProjectDashboard() {
  return async (dispatch, getState) => {
    const currentState = getState();
    const { projectDashboard } = currentState;
    
    if (projectDashboard.projectId) {
      dispatch(fetchProjectDashboard(projectDashboard.projectId, true));
    }
  };
}

export const {
  setLoading,
  setError,
  setDashboardData,
  setProjectId,
  clearDashboard
} = slice.actions;