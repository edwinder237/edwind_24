import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { getErrorMessage } from "./utils";

// ==============================|| API ENDPOINTS ||============================== //

const API_ENDPOINTS = {
  fetchProjectAgenda: "/api/projects/fetchProjectAgenda",
  saveModuleProgress: "/api/events/save-module-progress",
  getProgress: "/api/events/get-progress",
  resetModuleProgress: "/api/events/reset-module-progress",
  
  // Attendance and participant management endpoints
  updateAttendanceStatus: "/api/projects/updateAttendanceStatus",
  addEventParticipant: "/api/projects/addEventParticipant",
  removeEventParticipant: "/api/projects/removeEventParticipant",
  addEventGroup: "/api/projects/addEventGroup",
  addParticipantToGroup: "/api/projects/add-participant-to-group",
  removeParticipantFromGroup: "/api/projects/remove-participant-from-group"
};

// ==============================|| INITIAL STATE ||============================== //

const initialState = {
  // Core agenda data
  events: [],
  groups: [],
  participants: [],
  curriculums: [],
  instructors: [],
  
  // Project information
  projectInfo: null,
  projectId: null,
  
  // Metrics and analytics
  metrics: null,
  
  // Progress tracking
  moduleProgress: {},
  activityProgress: {},
  progressLoading: false,
  
  // UI state
  loading: false,
  error: null,
  lastFetch: null
};

// ==============================|| SLICE DEFINITION ||============================== //

const agendaSlice = createSlice({
  name: "projectAgenda",
  initialState,
  reducers: {
    // Loading state management
    setLoading(state, action) {
      state.loading = action.payload;
    },
    
    // Error state management
    setError(state, action) {
      state.error = action.payload;
    },
    
    // Project ID tracking
    setProjectId(state, action) {
      state.projectId = action.payload;
    },
    
    // Set complete agenda data from API response
    setAgendaData(state, action) {
      const data = action.payload;
      
      // Update all agenda-related data
      state.events = data.events || [];
      state.groups = data.groups || [];
      state.participants = data.participants || [];
      state.curriculums = data.curriculums || [];
      state.instructors = data.instructors || [];
      state.projectInfo = data.projectInfo || null;
      state.metrics = data.metrics || null;
      
      // Update metadata
      state.lastFetch = new Date().toISOString();
      state.error = null;
    },
    
    // Clear all agenda data
    clearAgenda(state) {
      // Reset to initial state
      Object.assign(state, initialState);
    },
    
    // Progress tracking reducers
    setProgressLoading(state, action) {
      state.progressLoading = action.payload;
    },
    
    setModuleProgress(state, action) {
      const { eventId, moduleId, completed, completedAt } = action.payload;
      const key = `${eventId}_${moduleId}`;
      state.moduleProgress[key] = {
        completed,
        completedAt,
        moduleId
      };
    },
    
    setActivityProgress(state, action) {
      const { eventId, activityId, completed, completedAt } = action.payload;
      const key = `${eventId}_${activityId}`;
      state.activityProgress[key] = {
        completed,
        completedAt,
        activityId
      };
    },
    
    setAllProgress(state, action) {
      const { eventId, data } = action.payload;
      // Set module progress
      data.modules?.forEach(moduleProgress => {
        const key = `${eventId}_${moduleProgress.moduleId}`;
        state.moduleProgress[key] = moduleProgress;
      });
      // Set activity progress
      data.modules?.forEach(moduleData => {
        moduleData.activities?.forEach(activityProgress => {
          const key = `${eventId}_${activityProgress.activityId}`;
          state.activityProgress[key] = activityProgress;
        });
      });
    },
    
    resetProgress(state, action) {
      const { eventId, moduleId } = action.payload;
      const moduleKey = `${eventId}_${moduleId}`;
      delete state.moduleProgress[moduleKey];
      // Also reset all activities in this module
      Object.keys(state.activityProgress).forEach(key => {
        if (key.startsWith(`${eventId}_`)) {
          delete state.activityProgress[key];
        }
      });
    }
  },
});

// ==============================|| ACTIONS ||============================== //

/**
 * Fetch comprehensive agenda data for a project
 * 
 * @param {number} projectId - The ID of the project
 * @param {boolean} forceRefresh - Force refresh even if cached data exists
 * @returns {Function} Redux thunk action
 */
export function fetchProjectAgenda(projectId, forceRefresh = false) {
  return async (dispatch, getState) => {
    try {
      // Check for cached data
      const { projectAgenda } = getState();
      const hasCachedData = 
        projectAgenda.events.length > 0 && 
        projectAgenda.projectId === projectId &&
        !forceRefresh;
      
      if (hasCachedData) {
        console.log('[Agenda] Using cached data for project:', projectId);
        return;
      }
      
      // Set loading state
      dispatch(agendaSlice.actions.setLoading(true));
      dispatch(agendaSlice.actions.setError(null));
      dispatch(agendaSlice.actions.setProjectId(projectId));
      
      // Fetch data from API
      console.log('[Agenda] Fetching data for project:', projectId);
      const response = await axios.post(API_ENDPOINTS.fetchProjectAgenda, {
        projectId: projectId
      });
      
      // Handle response
      if (response.data.success) {
        dispatch(agendaSlice.actions.setAgendaData(response.data.data));
        console.log('[Agenda] Data fetched successfully');
      } else {
        throw new Error(response.data.error || 'Failed to fetch agenda data');
      }
      
    } catch (error) {
      console.error('[Agenda] Error fetching data:', error);
      const errorMessage = getErrorMessage(error, 'Failed to fetch project agenda');
      dispatch(agendaSlice.actions.setError(errorMessage));
      
    } finally {
      dispatch(agendaSlice.actions.setLoading(false));
    }
  };
}

/**
 * Clear agenda data when navigating away from project
 * 
 * @returns {Function} Redux thunk action
 */
export function clearProjectAgenda() {
  return async (dispatch) => {
    console.log('[Agenda] Clearing agenda data');
    dispatch(agendaSlice.actions.clearAgenda());
  };
}

/**
 * Get event progress for modules and activities
 * 
 * @param {number} eventId - The event ID
 * @returns {Function} Redux thunk action
 */
export function getEventProgress(eventId) {
  return async (dispatch) => {
    try {
      dispatch(agendaSlice.actions.setProgressLoading(true));
      
      const response = await axios.get(API_ENDPOINTS.getProgress, {
        params: { eventId: eventId }
      });
      
      if (response.data.success) {
        dispatch(agendaSlice.actions.setAllProgress({
          eventId,
          data: response.data.data
        }));
      }
    } catch (error) {
      console.error('[Agenda] Error fetching progress:', error);
    } finally {
      dispatch(agendaSlice.actions.setProgressLoading(false));
    }
  };
}

/**
 * Save module progress
 * 
 * @param {number} eventId - The event ID
 * @param {number} moduleId - The module ID
 * @param {Array} activityIds - Array of activity IDs
 * @returns {Function} Redux thunk action
 */
export function saveModuleProgress(eventId, moduleId, activityIds) {
  return async (dispatch) => {
    try {
      dispatch(agendaSlice.actions.setProgressLoading(true));
      
      const response = await axios.post(API_ENDPOINTS.saveModuleProgress, {
        eventId,
        moduleId,
        activityIds,
        completed: true
      });
      
      if (response.data.success) {
        // Update local state
        const completedAt = new Date().toISOString();
        dispatch(agendaSlice.actions.setModuleProgress({
          eventId,
          moduleId,
          completed: true,
          completedAt
        }));
        
        // Also mark all activities as completed
        activityIds?.forEach(activityId => {
          dispatch(agendaSlice.actions.setActivityProgress({
            eventId,
            activityId,
            completed: true,
            completedAt
          }));
        });
        
        console.log('[Agenda] Module progress saved successfully');
      }
    } catch (error) {
      console.error('[Agenda] Error saving module progress:', error);
    } finally {
      dispatch(agendaSlice.actions.setProgressLoading(false));
    }
  };
}

/**
 * Reset module progress
 * 
 * @param {number} eventId - The event ID
 * @param {number} moduleId - The module ID
 * @param {Array} activities - Array of activities
 * @returns {Function} Redux thunk action
 */
export function resetModuleProgress(eventId, moduleId, activities) {
  return async (dispatch) => {
    try {
      dispatch(agendaSlice.actions.setProgressLoading(true));
      
      const response = await axios.post(API_ENDPOINTS.resetModuleProgress, {
        eventId,
        moduleId
      });
      
      if (response.data.success) {
        dispatch(agendaSlice.actions.resetProgress({
          eventId,
          moduleId
        }));
        console.log('[Agenda] Module progress reset successfully');
      }
    } catch (error) {
      console.error('[Agenda] Error resetting module progress:', error);
    } finally {
      dispatch(agendaSlice.actions.setProgressLoading(false));
    }
  };
}

/**
 * Update attendance status for a participant
 * 
 * @param {number} eventId - The event ID
 * @param {number} participantId - The enrollee ID
 * @param {string} attendanceStatus - The new attendance status
 * @returns {Function} Redux thunk action
 */
export function updateAttendanceStatus(eventId, participantId, attendanceStatus) {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(API_ENDPOINTS.updateAttendanceStatus, {
        eventId,
        participantId,
        attendance_status: attendanceStatus
      });
      
      if (response.data) {
        // Refresh agenda data to get updated attendance
        const { projectAgenda } = getState();
        if (projectAgenda.projectId) {
          await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[Agenda] Error updating attendance status:', error);
      throw error;
    }
  };
}

/**
 * Add participant to event
 * 
 * @param {number} eventId - The event ID
 * @param {number} participantId - The participant ID
 * @param {string} attendanceStatus - Initial attendance status
 * @returns {Function} Redux thunk action
 */
export function addEventParticipant(eventId, participantId, attendanceStatus = 'scheduled') {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(API_ENDPOINTS.addEventParticipant, {
        eventId,
        participantId,
        attendance_status: attendanceStatus
      });
      
      if (response.data) {
        // Refresh agenda data
        const { projectAgenda } = getState();
        if (projectAgenda.projectId) {
          await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[Agenda] Error adding event participant:', error);
      throw error;
    }
  };
}

/**
 * Remove participant from event
 * 
 * @param {number} eventId - The event ID
 * @param {number} participantId - The enrollee ID
 * @returns {Function} Redux thunk action
 */
export function removeEventParticipant(eventId, participantId) {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(API_ENDPOINTS.removeEventParticipant, {
        eventId,
        participantId
      });
      
      if (response.data) {
        // Refresh agenda data
        const { projectAgenda } = getState();
        if (projectAgenda.projectId) {
          await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[Agenda] Error removing event participant:', error);
      throw error;
    }
  };
}

/**
 * Add group to event
 * 
 * @param {number} eventId - The event ID
 * @param {number} groupId - The group ID
 * @returns {Function} Redux thunk action
 */
export function addEventGroup(eventId, groupId) {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(API_ENDPOINTS.addEventGroup, {
        eventId,
        groupId
      });
      
      if (response.data) {
        // Refresh agenda data
        const { projectAgenda } = getState();
        if (projectAgenda.projectId) {
          await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[Agenda] Error adding event group:', error);
      throw error;
    }
  };
}

/**
 * Move participant to different group
 * 
 * @param {number} participantId - The participant ID
 * @param {number} currentGroupId - Current group ID
 * @param {number} targetGroupId - Target group ID
 * @returns {Function} Redux thunk action
 */
export function moveParticipantToGroup(participantId, currentGroupId, targetGroupId) {
  return async (dispatch, getState) => {
    try {
      // Remove from current group
      if (currentGroupId) {
        await axios.post(API_ENDPOINTS.removeParticipantFromGroup, {
          participantId,
          groupId: currentGroupId
        });
      }
      
      // Add to target group
      const response = await axios.post(API_ENDPOINTS.addParticipantToGroup, {
        participantId,
        groupId: targetGroupId
      });
      
      if (response.data) {
        // Refresh agenda data
        const { projectAgenda } = getState();
        if (projectAgenda.projectId) {
          await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[Agenda] Error moving participant to group:', error);
      throw error;
    }
  };
}

/**
 * Add multiple participants and groups to an event
 * 
 * @param {number} eventId - The event ID
 * @param {Array} participants - Array of participant objects
 * @param {Array} groups - Array of group objects
 * @returns {Function} Redux thunk action
 */
export function addEventParticipantsAndGroups(eventId, participants = [], groups = []) {
  return async (dispatch, getState) => {
    try {
      // Add individual participants
      for (const participant of participants) {
        await axios.post(API_ENDPOINTS.addEventParticipant, {
          eventId,
          participantId: participant.id,
          attendance_status: 'scheduled'
        });
      }

      // Add groups
      for (const group of groups) {
        await axios.post(API_ENDPOINTS.addEventGroup, {
          eventId,
          groupId: group.id
        });
      }

      // Refresh agenda data
      const { projectAgenda } = getState();
      if (projectAgenda.projectId) {
        await dispatch(fetchProjectAgenda(projectAgenda.projectId, true));
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Agenda] Error adding participants and groups:', error);
      throw error;
    }
  };
}

// ==============================|| EXPORTS ||============================== //

// Export reducer
export default agendaSlice.reducer;

// Export actions
export const { 
  setAgendaData,
  setLoading,
  setError,
  setProjectId,
  clearAgenda
} = agendaSlice.actions;

// ==============================|| SELECTORS ||============================== //

/**
 * Selector to get all agenda data
 */
export const selectAgendaData = (state) => state.projectAgenda;

/**
 * Selector to get agenda events
 */
export const selectAgendaEvents = (state) => state.projectAgenda.events;

/**
 * Selector to get agenda loading state
 */
export const selectAgendaLoading = (state) => state.projectAgenda.loading;

/**
 * Selector to get agenda error state
 */
export const selectAgendaError = (state) => state.projectAgenda.error;

/**
 * Selector to get project info from agenda
 */
export const selectProjectInfo = (state) => state.projectAgenda.projectInfo;

/**
 * Selector to get agenda metrics
 */
export const selectAgendaMetrics = (state) => state.projectAgenda.metrics;