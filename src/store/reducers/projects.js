// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";
import { openSnackbar } from "./snackbar";

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
    return error?.response?.data?.message || 'Request failed. Please try again.';
  }
  
  return error?.response?.data?.message || error?.message || defaultMessage;
};

const dataRoutes = {
  fetchSingleProject: "/api/projects/fetchSingleProject",
  fetchProjects: "/api/projects/fetchProjects",
  fetchProjectParticipantsDetails: "/api/projects/fetchParticipantsDetails",
  addProject: "/api/projects/addProject",
  updateProject: "/api/projects/updateProject",
  getGroupsFromProjectEmployees: "/api/projects/groupsFromProjectEmployees",
  getEvents: "/api/projects/fetchEvents",
  addGroup: "/api/projects/add-group",
  updateGroup: "/api/projects/update-group",
  fetchGroupsDetails: "/api/projects/fetchGroupsDetails",
  removeGroup: "/api/projects/remove-group",
  getGroups: "/api/projects/groups",
  getEmployees: "/api/projects/employees",
  addEmployees: "/api/projects/addEmployees",
  //participants routes
  addParticipant: "/api/projects/addParticipant",
  updateParticipant: "/api/projects/updateParticipant",
  removeParticipant: "/api/projects/removeParticipant",
  //project settings routes
  fetchProjectSettings: "/api/projects/fetch-project-settings",
  updateProjectSettings: "/api/projects/update-project-settings",
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
  checklistItems: [],
  checklistLoading: false,
  // Curriculum expansion state management
  expandedCurriculums: {}, // { groupId: Set<curriculumId> }
  // Module progress tracking
  moduleProgress: {},
  activityProgress: {},
  progressLoading: false
};

const slice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // HAS ERROR
    hasError(state, action) {
      state.error = action.payload;
    },

    // HAS SUCCESS
    hasSuccess(state, action) {
      state.success = !state.success;
    },
    // IS ADDING?
    isAdding(state, action) {
      state.isAdding = action.payload;
    },
    // CLEAR PROGRESS CACHE
    clearProgressCache(state, action) {
      // Clear progress data from Redux state to force re-fetch
      const projectId = action.payload;
      console.log('Clearing progress cache for project:', projectId);
      // This will cause components to re-fetch progress data
    },
    
    // LOADING
    setLoading(state, action) {
      state.loading = action.payload;
    },
    //PROJECTS

    // GET PROJECTS
    getProjectsSuccess(state, action) {
      // Validate that payload is a valid array of projects
      if (Array.isArray(action.payload) && action.payload.every(project => 
        project && typeof project === 'object' && !project.error
      )) {
        state.projects = action.payload;
        state.error = null; // Clear any previous errors
      } else {
        state.error = 'Invalid projects data received';
        state.projects = [];
      }
    },
    // ADD PROJECT
    addProjectSuccess(state, action) {
      state.projects = action.payload.Projects;
    },
    // UPDATE PROJECT
    updateProjectSuccess(state, action) {
      const updatedProject = action.payload;
      const index = state.projects.findIndex(p => p.id === updatedProject.id);
      console.log("hheheh",updatedProject);
      if (index !== -1) {
        state.projects[index] = updatedProject;
      }
      // Also update singleProject if it matches
      if (state.singleProject && state.singleProject.id === updatedProject.id) {
        state.singleProject = updatedProject;
      }
    },
    // REMOVE PROJECT
    removeProjectSuccess(state, action) {
      state.projects = action.payload;
    },

    // GET SINGLE PROJECT
    getSingleProjectSuccess(state, action) {
      state.singleProject = action.payload;
      // Also update project_participants if they exist in the project data
      if (action.payload?.participants) {
        state.project_participants = action.payload.participants;
      }
    },

    // ADD GROUP
    addGroupSuccess(state, action) {
      const { newGroupsArray, projectIndex, createdGroup, projectId } = action.payload;
      console.log('Add group success:', newGroupsArray, projectIndex, createdGroup);
      
      // Update the groups array in state
      state.groups = newGroupsArray;
      
      // Update singleProject if it exists and matches the project ID
      if (state.singleProject) {
        if (projectId && state.singleProject.id === projectId) {
          state.singleProject.groups = newGroupsArray;
        } else if (!projectId && state.singleProject.groups) {
          // Fallback if no projectId provided
          state.singleProject.groups = newGroupsArray;
        }
      }
      
      // Update projects array if projectIndex is valid
      if (state.projects && state.projects.length > projectIndex && projectIndex >= 0) {
        state.projects[projectIndex].groups = newGroupsArray;
      }
    },

    // UPDATE GROUP
    updateGroupSuccess(state, action) {
      const { updatedGroup, allProjectGroups, projectId } = action.payload;
      console.log('Update group success:', updatedGroup, allProjectGroups);
      
      // Helper function to update group in array while preserving order
      const updateGroupInArray = (groups) => {
        if (!groups || !Array.isArray(groups)) return groups;
        
        return groups.map(group => 
          group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group
        );
      };
      
      // Update the groups array in state (preserve order)
      if (state.groups) {
        state.groups = updateGroupInArray(state.groups);
      } else {
        // Fallback if no existing groups
        state.groups = allProjectGroups;
      }
      
      // Update singleProject if it exists and matches the project ID
      if (state.singleProject) {
        if (projectId && state.singleProject.id === projectId) {
          if (state.singleProject.groups) {
            state.singleProject.groups = updateGroupInArray(state.singleProject.groups);
          } else {
            state.singleProject.groups = allProjectGroups;
          }
        }
      }
      
      // Update projects array - find the project by ID and update its groups
      if (state.projects && projectId) {
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex >= 0) {
          if (state.projects[projectIndex].groups) {
            state.projects[projectIndex].groups = updateGroupInArray(state.projects[projectIndex].groups);
          } else {
            state.projects[projectIndex].groups = allProjectGroups;
          }
        }
      }
    },

    // REMOVE GROUP
    removeGroupSuccess(state, action) {
      const { newGroupsArray, projectIndex } = action.payload;
      
      // Update projects array if projectIndex is valid
      if (state.projects && state.projects.length > projectIndex && projectIndex >= 0) {
        state.projects[projectIndex].groups = newGroupsArray;
      }
      
      // Update singleProject if it exists
      if (state.singleProject && state.singleProject.groups) {
        state.singleProject.groups = newGroupsArray;
      }
      
      // Update groups array if it exists
      if (state.groups) {
        state.groups = newGroupsArray;
      }
    },
    getGroupsSuccess(state, action) {
      state.groups = action.payload;
    },
    // GET GROUPS FROM PROJECT EMPLOYEES
    getGroupsFromProjectEmployeesSuccess(state, action) {
      const i = action.payload.projectIndex;
      state.projects[i].groups = action.payload.aggregatedGroups;
    },
    // GET ITEMS
    getItemsSuccess(state, action) {
      state.items = action.payload;
    },

    // GET EVENTS
    getEventsSuccess(state, action) {
      state.events = action.payload;
    },

    // GET Modules
    getModulesSuccess(state, action) {
      state.modules = action.payload;
      state.activities = action.payload.activities;
    },

    // GET CURRICULUMS
    getCurriculumSuccess(state, action) {
      state.project_curriculums = action.payload;
    },

    // COUNT ENROLLEES
    countEnrolleeSuccess(state, action) {
      state.enrolleeCount = action.payload;
    },
    // GET ENROLLEE COURSE PROGRESS
    getEnrolleeCourseProgressSuccess(state, action) {
      state.enrolleeCourseProgress = action.payload;
    },

    // PROJECT SETTINGS
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
    // GET EMPLOYEES
    getEmployeesSuccess(state, action) {
      state.employees = action.payload;
    },

    // ADD EMPLOYEES
    addEmployeesSuccess(state, action) {
      state.employees = action.payload.employees;
    },

    // GET PROJECT_PARTICIPANTS
    getParticipantsSuccess(state, action) {
      state.project_participants = action.payload;
    },
    // ADD PARTICIPANT
    addParticipantSuccess(state, action) {
      console.log("Participants added", action.payload.participants);
      state.project_participants = action.payload.participants;
    },
    // UPDATE PARTICIPANT
    updateParticipantSuccess(state, action) {
      const { projectIndex, participantsArray, groups } = action.payload;
      console.log("sclice to be done");
    },
    // REMOVOVE PARTICIPANT
    removeParticipantSuccess(state, action) {
      const { remainingParticipants } = action.payload;
      state.project_participants = remainingParticipants;
    },

    importParticipantsSuccess(state, action) {
      state.loading = false;
      state.error = null;
      // The actual participant data will be updated via getSingleProject
      console.log('Import success:', action.payload);
    },

    // PROJECT CHECKLIST ACTIONS
    getProjectChecklistStart(state) {
      state.checklistLoading = true;
      state.error = null;
    },

    getProjectChecklistSuccess(state, action) {
      state.checklistLoading = false;
      state.checklistItems = action.payload;
      state.error = null;
    },

    getProjectChecklistFailure(state, action) {
      state.checklistLoading = false;
      state.error = action.payload;
    },

    updateChecklistProgressSuccess(state, action) {
      const updatedItem = action.payload;
      const index = state.checklistItems.findIndex(
        item => item.id === updatedItem.id
      );
      if (index !== -1) {
        state.checklistItems[index] = {
          ...state.checklistItems[index],
          completed: updatedItem.completed,
          completedAt: updatedItem.completedAt,
          completedBy: updatedItem.completedBy,
          notes: updatedItem.notes,
          progressId: updatedItem.progressId
        };
      }
    },

    // MODULE PROGRESS TRACKING
    setProgressLoading(state, action) {
      state.progressLoading = action.payload;
    },

    saveModuleProgressSuccess(state, action) {
      const { eventId, moduleId, completed } = action.payload;
      const key = `${eventId}_${moduleId}`;
      state.moduleProgress[key] = {
        eventId,
        moduleId,
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };
    },

    saveActivityProgressSuccess(state, action) {
      const { eventId, activityId, completed } = action.payload;
      const key = `${eventId}_${activityId}`;
      state.activityProgress[key] = {
        eventId,
        activityId,
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };
    },

    getProgressSuccess(state, action) {
      const { eventId, data } = action.payload;
      
      // Update module progress
      data.modules.forEach(moduleProgress => {
        const key = `${eventId}_${moduleProgress.moduleId}`;
        state.moduleProgress[key] = moduleProgress;
      });

      // Update activity progress
      data.modules.forEach(moduleProgress => {
        moduleProgress.activities.forEach(activityProgress => {
          const key = `${eventId}_${activityProgress.activityId}`;
          state.activityProgress[key] = activityProgress;
        });
      });
    },

    resetModuleProgressSuccess(state, action) {
      const { eventId, moduleId, activityIds } = action.payload;
      
      // Remove module progress
      const moduleKey = `${eventId}_${moduleId}`;
      delete state.moduleProgress[moduleKey];

      // Remove activity progress for all activities in this module
      activityIds.forEach(activityId => {
        const activityKey = `${eventId}_${activityId}`;
        delete state.activityProgress[activityKey];
      });
    },

    // CURRICULUM EXPANSION STATE MANAGEMENT
    toggleCurriculumExpansion(state, action) {
      const { groupId, curriculumId } = action.payload;
      if (!state.expandedCurriculums[groupId]) {
        state.expandedCurriculums[groupId] = [];
      }
      
      const currentExpanded = state.expandedCurriculums[groupId];
      const index = currentExpanded.indexOf(curriculumId);
      
      if (index > -1) {
        // Remove from expanded
        state.expandedCurriculums[groupId].splice(index, 1);
      } else {
        // Add to expanded
        state.expandedCurriculums[groupId].push(curriculumId);
      }
    },

    clearGroupExpansion(state, action) {
      const { groupId } = action.payload;
      if (state.expandedCurriculums[groupId]) {
        delete state.expandedCurriculums[groupId];
      }
    },

    removeCurriculumFromExpansion(state, action) {
      const { groupId, curriculumId } = action.payload;
      if (state.expandedCurriculums[groupId]) {
        const index = state.expandedCurriculums[groupId].indexOf(curriculumId);
        if (index > -1) {
          state.expandedCurriculums[groupId].splice(index, 1);
        }
      }
    }
  },
});

// Reducer
export default slice.reducer;

// projects

export function getProjects() {
  return async () => {
    try {
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.hasError(false)); // Clear any previous errors
      
      const response = await axios.get(dataRoutes.fetchProjects);
      dispatch(slice.actions.getProjectsSuccess(response.data.projects));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch projects')));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

export function getProjectCurriculums(projectId) {
  return async () => {
    try {
      const response = await axios.post(
        "/api/projects/fetchProjectCurriculums",
        { projectId }
      );
      dispatch(slice.actions.getCurriculumSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch project curriculums')));
    }
  };
}

export function getSingleProject(id) {
  return async () => {
    try {
      dispatch(slice.actions.setLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.post(dataRoutes.fetchSingleProject, { id });
      console.log(response)
      dispatch(slice.actions.getSingleProjectSuccess(response.data.project));
    } catch (error) {
      console.log(error)
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch single project')));
    } finally {
      dispatch(slice.actions.setLoading(false));
    }
  };
}

export function getGroupsFromProjectEmployees(aggregatedGroups, index) {
  return async () => {
    try {
      const response = await axios.post(
        dataRoutes.getGroupsFromProjectEmployees,
        { aggregatedGroups, index }
      );
      dispatch(
        slice.actions.getGroupsFromProjectEmployeesSuccess(response.data)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
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
      console.log(serverResponse.data);
      dispatch(slice.actions.isAdding(!isAdding));
      
      // Return the project ID for redirect purposes
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
      const response = await axios.post("/api/projects/removeProject", {
        projectCUID,
        projects,
      });

      console.log(serverResOnDelete.data);

      // dispatch(slice.actions.hasSuccess(serverResOnDelete.data));
      dispatch(slice.actions.removeProjectSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getGroups(project) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.getGroups, { project });
      dispatch(slice.actions.getGroupsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

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

export function clearProgressCache(projectId) {
  return async (dispatch) => {
    try {
      // Clear server-side cache
      await axios.post('/api/groups/clear-progress-cache', { projectId });
      
      // Clear client-side cache
      dispatch(slice.actions.clearProgressCache(projectId));
      
      console.log('Progress cache cleared for project:', projectId);
    } catch (error) {
      console.warn('Failed to clear progress cache:', error);
    }
  };
}

export function addGroup(newGroup, groups, index, projectId) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addGroup, {
        newGroup,
        groups,
        index,
        projectId,
      });
      dispatch(slice.actions.addGroupSuccess(response.data));
      
      // Immediately fetch updated group details with curriculum data
      // to ensure the new group has proper curriculum information
      if (projectId) {
        const groupDetailsResponse = await axios.post(dataRoutes.fetchGroupsDetails, {
          projectId,
        });
        dispatch(slice.actions.getGroupsSuccess(groupDetailsResponse.data));
      }
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateGroup(groupId, updates, projectId) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateGroup, {
        groupId,
        updates,
        projectId,
      });
      dispatch(slice.actions.updateGroupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function removeGroup(updatedGroups, index, groupId) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.removeGroup, {
        updatedGroups,
        index,
        groupId,
      });

      dispatch(slice.actions.removeGroupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getEmployees(projectId) {
  return async () => {
    try {
      const serverResponse = await axios.post(
        "/api/projects/fetchParticipants",
        { projectId }
      );
      dispatch(slice.actions.getEmployeesSuccess(serverResponse.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addEmployees(newEmployee, employees) {
  console.log(newEmployee);
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addEmployees, {
        newEmployee,
        employees,
      });
      dispatch(slice.actions.addEmployeesSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function countEnrollee(projectId) {
  return async () => {
    try {
      const serverRespons = await axios.post(
        "/api/projects/db-count-enrollee",
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
        "/api/projects/fetchEnrolleCourseProgress",
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

export function addParticipant(
  participants,
  newParticipant,
  groups,
  index,
  projectId
) {
  return async () => {
    try {
      const serverResponse = await axios.post(
        "/api/projects/db-create-project_participant",
        { projectId, newParticipant }
      );
      const projectParticipant = serverResponse.data.projectParticipant;
      const response = await axios.post(dataRoutes.addParticipant, {
        participants,
        newParticipant,
        groups,
        index,
        projectParticipant,
        projectId,
      });
      await dispatch(slice.actions.addParticipantSuccess(response.data));
      console.log(serverResponse.data.message);
    } catch (error) {
      await console.log("internal server error =>", error);
      await dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error; // Re-throw to allow form to handle it
    }
  };
}

export function addManyParticipants(projectId, newParticipants, participants) {
  return async () => {
    try {
      const serverResponse = await axios.post(
        "/api/projects/db-create-multiple-participants",
        { projectId, newParticipants }
      );
      //const response = await axios.post("/api/projects/addManyParticipants", {
      //  participants,
      //   newParticipants
      //  });
      console.log(serverResponse.data.participants);
      await dispatch(slice.actions.addParticipantSuccess(serverResponse.data));
      console.log(serverResponse.data.message);
    } catch (error) {
      await console.log("internal server error =>", error);
      await dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function importParticipantsFromCSV(projectId, participants) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.setLoading(true));
      
      const response = await axios.post("/api/participants/import-csv", {
        projectId,
        participants
      });
      
      if (response.data.success) {
        // Refresh the project data to get updated participants
        await dispatch(getSingleProject(projectId));
        
        dispatch(slice.actions.importParticipantsSuccess(response.data));
        console.log('CSV Import completed:', response.data.message);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Import failed');
      }
    } catch (error) {
      console.error("CSV import error =>", error);
      dispatch(slice.actions.setLoading(false));
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      throw error;
    }
  };
}

export function updateParticipant(index, id, value, participants, groups) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateParticipant, {
        index,
        id,
        value,
        participants,
        groups,
      });
      dispatch(slice.actions.updateParticipantSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function removeParticipant(
  remainingParticipants,
  projectId,
  participantId
) {
  console.log(remainingParticipants);
  return async () => {
    try {
      const serverResponse = await axios.post(
        "/api/projects/db-delete-project_participant",
        { participantId }
      );
      const response = await axios.post(dataRoutes.removeParticipant, {
        remainingParticipants,
      });
      console.log(response.data);
      await console.log(serverResponse.data);
      dispatch(slice.actions.removeParticipantSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function removeManyParticipant(remainingParticipants, selectedIds) {
  console.log(remainingParticipants);
  return async () => {
    try {
      const serverResponse = await axios.post(
        "/api/projects/db-delete-many-project_participant",
        { selectedIds }
      );
      const response = await axios.post(dataRoutes.removeParticipant, {
        remainingParticipants,
      });
      console.log(response.data);
      await console.log(serverResponse.data);
      dispatch(slice.actions.removeParticipantSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function getEvents() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getEvents);
      dispatch(slice.actions.getEventsSuccess(response.data.events));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

// PROJECT SETTINGS ACTIONS
export function getProjectSettings(projectId) {
  return async () => {
    try {
      dispatch(slice.actions.setSettingsLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.get(`${dataRoutes.fetchProjectSettings}?projectId=${projectId}`);
      
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

export function updateProjectSettings(projectId, settingsData) {
  return async () => {
    try {
      dispatch(slice.actions.setSettingsLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.put(dataRoutes.updateProjectSettings, {
        projectId,
        ...settingsData
      });
      
      if (response.data.success) {
        dispatch(slice.actions.updateProjectSettingsSuccess(response.data.settings));
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || 'Failed to update project settings');
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to update project settings')));
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to update project settings' 
      };
    } finally {
      dispatch(slice.actions.setSettingsLoading(false));
    }
  };
}

// PROJECT CHECKLIST FUNCTIONS
export function getProjectChecklist(projectId) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.getProjectChecklistStart());
      const response = await axios.get(`/api/projects/checklist-progress?projectId=${projectId}`);
      dispatch(slice.actions.getProjectChecklistSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.getProjectChecklistFailure(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to load project checklist'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateChecklistProgress(progressData) {
  return async (dispatch) => {
    try {
      const response = await axios.post("/api/projects/checklist-progress", progressData);
      
      // Update the specific item in the state
      const checklistItem = response.data.progress.checklistItem;
      const updatedItem = {
        ...checklistItem,
        completed: response.data.progress.completed,
        completedAt: response.data.progress.completedAt,
        completedBy: response.data.progress.completedBy,
        notes: response.data.progress.notes,
        progressId: response.data.progress.id
      };
      
      dispatch(slice.actions.updateChecklistProgressSuccess(updatedItem));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: response.data.progress.completed 
          ? 'Checklist item marked as completed' 
          : 'Checklist item marked as incomplete',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.getProjectChecklistFailure(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to update checklist progress'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

// MODULE PROGRESS TRACKING ACTIONS
export function saveModuleProgress(eventId, moduleId, activities = []) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.setProgressLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.post('/api/events/save-module-progress', {
        eventId,
        moduleId,
        activities,
        completed: true
      });
      
      if (response.data.success) {
        // Update module progress
        dispatch(slice.actions.saveModuleProgressSuccess({
          eventId,
          moduleId,
          completed: true
        }));
        
        // Update activity progress for each activity
        activities.forEach(activityId => {
          dispatch(slice.actions.saveActivityProgressSuccess({
            eventId,
            activityId,
            completed: true
          }));
        });
        
        // Show success snackbar
        dispatch(openSnackbar({
          open: true,
          message: 'Module progress saved successfully',
          variant: 'alert',
          alert: {
            color: 'success',
            variant: 'filled'
          }
        }));
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || 'Failed to save module progress');
      }
    } catch (error) {
      console.error('Error saving module progress:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to save module progress')));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to save module progress'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      
      return { success: false, error: getErrorMessage(error) };
    } finally {
      dispatch(slice.actions.setProgressLoading(false));
    }
  };
}

export function getEventProgress(eventId) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.setProgressLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.get(`/api/events/get-progress?eventId=${eventId}`);
      
      if (response.data.success) {
        dispatch(slice.actions.getProgressSuccess({
          eventId,
          data: response.data.data
        }));
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch progress');
      }
    } catch (error) {
      console.error('Error fetching event progress:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to fetch progress')));
      return { success: false, error: getErrorMessage(error) };
    } finally {
      dispatch(slice.actions.setProgressLoading(false));
    }
  };
}

export function resetModuleProgress(eventId, moduleId, activities = []) {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.setProgressLoading(true));
      dispatch(slice.actions.hasError(false));
      
      const response = await axios.post('/api/events/reset-module-progress', {
        eventId,
        moduleId
      });
      
      if (response.data.success) {
        // Get activity IDs for state cleanup
        const activityIds = activities.map(activity => activity.id);
        
        dispatch(slice.actions.resetModuleProgressSuccess({
          eventId,
          moduleId,
          activityIds
        }));
        
        // Show success snackbar
        dispatch(openSnackbar({
          open: true,
          message: 'Module progress reset successfully',
          variant: 'alert',
          alert: {
            color: 'info',
            variant: 'filled'
          }
        }));
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || 'Failed to reset module progress');
      }
    } catch (error) {
      console.error('Error resetting module progress:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error, 'Failed to reset module progress')));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to reset module progress'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      
      return { success: false, error: getErrorMessage(error) };
    } finally {
      dispatch(slice.actions.setProgressLoading(false));
    }
  };
}


// CURRICULUM EXPANSION ACTIONS
export const { 
  toggleCurriculumExpansion, 
  clearGroupExpansion, 
  removeCurriculumFromExpansion 
} = slice.actions;
