import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "../../index";
import { getErrorMessage } from "./utils";
import { syncSettingsResponseToStores, syncSettingsToStores, syncInstructorsToStores } from "../../services";

// ----------------------------------------------------------------------

const dataRoutes = {
  fetchProjectSettings: "/api/projects/fetchProjectSettings",
  updateProjectSettings: "/api/projects/update-project-settings",
};

const initialState = {
  loading: false,
  error: null,
  projectId: null,
  
  // Project basic info
  projectInfo: null,
  
  // Project settings
  settings: null,
  
  // Available roles for the organization
  availableRoles: [],
  
  // Available training recipients for the organization
  availableTrainingRecipients: [],
  
  // Available topics for the organization
  availableTopics: [],
  
  // Available curriculums for the organization
  availableCurriculums: [],
  
  // Available instructors for the organization
  availableInstructors: [],
  
  // Training plans for the project
  trainingPlans: [],
  
  // Project instructors
  projectInstructors: [],
  
  // Project topics
  projectTopics: [],
  
  // Project curriculums
  projectCurriculums: [],
  
  // Summary statistics
  summary: {
    participantCount: 0,
    eventCount: 0,
    groupCount: 0,
    trainingPlanCount: 0,
    roleCount: 0,
    instructorCount: 0,
    topicCount: 0,
    curriculumCount: 0
  },
  
  // Track last fetch time for caching
  lastFetched: null,
  
  // Track if data has been initialized
  isInitialized: false
};

const slice = createSlice({
  name: "projectSettings",
  initialState,
  reducers: {
    // Start loading
    startLoading(state) {
      state.loading = true;
      state.error = null;
    },

    // Handle errors
    hasError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Set all settings data from fetchProjectSettings API
    setSettingsData(state, action) {
      const { data } = action.payload;
      
      state.loading = false;
      state.error = null;
      state.projectId = data.project?.id;
      state.projectInfo = data.project;
      state.settings = data.settings;
      state.availableRoles = data.availableRoles || [];
      state.availableTrainingRecipients = data.availableTrainingRecipients || [];
      state.availableTopics = data.availableTopics || [];
      state.availableCurriculums = data.availableCurriculums || [];
      state.availableInstructors = data.availableInstructors || [];
      state.trainingPlans = data.trainingPlans || [];
      state.projectInstructors = data.projectInstructors || [];
      state.projectTopics = data.projectTopics || [];
      state.projectCurriculums = data.projectCurriculums || [];
      state.summary = data.summary || initialState.summary;
      state.lastFetched = new Date().toISOString();
      state.isInitialized = true;
    },

    // Update specific settings
    updateSettings(state, action) {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },

    // Update project info only
    updateProjectInfo(state, action) {
      state.projectInfo = {
        ...state.projectInfo,
        ...action.payload
      };
    },

    // Update available roles
    setAvailableRoles(state, action) {
      state.availableRoles = action.payload;
      if (state.summary) {
        state.summary.roleCount = action.payload.length;
      }
    },

    // Update available training recipients
    setAvailableTrainingRecipients(state, action) {
      state.availableTrainingRecipients = action.payload;
    },

    // Update training plans
    setTrainingPlans(state, action) {
      state.trainingPlans = action.payload;
      if (state.summary) {
        state.summary.trainingPlanCount = action.payload.length;
      }
    },

    // Add a single training plan
    addTrainingPlan(state, action) {
      state.trainingPlans.push(action.payload);
      if (state.summary) {
        state.summary.trainingPlanCount += 1;
      }
    },

    // Update a single training plan
    updateTrainingPlan(state, action) {
      const index = state.trainingPlans.findIndex(plan => plan.id === action.payload.id);
      if (index !== -1) {
        state.trainingPlans[index] = action.payload;
      }
    },

    // Remove a training plan
    removeTrainingPlan(state, action) {
      state.trainingPlans = state.trainingPlans.filter(plan => plan.id !== action.payload);
      if (state.summary) {
        state.summary.trainingPlanCount = state.trainingPlans.length;
      }
    },

    // Topic management
    setProjectTopics(state, action) {
      state.projectTopics = action.payload;
      if (state.summary) {
        state.summary.topicCount = action.payload.length;
      }
    },

    addProjectTopic(state, action) {
      state.projectTopics.push(action.payload);
      if (state.summary) {
        state.summary.topicCount += 1;
      }
    },

    removeProjectTopic(state, action) {
      state.projectTopics = state.projectTopics.filter(topic => topic.id !== action.payload);
      if (state.summary) {
        state.summary.topicCount = state.projectTopics.length;
      }
    },

    // Curriculum management
    setProjectCurriculums(state, action) {
      state.projectCurriculums = action.payload;
      if (state.summary) {
        state.summary.curriculumCount = action.payload.length;
      }
    },

    addProjectCurriculum(state, action) {
      state.projectCurriculums.push(action.payload);
      if (state.summary) {
        state.summary.curriculumCount += 1;
      }
    },

    removeProjectCurriculum(state, action) {
      state.projectCurriculums = state.projectCurriculums.filter(curriculum => curriculum.id !== action.payload);
      if (state.summary) {
        state.summary.curriculumCount = state.projectCurriculums.length;
      }
    },

    // Update summary counts
    updateSummary(state, action) {
      state.summary = {
        ...state.summary,
        ...action.payload
      };
    },

    // Clear settings (e.g., when leaving project page)
    clearSettings(state) {
      return initialState;
    },

    // Reset error
    resetError(state) {
      state.error = null;
    },

    // Legacy support - keep old action names for backward compatibility
    setSettingsLoading(state, action) {
      state.loading = action.payload;
    },
    
    getProjectSettingsSuccess(state, action) {
      // Map old format to new format if needed
      if (action.payload) {
        state.settings = action.payload;
        state.loading = false;
        state.error = null;
      }
    },
    
    updateProjectSettingsSuccess(state, action) {
      state.settings = action.payload;
      state.loading = false;
      state.error = null;
    },
  }
});

// Reducer
export default slice.reducer;

// Export actions
export const {
  setSettingsData,
  updateSettings,
  updateProjectInfo,
  setAvailableRoles,
  setAvailableTrainingRecipients,
  setTrainingPlans,
  addTrainingPlan,
  updateTrainingPlan,
  removeTrainingPlan,
  setProjectTopics,
  addProjectTopic,
  removeProjectTopic,
  setProjectCurriculums,
  addProjectCurriculum,
  removeProjectCurriculum,
  updateSummary,
  clearSettings,
  resetError,
  // Legacy exports
  getProjectSettingsSuccess,
  updateProjectSettingsSuccess,
} = slice.actions;

// ----------------------------------------------------------------------

/**
 * Fetch project settings from the new API
 * @param {number} projectId - The project ID
 * @param {boolean} forceRefresh - Force refresh even if cached
 */
export function fetchProjectSettings(projectId, forceRefresh = false) {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      const { projectSettings } = state;
      
      // Check if we already have data for this project and it's recent (within 5 minutes)
      if (!forceRefresh && 
          projectSettings?.projectId === projectId && 
          projectSettings?.isInitialized &&
          projectSettings?.lastFetched) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const lastFetched = new Date(projectSettings.lastFetched);
        
        if (lastFetched > fiveMinutesAgo) {
          console.log('Using cached project settings');
          return;
        }
      }
      
      dispatch(slice.actions.startLoading());
      
      const response = await axios.post(dataRoutes.fetchProjectSettings, {
        projectId: projectId
      });
      
      if (response.data.success) {
        dispatch(slice.actions.setSettingsData(response.data));
        
        // Sync data to other stores using the centralized sync service
        syncSettingsResponseToStores(dispatch, response.data);
      } else {
        dispatch(slice.actions.hasError(response.data.error || 'Failed to fetch project settings'));
      }
    } catch (error) {
      console.error('Error fetching project settings:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch project settings')));
    }
  };
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use fetchProjectSettings instead
 */
export function getProjectSettings(projectId) {
  return fetchProjectSettings(projectId);
}

/**
 * Update project settings on the server
 * @param {number} projectId - The project ID
 * @param {object} settings - The settings to update
 */
export function updateProjectSettings(projectId, settings) {
  return async (dispatch) => {
    try {
      const response = await axios.put(dataRoutes.updateProjectSettings, {
        projectId: projectId,
        ...settings
      });
      
      if (response.data.success) {
        dispatch(slice.actions.updateSettings(settings));
        
        // Sync settings changes to other stores using the centralized sync service
        syncSettingsToStores(dispatch, settings);
        
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Refresh available roles
 * @param {number} projectId - The project ID
 */
export function refreshAvailableRoles(projectId) {
  return async (dispatch) => {
    try {
      const response = await axios.get(`/api/projects/available-roles?projectId=${projectId}`);
      
      if (response.data.success) {
        dispatch(slice.actions.setAvailableRoles(response.data.roles));
      }
    } catch (error) {
      console.error('Error refreshing available roles:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

/**
 * Refresh training plans
 * @param {number} projectId - The project ID
 */
export function refreshTrainingPlans(projectId) {
  return async (dispatch) => {
    try {
      const response = await axios.get(`/api/training-plans/fetch-for-project?projectId=${projectId}`);
      
      if (response.data.success) {
        dispatch(slice.actions.setTrainingPlans(response.data.trainingPlans));
      }
    } catch (error) {
      console.error('Error refreshing training plans:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

/**
 * Add instructor to project
 * @param {number} projectId - The project ID
 * @param {number} instructorId - The instructor ID
 * @param {string} instructorType - The instructor type (main, assistant, etc.)
 */
export function addProjectInstructor(projectId, instructorId, instructorType) {
  return async (dispatch) => {
    try {
      const response = await axios.post(`/api/projects/instructors?projectId=${projectId}`, {
        instructorId,
        instructorType
      });
      
      if (response.data.success) {
        // Refresh settings store to get updated instructor data
        const settingsResponse = await dispatch(fetchProjectSettings(projectId, true));
        
        // Sync instructor changes to dashboard store
        if (settingsResponse?.data?.projectInstructors) {
          syncInstructorsToStores(dispatch, settingsResponse.data.projectInstructors);
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to add instructor');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Update instructor type for project
 * @param {number} projectId - The project ID
 * @param {number} instructorId - The instructor ID
 * @param {string} newType - The new instructor type
 */
export function updateProjectInstructorType(projectId, instructorId, newType) {
  return async (dispatch) => {
    try {
      const response = await axios.put(`/api/projects/instructors?projectId=${projectId}`, {
        instructorId,
        instructorType: newType
      });
      
      if (response.data.success) {
        // Refresh settings store to get updated instructor data
        const settingsResponse = await dispatch(fetchProjectSettings(projectId, true));
        
        // Sync instructor changes to dashboard store
        if (settingsResponse?.data?.projectInstructors) {
          syncInstructorsToStores(dispatch, settingsResponse.data.projectInstructors);
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to update instructor type');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Remove instructor from project
 * @param {number} projectId - The project ID
 * @param {number} instructorId - The instructor ID
 */
export function removeProjectInstructor(projectId, instructorId) {
  return async (dispatch) => {
    try {
      const response = await axios.delete(`/api/projects/instructors?projectId=${projectId}`, {
        data: { instructorId }
      });
      
      if (response.data.success) {
        // Refresh settings store to get updated instructor data
        const settingsResponse = await dispatch(fetchProjectSettings(projectId, true));
        
        // Sync instructor changes to dashboard store
        if (settingsResponse?.data?.projectInstructors) {
          syncInstructorsToStores(dispatch, settingsResponse.data.projectInstructors);
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to remove instructor');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Update project tags and sync to store
 * This updates the tags field in the project table without refetching everything
 * @param {number} projectId - The project ID
 * @param {Array<string>} tags - Array of tag strings
 */
export function updateProjectTags(projectId, tags) {
  return async (dispatch) => {
    try {
      const response = await axios.put('/api/projects/updateProject', {
        id: projectId,
        tags: JSON.stringify(tags)
      });

      if (response.data.success) {
        // Update only the project info in store (no full refetch)
        dispatch(slice.actions.updateProjectInfo({
          tags: JSON.stringify(tags)
        }));

        return { success: true, tags };
      } else {
        throw new Error(response.data.message || 'Failed to update tags');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Add topic to project (via junction table)
 * @param {number} projectId - The project ID
 * @param {number} topicId - The topic ID to add
 */
export function addTopicToProject(projectId, topicId) {
  return async (dispatch) => {
    try {
      const response = await axios.post('/api/projects/topics', {
        projectId,
        topicId
      });

      if (response.data.success && response.data.data) {
        // Add the topic to store without refetching
        dispatch(slice.actions.addProjectTopic(response.data.data));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to add topic');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Remove topic from project
 * @param {number} projectId - The project ID
 * @param {number} projectTopicId - The project_topic junction table ID
 */
export function removeTopicFromProject(projectId, projectTopicId) {
  return async (dispatch) => {
    try {
      const response = await axios.delete(`/api/projects/topics?projectId=${projectId}&projectTopicId=${projectTopicId}`);

      if (response.data.success) {
        // Remove from store without refetching
        dispatch(slice.actions.removeProjectTopic(projectTopicId));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to remove topic');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Add curriculum to project
 * @param {number} projectId - The project ID
 * @param {number} curriculumId - The curriculum ID to add
 */
export function addCurriculumToProject(projectId, curriculumId) {
  return async (dispatch) => {
    try {
      const response = await axios.post('/api/projects/add-curriculum', {
        projectId,
        curriculumId
      });

      if (response.data.success && response.data.data) {
        // Format the data to match store structure
        const formattedData = {
          id: response.data.data.id,
          curriculumId: response.data.data.curriculumId,
          projectId: response.data.data.projectId,
          assignedAt: response.data.data.assignedAt,
          curriculum: {
            id: response.data.data.curriculum.id,
            cuid: response.data.data.curriculum.cuid,
            title: response.data.data.curriculum.title,
            description: response.data.data.curriculum.description,
            createdAt: response.data.data.curriculum.createdAt,
            updatedAt: response.data.data.curriculum.updatedAt,
            curriculum_courses: response.data.data.curriculum.curriculum_courses || []
          }
        };

        // Add the curriculum to store without refetching
        dispatch(slice.actions.addProjectCurriculum(formattedData));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to add curriculum');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

/**
 * Remove curriculum from project
 * @param {number} projectId - The project ID
 * @param {number} curriculumId - The curriculum ID to remove
 * @param {number} projectCurriculumId - The project_curriculum junction table ID (for store update)
 */
export function removeCurriculumFromProject(projectId, curriculumId, projectCurriculumId) {
  return async (dispatch) => {
    try {
      const response = await axios.delete('/api/projects/remove-curriculum', {
        data: {
          projectId,
          curriculumId
        }
      });

      if (response.data.success) {
        // Remove from store without refetching (use junction table ID)
        dispatch(slice.actions.removeProjectCurriculum(projectCurriculumId));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to remove curriculum');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

// Selectors
export const selectProjectSettings = (state) => state.projectSettings?.settings;
export const selectProjectInfo = (state) => state.projectSettings?.projectInfo;
export const selectAvailableRoles = (state) => state.projectSettings?.availableRoles || [];
export const selectAvailableTrainingRecipients = (state) => state.projectSettings?.availableTrainingRecipients || [];
export const selectAvailableTopics = (state) => state.projectSettings?.availableTopics || [];
export const selectAvailableCurriculums = (state) => state.projectSettings?.availableCurriculums || [];
export const selectAvailableInstructors = (state) => state.projectSettings?.availableInstructors || [];
export const selectTrainingPlans = (state) => state.projectSettings?.trainingPlans || [];
export const selectProjectInstructors = (state) => state.projectSettings?.projectInstructors || [];
export const selectProjectTopics = (state) => state.projectSettings?.projectTopics || [];
export const selectProjectCurriculums = (state) => state.projectSettings?.projectCurriculums || [];
export const selectProjectSummary = (state) => state.projectSettings?.summary;
export const selectSettingsLoading = (state) => state.projectSettings?.loading || false;
export const selectSettingsError = (state) => state.projectSettings?.error;