import { createSlice } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "../../index";
import { openSnackbar } from "../snackbar";
import { getErrorMessage } from "./utils";
import { syncProjectInfoToStores } from "../../services";

const dataRoutes = {
  fetchSingleProject: "/api/projects/fetchSingleProject",
  fetchProjects: "/api/projects/fetchProjects",
  addProject: "/api/projects/addProject",
  updateProject: "/api/projects/updateProject",
  removeProject: "/api/projects/removeProject",
  fetchProjectCurriculums: "/api/projects/fetchProjectCurriculums",
  countEnrollee: "/api/projects/db-count-enrollee",
  getEnrolleeCourseProgress: "/api/projects/fetchEnrolleCourseProgress",
};

const initialState = {
  error: false,
  success: false,
  isAdding: false,
  loading: false,
  projects: [],
  singleProject: false,
  project_participants: [],
  events: [],
  groups: [],
  modules: [],
  project_curriculums: [],
  employees: [],
  enrolleeCount: 0,
  enrolleeCourseProgress: [],
  projectSettings: null,
  settingsLoading: false,
  expandedCurriculums: {},
  moduleProgress: {},
  activityProgress: {},
  progressLoading: false
};

const slice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    hasError(state, action) {
      state.error = action.payload;
    },
    hasSuccess(state, action) {
      state.success = !state.success;
    },
    isAdding(state, action) {
      state.isAdding = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    getProjectsSuccess(state, action) {
      if (Array.isArray(action.payload) && action.payload.every(project => 
        project && typeof project === 'object' && !project.error
      )) {
        state.projects = action.payload;
        state.error = null;
      } else {
        state.error = 'Invalid projects data received';
        state.projects = [];
      }
    },
    addProjectSuccess(state, action) {
      state.projects = action.payload.Projects;
    },
    updateProjectSuccess(state, action) {
      const updatedProject = action.payload;
      const index = state.projects.findIndex(p => p.id === updatedProject.id);
      if (index !== -1) {
        state.projects[index] = updatedProject;
      }
      if (state.singleProject && state.singleProject.id === updatedProject.id) {
        state.singleProject = updatedProject;
      }
    },
    removeProjectSuccess(state, action) {
      state.projects = action.payload;
    },
    getSingleProjectSuccess(state, action) {
      state.singleProject = action.payload;
      if (action.payload?.participants) {
        state.project_participants = action.payload.participants;
      }
    },
    getCurriculumSuccess(state, action) {
      state.project_curriculums = action.payload;
    },
    countEnrolleeSuccess(state, action) {
      state.enrolleeCount = action.payload;
    },
    getEnrolleeCourseProgressSuccess(state, action) {
      state.enrolleeCourseProgress = action.payload;
    },
    getModulesSuccess(state, action) {
      state.modules = action.payload;
      state.activities = action.payload.activities;
    },

    // EVENTS
    getEventsSuccess(state, action) {
      state.events = action.payload;
    },
    updateProjectEvent(state, action) {
      const updatedEvent = action.payload;
      if (state.singleProject && state.singleProject.events) {
        const eventIndex = state.singleProject.events.findIndex(e => e.id === updatedEvent.id);
        if (eventIndex !== -1) {
          state.singleProject.events[eventIndex] = updatedEvent;
        }
      }
      if (state.events) {
        const eventIndex = state.events.findIndex(e => e.id === updatedEvent.id);
        if (eventIndex !== -1) {
          state.events[eventIndex] = updatedEvent;
        }
      }
    },
    
    // GROUPS
    getGroupsSuccess(state, action) {
      state.groups = action.payload;
    },
    
    // PARTICIPANTS
    getParticipantsSuccess(state, action) {
      state.project_participants = action.payload;
    },
    getEmployeesSuccess(state, action) {
      state.employees = action.payload;
    },
    
    // SETTINGS
    setSettingsLoading(state, action) {
      state.settingsLoading = action.payload;
    },
    getProjectSettingsSuccess(state, action) {
      state.projectSettings = action.payload;
      state.settingsLoading = false;
      state.error = null;
    },
    updateProjectSettingsSuccess(state, action) {
      state.projectSettings = action.payload;
      state.settingsLoading = false;
      state.error = null;
    },
  },
});

export default slice.reducer;

/**
 * Fetch all projects from the server
 * 
 * This is the primary function used by the project list page to load all projects.
 * Called when:
 * - User navigates to /projects page
 * - Projects need to be refreshed
 * 
 * Updates state:
 * - projects: Array of all projects
 * - loading: true while fetching, false when done
 * - error: any error message from API
 */
export function getProjects(forceRefresh = false) {
  return async (dispatch, getState) => {
    try {
      // Check if projects are already loaded and not forcing refresh
      const currentState = getState();
      const hasProjects = currentState.projects?.projects?.length > 0;
      
      if (hasProjects && !forceRefresh) {
        console.log('Fetching Cached Projects, skipping API call');
        return;
      }
      
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.get(dataRoutes.fetchProjects);
      dispatch(slice.actions.getProjectsSuccess(response.data.projects));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch projects')));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

export function getSingleProject(id) {
  return async () => {
    try {
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.post(dataRoutes.fetchSingleProject, { id });
      dispatch(slice.actions.getSingleProjectSuccess(response.data.project));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch single project')));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

export function addProject(newProject, Projects, isAdding) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addProject, {
        newProject,
        Projects,
      });
      await dispatch(slice.actions.addProjectSuccess(response.data));
      const serverResponse = await axios.post(
        "/api/projects/db-create-project",
        {
          newProject,
        }
      );
      dispatch(slice.actions.isAdding(!isAdding));

      // Fetch all projects to get the complete data with user relations
      // This ensures the newly created project has all its relations (user, training_recipient, etc.)
      try {
        const projectsResponse = await axios.get(dataRoutes.fetchProjects);
        if (projectsResponse.data?.projects) {
          dispatch(slice.actions.getProjectsSuccess(projectsResponse.data.projects));
        }
      } catch (fetchError) {
        console.error('Error refreshing projects after creation:', fetchError);
        // Don't fail the whole operation if refresh fails
      }

      return {
        success: true,
        projectId: serverResponse.data.projectId,
        message: serverResponse.data.message
      };
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  };
}

export function updateProject(projectData) {
  return async () => {
    try {
      const response = await axios.put(dataRoutes.updateProject, projectData);
      
      if (response.data.success) {
        dispatch(slice.actions.updateProjectSuccess(response.data.project));
        
        // Sync updated project info with other stores using the centralized sync service
        if (response.data.project) {
          syncProjectInfoToStores(dispatch, response.data.project);
        }
        
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || 'Failed to update project');
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to update project' 
      };
    }
  };
}

export function removeProject(projectCUID, projects) {
  return async () => {
    try {
      const serverResOnDelete = await axios.post(
        "/api/projects/db-delete-project",
        {
          projectCUID,
        }
      );
      const response = await axios.post(dataRoutes.removeProject, {
        projectCUID,
        projects,
      });

      dispatch(slice.actions.removeProjectSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getProjectCurriculums(projectId) {
  return async () => {
    try {
      const response = await axios.post(
        dataRoutes.fetchProjectCurriculums,
        { projectId }
      );
      dispatch(slice.actions.getCurriculumSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch project curriculums')));
    }
  };
}

export function countEnrollee(projectId) {
  return async () => {
    try {
      const serverRespons = await axios.post(
        dataRoutes.countEnrollee,
        {
          projectId,
        }
      );
      dispatch(slice.actions.countEnrolleeSuccess(serverRespons.data.count));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getEnrolleeCourseProgress(courseId) {
  return async () => {
    try {
      const serverRespons = await axios.post(
        dataRoutes.getEnrolleeCourseProgress,
        {
          courseId,
        }
      );
      dispatch(slice.actions.getEnrolleeCourseProgressSuccess(serverRespons.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

// Checklist functions removed - now using RTK Query (useGetProjectChecklistQuery)
// and semantic commands (checklistCommands) in src/store/commands/checklistCommands.js

// Additional essential functions
export function getEvents() {
  return async () => {
    try {
      const response = await axios.get("/api/projects/fetchEvents");
      dispatch(slice.actions.getEventsSuccess(response.data.events));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
}

export function getGroupsDetails(projectId) {
  return async () => {
    try {
      const response = await axios.post("/api/projects/fetchGroupsDetails", {
        projectId,
      });
      dispatch(slice.actions.getGroupsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getParticipants(projectId) {
  return async () => {
    try {
      const response = await axios.post(
        "/api/projects/fetchParticipantsDetails",
        { projectId }
      );
      dispatch(slice.actions.getParticipantsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getProjectSettings(projectId) {
  return async () => {
    try {
      dispatch(slice.actions.setSettingsLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.get(`/api/projects/fetch-project-settings?projectId=${projectId}`);
      
      if (response.data.success) {
        dispatch(slice.actions.getProjectSettingsSuccess(response.data.settings));
      } else {
        throw new Error(response.data.message || 'Failed to fetch project settings');
      }
    } catch (error) {
      console.error('Error fetching project settings:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch project settings')));
    } finally {
      dispatch(slice.actions.setSettingsLoading(false));
    }
  };
}

export const { 
  hasError,
  hasSuccess,
  isAdding,
  setLoading,
  getSingleProjectSuccess,
  updateProjectSuccess,
  updateProjectEvent,
  getEventsSuccess,
  getGroupsSuccess,
  getParticipantsSuccess,
  getProjectSettingsSuccess,
} = slice.actions;