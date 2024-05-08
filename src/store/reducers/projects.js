// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";

const dataRoutes = {
  fetchSingleProject: "/api/projects/fetchSingleProject",
  fetchProjects: "/api/projects/fetchProjects",
  fetchProjectParticipantsDetails: "/api/projects/fetchParticipantsDetails",
  addProject: "/api/projects/addProject",
  getGroupsFromProjectEmployees: "/api/projects/groupsFromProjectEmployees",
  getEvents: "/api/projects/fetchEvents",
  addGroup: "/api/projects/add-group",
  fetchGroupsDetails: "/api/projects/fetchGroupsDetails",
  removeGroup: "/api/projects/remove-group",
  getGroups: "/api/projects/groups",
  getEmployees: "/api/projects/employees",
  addEmployees: "/api/projects/addEmployees",
  //participants routes
  addParticipant: "/api/projects/addParticipant",
  updateParticipant: "/api/projects/updateParticipant",
  removeParticipant: "/api/projects/removeParticipant",
};

const initialState = {
  error: false,
  success: false,
  isAdding: false,
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
    //PROJECTS

    // GET PROJECTS
    getProjectsSuccess(state, action) {
      state.projects = action.payload;
    },
    // ADD PROJECT
    addProjectSuccess(state, action) {
      state.projects = action.payload.Projects;
    },
    // REMOVE PROJECT
    removeProjectSuccess(state, action) {
      state.projects = action.payload;
    },

    // GET SINGLE PROJECT
    getSingleProjectSuccess(state, action) {
      state.singleProject = action.payload;
    },

    // ADD GROUP
    addGroupSuccess(state, action) {
      const { newGroupsArray, projectIndex } = action.payload;
      console.log(newGroupsArray, projectIndex);
      state.projects[projectIndex].groups = newGroupsArray;
    },
    // REMOVE GROUP
    removeGroupSuccess(state, action) {
      const { newGroupsArray, projectIndex } = action.payload;
      state.projects[projectIndex].groups = newGroupsArray;
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
  },
});

// Reducer
export default slice.reducer;

// projects

export function getProjects() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.fetchProjects);
      dispatch(slice.actions.getProjectsSuccess(response.data.projects));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSingleProject(id) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.fetchSingleProject, { id });
      console.log(response)
      dispatch(slice.actions.getSingleProjectSuccess(response.data.project));
    } catch (error) {
      console.log(error)
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getGroups(project) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.getGroups, { project });
      dispatch(slice.actions.getGroupsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getGroupsDetails(projectId) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.fetchGroupsDetails, {
        projectId,
      });
      dispatch(slice.actions.getGroupsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addGroup(newGroup, groups, index) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addGroup, {
        newGroup,
        groups,
        index,
      });
      dispatch(slice.actions.addGroupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function removeGroup(updatedGroups, index) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.removeGroup, {
        updatedGroups,
        index,
      });

      dispatch(slice.actions.removeGroupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      await dispatch(slice.actions.hasError(error));
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
      await dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getEvents() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getEvents);
      dispatch(slice.actions.getEventsSuccess(response.data.events));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

