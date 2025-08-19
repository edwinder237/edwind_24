// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";
import { openSnackbar } from "./snackbar";

// Utility function to extract error message
const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  return error?.response?.data?.message || error?.message || defaultMessage;
};

const initialState = {
  error: null,
  response: null,
  courses: [],
  curriculums: [],
  columnsOrder: [],
  comments: [],
  modules: [],
  activities: [],
  profiles: [],
  selectedItem: false,
  selectedActivity: null,
  userStory: [],
  userStoryOrder: [],
  checklistItems: [],
  checklistLoading: false,
  modulesOrderLoading: false,
  activitiesOrderLoading: false,
  courseObjectives: [],
  moduleObjectives: {},
  trainingPlans: [],
  currentTrainingPlan: null,
  trainingPlanLoading: false,
};

// ==============================|| SLICE - KANBAN ||============================== //

const slice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    // HAS ERROR
    hasError(state, action) {
      state.error = action.payload;
    },

    //HAS RESPONSE

    hasResponse(state, action) {
      state.response = action.payload;
    },

    // ADD COLUMN
    addColumnSuccess(state, action) {
      state.courses = action.payload.columns;
      state.columnsOrder = action.payload.columnsOrder;
    },

    // EDIT COLUMN
    editColumnSuccess(state, action) {
      state.courses = action.payload.columns;
    },
    //MODULES
    // ADD MODULE
    addModuleSuccess(state, action) {
      state.modules = action.payload.modules;
    },

    // DUPLICATE MODULE
    duplicateModuleSuccess(state, action) {
      state.modules = action.payload.modules;
    },

    // UPDATE MODULE LEVEL
    updateModuleLevelSuccess(state, action) {
      const updatedModule = action.payload.module;
      state.modules = state.modules.map(module => 
        module.id === updatedModule.id 
          ? { ...module, ...updatedModule }
          : module
      );
    },

    // UPDATE MODULES ORDER
    updateModulesOrderSuccess(state, action) {
      state.modules = action.payload.newModulesOrder;
    },

    // UPDATE ACTIVITIES ORDER
    updateActivitiesOrderSuccess(state, action) {
      const index = action.payload.index;
      state.modules[index].activities = action.payload.newActivitiesOrder;
    },

    // UPDATE MODULES CONTENT
    updateModuleContentSuccess(state, action) {
      state.modules = action.payload.content;
    },

    // EDIT MODULE
    editModuleSuccess(state, action) {
      state.modules = action.payload.modules;
    },

    // DELETE COLUMN
    deleteColumnSuccess(state, action) {
      state.courses = action.payload.columns;
      state.columnsOrder = action.payload.columnsOrder;
    },

    // ADD ITEM
    addItemSuccess(state, action) {
      state.modules = action.payload.items;
      state.courses = action.payload.columns;
      state.userStory = action.payload.userStory;
    },

    // UPDATE COLUMN ITEM ORDER
    updateColumnItemOrderSuccess(state, action) {
      state.courses = action.payload.columns;
    },

    // SELECT ITEM
    selectItemSuccess(state, action) {
      state.selectedItem = action.payload.selectedItem;
    },

    // SELECT ACTIVITY
    selectActivitySuccess(state, action) {
      state.selectedActivity = action.payload.selectedActivity;
    },

    // UPDATE ACTIVITY
    updateActivitySuccess(state, action) {
      const updatedActivity = action.payload;
      
      // Update the activity in the modules array
      state.modules = state.modules.map(module => ({
        ...module,
        activities: module.activities?.map(activity => 
          activity.id === updatedActivity.id 
            ? { ...activity, ...updatedActivity }
            : activity
        ) || []
      }));
      
      // Update selectedActivity if it's the same one
      if (state.selectedActivity && state.selectedActivity.id === updatedActivity.id) {
        state.selectedActivity = {
          ...state.selectedActivity,
          data: { ...state.selectedActivity.data, ...updatedActivity }
        };
      }
    },

    // UPDATE MODULE DURATION
    updateModuleDurationSuccess(state, action) {
      const { moduleId, customDuration } = action.payload;
      
      // Update the module in the modules array
      state.modules = state.modules.map(module => 
        module.id === moduleId 
          ? { ...module, customDuration }
          : module
      );
    },

    // ADD ITEM COMMENT
    addItemCommentSuccess(state, action) {
      state.modules = action.payload.items;
      state.comments = action.payload.comments;
    },

    // DELETE ITEM
    deleteItemSuccess(state, action) {
      state.modules = action.payload.modules;
    },

    // ADD STORY
    addStorySuccess(state, action) {
      state.userStory = action.payload.userStory;
      state.userStoryOrder = action.payload.userStoryOrder;
    },

    // EDIT STORY
    editStorySuccess(state, action) {
      state.userStory = action.payload.userStory;
    },

    // UPDATE STORY ORDER
    updateStoryOrderSuccess(state, action) {
      state.userStoryOrder = action.payload.userStoryOrder;
    },

    // UPDATE STORY ITEM ORDER
    updateStoryItemOrderSuccess(state, action) {
      state.userStory = action.payload.userStory;
    },

    // ADD STORY COMMENT
    addStoryCommentSuccess(state, action) {
      state.userStory = action.payload.userStory;
      state.comments = action.payload.comments;
    },

    // DELETE STORY
    deleteStorySuccess(state, action) {
      state.userStory = action.payload.userStory;
      state.userStoryOrder = action.payload.userStoryOrder;
    },

    // GET COURSES
    getCoursesSuccess(state, action) {
      state.courses = action.payload;
    },

    // GET COLUMNS ORDER
    getColumnsOrderSuccess(state, action) {
      state.columnsOrder = action.payload;
    },

    // GET COMMENTS
    getCommentsSuccess(state, action) {
      state.comments = action.payload;
    },

    // GET PROFILES
    getProfilesSuccess(state, action) {
      state.profiles = action.payload;
    },

    // GET MODULES
    getModulesSuccess(state, action) {
      state.modules = action.payload;
    },

    // GET USER STORY
    getUserStorySuccess(state, action) {
      state.userStory = action.payload;
    },

    // GET USER STORY ORDER
    getUserStoryOrderSuccess(state, action) {
      state.userStoryOrder = action.payload;
    },

    // CURRICULUM ACTIONS
    getCurriculumsSuccess(state, action) {
      state.curriculums = action.payload;
    },

    addCurriculumSuccess(state, action) {
      state.curriculums.push(action.payload);
    },

    deleteCurriculumSuccess(state, action) {
      state.curriculums = state.curriculums.filter(
        curriculum => curriculum.id !== action.payload
      );
    },


    updateCurriculumSuccess(state, action) {
      const index = state.curriculums.findIndex(
        curriculum => curriculum.id === action.payload.id
      );
      if (index !== -1) {
        state.curriculums[index] = action.payload;
      }
    },

    // COURSE ACTIONS
    addCourseSuccess(state, action) {
      state.courses.push(action.payload);
    },

    updateCourseSuccess(state, action) {
      const index = state.courses.findIndex(
        course => course.id === action.payload.id
      );
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },

    deleteCourseSuccess(state, action) {
      state.courses = state.courses.filter(
        course => course.id !== action.payload
      );
    },

    deactivateCourseSuccess(state, action) {
      const index = state.courses.findIndex(
        course => course.id === action.payload.id
      );
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },

    activateCourseSuccess(state, action) {
      const index = state.courses.findIndex(
        course => course.id === action.payload.id
      );
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },

    // ACTIVITY ACTIONS
    addActivitySuccess(state, action) {
      const { moduleId, activity } = action.payload;
      const moduleIndex = state.modules.findIndex(m => m.id === moduleId);
      if (moduleIndex !== -1) {
        if (!state.modules[moduleIndex].activities) {
          state.modules[moduleIndex].activities = [];
        }
        state.modules[moduleIndex].activities.push(activity);
      }
    },

    deleteActivitySuccess(state, action) {
      const { activityId } = action.payload;
      state.modules = state.modules.map(module => ({
        ...module,
        activities: (module.activities || []).filter(activity => activity.id !== activityId)
      }));
    },

    // CHECKLIST ACTIONS
    getChecklistItemsStart(state) {
      state.checklistLoading = true;
      state.error = null;
    },

    getChecklistItemsSuccess(state, action) {
      state.checklistLoading = false;
      state.checklistItems = action.payload;
      state.error = null;
    },

    getChecklistItemsFailure(state, action) {
      state.checklistLoading = false;
      state.error = action.payload;
    },

    addChecklistItemSuccess(state, action) {
      state.checklistItems.push(action.payload);
    },

    updateChecklistItemSuccess(state, action) {
      const index = state.checklistItems.findIndex(
        item => item.id === action.payload.id
      );
      if (index !== -1) {
        state.checklistItems[index] = action.payload;
      }
    },

    deleteChecklistItemSuccess(state, action) {
      state.checklistItems = state.checklistItems.filter(
        item => item.id !== action.payload
      );
    },

    // LOADING STATES
    setModulesOrderLoading(state, action) {
      state.modulesOrderLoading = action.payload;
    },

    setActivitiesOrderLoading(state, action) {
      state.activitiesOrderLoading = action.payload;
    },

    // COURSE OBJECTIVES
    getCourseObjectivesSuccess(state, action) {
      state.courseObjectives = action.payload;
    },

    addCourseObjectiveSuccess(state, action) {
      state.courseObjectives.push(action.payload);
    },

    updateCourseObjectiveSuccess(state, action) {
      const index = state.courseObjectives.findIndex(obj => obj.id === action.payload.id);
      if (index !== -1) {
        state.courseObjectives[index] = action.payload;
      }
    },

    deleteCourseObjectiveSuccess(state, action) {
      state.courseObjectives = state.courseObjectives.filter(obj => obj.id !== action.payload);
    },

    // MODULE OBJECTIVES
    getModuleObjectivesSuccess(state, action) {
      const { moduleId, objectives } = action.payload;
      state.moduleObjectives[moduleId] = objectives;
    },

    addModuleObjectiveSuccess(state, action) {
      const { moduleId, objective } = action.payload;
      if (!state.moduleObjectives[moduleId]) {
        state.moduleObjectives[moduleId] = [];
      }
      state.moduleObjectives[moduleId].push(objective);
    },

    updateModuleObjectiveSuccess(state, action) {
      const { moduleId, objective } = action.payload;
      if (state.moduleObjectives[moduleId]) {
        const index = state.moduleObjectives[moduleId].findIndex(obj => obj.id === objective.id);
        if (index !== -1) {
          state.moduleObjectives[moduleId][index] = objective;
        }
      }
    },

    deleteModuleObjectiveSuccess(state, action) {
      const { moduleId, objectiveId } = action.payload;
      if (state.moduleObjectives[moduleId]) {
        state.moduleObjectives[moduleId] = state.moduleObjectives[moduleId].filter(obj => obj.id !== objectiveId);
      }
    },

    // Training Plans reducers
    setTrainingPlanLoading(state, action) {
      state.trainingPlanLoading = action.payload;
    },

    fetchTrainingPlansSuccess(state, action) {
      state.trainingPlans = action.payload;
      state.trainingPlanLoading = false;
    },

    fetchTrainingPlanSuccess(state, action) {
      state.currentTrainingPlan = action.payload;
      state.trainingPlanLoading = false;
    },

    createTrainingPlanSuccess(state, action) {
      state.trainingPlans.push(action.payload);
      state.currentTrainingPlan = action.payload;
      state.trainingPlanLoading = false;
    },

    updateTrainingPlanSuccess(state, action) {
      const updatedPlan = action.payload;
      state.trainingPlans = state.trainingPlans.map(plan => 
        plan.id === updatedPlan.id ? updatedPlan : plan
      );
      state.currentTrainingPlan = updatedPlan;
      state.trainingPlanLoading = false;
    },

    deleteTrainingPlanSuccess(state, action) {
      const deletedId = action.payload;
      state.trainingPlans = state.trainingPlans.filter(plan => plan.id !== deletedId);
      if (state.currentTrainingPlan?.id === deletedId) {
        state.currentTrainingPlan = null;
      }
      state.trainingPlanLoading = false;
    },

    clearCurrentTrainingPlan(state) {
      state.currentTrainingPlan = null;
    },
  },
});

// Reducer
export default slice.reducer;

export function getCourses() {
  return async () => {
    try {
      const response = await axios.get("/api/courses/fetchCourses");
      dispatch(slice.actions.getCoursesSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

/// In USE //
export function getModules(courseId) {
  return async () => {
    try {
      if (!courseId) {
        dispatch(slice.actions.getModulesSuccess([]));
        return;
      }
      
      const response = await axios.get(`/api/courses/getModulesWithActivities?courseId=${courseId}`);
      dispatch(slice.actions.getModulesSuccess(response.data.modules));
    } catch (error) {
      console.error('Error fetching modules:', error);
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.getModulesSuccess([])); // Set empty array on error
    }
  };
}

export function addModule(modules, module) {
  return async () => {
    try {
      // First create in database to get real ID
      const serverResponse = await axios.post("/api/courses/db-create-module", {
        module,
      });

      // Update the module with real database ID and add to modules array
      const moduleWithDbId = { ...module, id: serverResponse.data.module.id };
      const updatedModules = [...modules, moduleWithDbId];

      // Update local state with database-generated module
      dispatch(slice.actions.addModuleSuccess({ modules: updatedModules }));
      dispatch(slice.actions.hasResponse(serverResponse.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Module created successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to create module');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function duplicateModule(moduleId, modules) {
  return async () => {
    try {
      // Call API to duplicate the module
      const serverResponse = await axios.post("/api/courses/duplicate-module", {
        moduleId,
      });

      // Add the duplicated module to the modules array
      const duplicatedModule = serverResponse.data.module;
      const updatedModules = [...modules, duplicatedModule];

      // Update local state with the duplicated module
      dispatch(slice.actions.duplicateModuleSuccess({ modules: updatedModules }));
      dispatch(slice.actions.hasResponse(serverResponse.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Module duplicated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to duplicate module');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateModuleLevel(moduleId, level) {
  return async () => {
    try {
      // Call API to update the module level
      const serverResponse = await axios.put("/api/courses/update-module-level", {
        moduleId,
        level
      });

      // Update local state with the updated module
      dispatch(slice.actions.updateModuleLevelSuccess({ module: serverResponse.data.module }));
      dispatch(slice.actions.hasResponse(serverResponse.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: `Module level updated to ${level}`,
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update module level');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function editModule(editedModule, moduleId, modules) {
  return async () => {
    try {
      // Update local state first for immediate UI feedback
      const response = await axios.post("/api/courses/edit-module", {
        editedModule,
        moduleId,
        modules,
      });
      dispatch(slice.actions.editModuleSuccess(response.data));
      console.log('TO DB:', editedModule);
      // Save to database
      const serverResponse = await axios.post("/api/courses/db-update-module", {
        editedModule,
        moduleId,
      });
      dispatch(slice.actions.hasResponse(serverResponse.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Module updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update module');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function deleteItem(moduleId, modules) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/delete-module", {
        moduleId,
        modules,
      });

      await dispatch(slice.actions.deleteItemSuccess(response.data));
      const serverResponse = await axios.post("/api/courses/db-delete-module", {
        moduleId,
      });
      await dispatch(slice.actions.hasResponse(serverResponse.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}


export function updateModulesOrder(newModulesOrder, courseId) {
  return async () => {
    try {
      // Set loading state
      dispatch(slice.actions.setModulesOrderLoading(true));
      
      // Update local state first for immediate UI feedback
      dispatch(slice.actions.updateModulesOrderSuccess({ newModulesOrder }));
      
      // Sync with database
      const response = await axios.post("/api/courses/update-module-order", {
        modules: newModulesOrder,
        courseId,
      });
      
      // Update with fresh data from database
      dispatch(slice.actions.updateModulesOrderSuccess({ newModulesOrder: response.data.modules }));
      dispatch(slice.actions.hasResponse({ message: 'Module order updated successfully' }));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Module order saved successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
      
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update module order');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      
      // Optionally revert the optimistic update here
    } finally {
      // Clear loading state
      dispatch(slice.actions.setModulesOrderLoading(false));
    }
  };
}

export function updateModuleContent(
  updatedJSONContent,
  selectedModuleId,
  editedJSON
) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/update-modules-content", {
        updatedJSONContent,
      });
      await dispatch(slice.actions.updateModuleContentSuccess(response.data));

      const serverResponse = await axios.post(
        "/api/courses/db-update-module-content",
        { editedJSON, selectedModuleId }
      );
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateActivitiesOrder(
  newActivitiesOrder,
  moduleIndex,
  moduleId
) {
  return async () => {
    try {
      // Set loading state
      dispatch(slice.actions.setActivitiesOrderLoading(true));
      
      // Update local state first for immediate UI feedback
      dispatch(slice.actions.updateActivitiesOrderSuccess({ 
        newActivitiesOrder, 
        index: moduleIndex 
      }));
      
      // Sync with database
      const response = await axios.post("/api/courses/update-activity-order", {
        activities: newActivitiesOrder,
        moduleId,
      });
      
      // Update with fresh data from database
      dispatch(slice.actions.updateActivitiesOrderSuccess({ 
        newActivitiesOrder: response.data.activities, 
        index: moduleIndex 
      }));
      dispatch(slice.actions.hasResponse({ message: 'Activity order updated successfully' }));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Activity order saved successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
      
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update activity order');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      
      // Optionally revert the optimistic update here
    } finally {
      // Clear loading state
      dispatch(slice.actions.setActivitiesOrderLoading(false));
    }
  };
}

/// REMOVED UNUSED KANBAN FUNCTIONS ///

export function addColumn(column, columns, columnsOrder) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/add-column", {
        column,
        columns,
        columnsOrder,
      });
      dispatch(slice.actions.addColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function editColumn(column, columns) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/edit-column", {
        column,
        columns,
      });
      dispatch(slice.actions.editColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function deleteColumn(columnId, columnsOrder, columns) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/delete-column", {
        columnId,
        columnsOrder,
        columns,
      });
      dispatch(slice.actions.deleteColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addItem(columnId, columns, item, items, storyId, userStory) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/add-item", {
        columnId,
        columns,
        item,
        items,
        storyId,
        userStory,
      });
      dispatch(slice.actions.addItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateItemOrder(columns) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/update-item-order", {
        columns,
      });
      dispatch(slice.actions.updateColumnItemOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function selectItem(selectedItem) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/select-item", {
        selectedItem,
      });
      dispatch(slice.actions.selectItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addItemComment(itemId, comment, items, comments) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/add-item-comment", {
        items,
        itemId,
        comment,
        comments,
      });
      dispatch(slice.actions.addItemCommentSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addStory(story, userStory, userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/add-story", {
        userStory,
        story,
        userStoryOrder,
      });
      dispatch(slice.actions.addStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function editStory(story, userStory) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/edit-story", {
        userStory,
        story,
      });
      dispatch(slice.actions.editStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateStoryOrder(userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/update-story-order", {
        userStoryOrder,
      });
      dispatch(slice.actions.updateStoryOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateStoryItemOrder(userStory) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/update-storyitem-order", {
        userStory,
      });
      dispatch(slice.actions.updateStoryItemOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addStoryComment(storyId, comment, comments, userStory) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/add-story-comment", {
        userStory,
        storyId,
        comment,
        comments,
      });
      dispatch(slice.actions.addStoryCommentSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function deleteStory(storyId, userStory, userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post("/api/kanban/delete-story", {
        userStory,
        storyId,
        userStoryOrder,
      });
      dispatch(slice.actions.deleteStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

// CURRICULUM FUNCTIONS
export function getCurriculums() {
  return async () => {
    try {
      const response = await axios.get("/api/curriculums/fetchCurriculums");
      dispatch(slice.actions.getCurriculumsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function addCurriculum(curriculumData) {
  return async () => {
    try {
      const response = await axios.post("/api/curriculums/createCurriculum", curriculumData);
      dispatch(slice.actions.addCurriculumSuccess(response.data.curriculum));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function deleteCurriculum(curriculumId) {
  return async () => {
    try {
      const response = await axios.delete(`/api/curriculums/deleteCurriculum?id=${curriculumId}`);
      dispatch(slice.actions.deleteCurriculumSuccess(curriculumId));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function updateCurriculum(curriculumData) {
  return async () => {
    try {
      const response = await axios.put("/api/curriculums/updateCurriculum", curriculumData);
      dispatch(slice.actions.updateCurriculumSuccess(response.data.curriculum));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

// COURSE FUNCTIONS
export function createCourse(courseData) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/createCourse", courseData);
      dispatch(slice.actions.addCourseSuccess(response.data.course));
      dispatch(slice.actions.hasResponse(response.data));
      
      // Return the course ID for redirect purposes
      return {
        success: true,
        courseId: response.data.courseId,
        message: response.data.message
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

export function updateCourse(courseData) {
  return async () => {
    try {
      const response = await axios.put("/api/courses/updateCourse", courseData);
      dispatch(slice.actions.updateCourseSuccess(response.data.course));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
    }
  };
}

export function deleteCourse(courseId) {
  return async () => {
    try {
      const response = await axios.delete(`/api/courses/deleteCourse?id=${courseId}`);
      
      // Check if the response indicates success
      if (response.data && response.data.success === false) {
        const errorMessage = response.data.message || 'Failed to delete course';
        dispatch(slice.actions.hasError(errorMessage));
        throw new Error(errorMessage);
      }
      
      dispatch(slice.actions.deleteCourseSuccess(courseId));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      // Handle both axios errors and API errors
      let errorMessage;
      
      if (error.response && error.response.data) {
        // This is an axios error with response data
        errorMessage = error.response.data.message || 'Failed to delete course';
      } else if (error.message) {
        // This is a thrown error with a message
        errorMessage = error.message;
      } else {
        // Fallback error message
        errorMessage = 'Failed to delete course';
      }
      
      dispatch(slice.actions.hasError(errorMessage));
      throw new Error(errorMessage);
    }
  };
}

export function deactivateCourse(courseId) {
  return async () => {
    try {
      const response = await axios.put(`/api/courses/deactivateCourse?id=${courseId}`);
      dispatch(slice.actions.deactivateCourseSuccess(response.data.course));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch(slice.actions.hasError(errorMessage));
      throw new Error(errorMessage);
    }
  };
}

export function activateCourse(courseId) {
  return async () => {
    try {
      const response = await axios.put(`/api/courses/activateCourse?id=${courseId}`);
      dispatch(slice.actions.activateCourseSuccess(response.data.course));
      dispatch(slice.actions.hasResponse(response.data));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch(slice.actions.hasError(errorMessage));
      throw new Error(errorMessage);
    }
  };
}

// ACTIVITY FUNCTIONS
export function createActivity(activityData) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/createActivity", activityData);
      
      dispatch(slice.actions.addActivitySuccess({
        moduleId: activityData.moduleId,
        activity: response.data.activity
      }));
      dispatch(slice.actions.hasResponse(response.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Activity created successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to create activity');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateActivity(activityId, activityData) {
  return async (dispatch) => {
    try {
      const response = await axios.put("/api/courses/updateActivity", {
        id: activityId,
        ...activityData
      });
      
      dispatch(slice.actions.updateActivitySuccess(response.data.activity));
      dispatch(slice.actions.hasResponse(response.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Activity updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update activity');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function deleteActivity(activityId) {
  return async (dispatch) => {
    try {
      const response = await axios.delete(`/api/courses/deleteActivity?id=${activityId}`);
      
      dispatch(slice.actions.deleteActivitySuccess({
        activityId: activityId
      }));
      dispatch(slice.actions.hasResponse(response.data));

      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Activity deleted successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));

    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to delete activity');
      dispatch(slice.actions.hasError(errorMessage));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

// CHECKLIST FUNCTIONS
export function getChecklistItems(courseId) {
  return async () => {
    try {
      dispatch(slice.actions.getChecklistItemsStart());
      const response = await axios.get(`/api/courses/checklist-items?courseId=${courseId}`);
      dispatch(slice.actions.getChecklistItemsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.getChecklistItemsFailure(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to load checklist items'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function createChecklistItem(itemData) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/checklist-items", itemData);
      dispatch(slice.actions.addChecklistItemSuccess(response.data));
      dispatch(slice.actions.hasResponse(response.data));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Checklist item created successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to create checklist item'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateChecklistItem(itemData) {
  return async () => {
    try {
      const { id, ...data } = itemData;
      const response = await axios.put(`/api/courses/checklist-items?id=${id}`, data);
      dispatch(slice.actions.updateChecklistItemSuccess(response.data));
      dispatch(slice.actions.hasResponse({ message: 'Checklist item updated successfully' }));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Checklist item updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to update checklist item'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function deleteChecklistItem(itemId) {
  return async () => {
    try {
      const response = await axios.delete(`/api/courses/checklist-items?id=${itemId}`);
      dispatch(slice.actions.deleteChecklistItemSuccess(itemId));
      dispatch(slice.actions.hasResponse(response.data));
      
      // Show success snackbar
      dispatch(openSnackbar({
        open: true,
        message: 'Checklist item deleted successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      
      // Show error snackbar
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to delete checklist item'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}


// ==============================|| COURSE OBJECTIVES ||============================== //

export function getCourseObjectives(courseId) {
  return async () => {
    try {
      const response = await axios.get(`/api/courses/course-objectives?courseId=${courseId}`);
      dispatch(slice.actions.getCourseObjectivesSuccess(response.data.objectives));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to fetch course objectives'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function addCourseObjective(courseId, objective, createdBy) {
  return async () => {
    try {
      const response = await axios.post('/api/courses/course-objectives', {
        courseId,
        objective,
        createdBy
      });
      dispatch(slice.actions.addCourseObjectiveSuccess(response.data.objective));
      dispatch(openSnackbar({
        open: true,
        message: 'Course objective added successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to add course objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateCourseObjective(id, objective, updatedBy) {
  return async () => {
    try {
      const response = await axios.put('/api/courses/course-objectives', {
        id,
        objective,
        updatedBy
      });
      dispatch(slice.actions.updateCourseObjectiveSuccess(response.data.objective));
      dispatch(openSnackbar({
        open: true,
        message: 'Course objective updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to update course objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function deleteCourseObjective(id) {
  return async () => {
    try {
      await axios.delete(`/api/courses/course-objectives?id=${id}`);
      dispatch(slice.actions.deleteCourseObjectiveSuccess(id));
      dispatch(openSnackbar({
        open: true,
        message: 'Course objective deleted successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to delete course objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

// ==============================|| MODULE OBJECTIVES ||============================== //

export function getModuleObjectives(moduleId) {
  return async () => {
    try {
      const response = await axios.get(`/api/courses/module-objectives?moduleId=${moduleId}`);
      dispatch(slice.actions.getModuleObjectivesSuccess({ 
        moduleId, 
        objectives: response.data.objectives 
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to fetch module objectives'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function addModuleObjective(moduleId, objective, createdBy) {
  return async () => {
    try {
      const response = await axios.post('/api/courses/module-objectives', {
        moduleId,
        objective,
        createdBy
      });
      dispatch(slice.actions.addModuleObjectiveSuccess({ 
        moduleId, 
        objective: response.data.objective 
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'Module objective added successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to add module objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function updateModuleObjective(moduleId, id, objective, updatedBy) {
  return async () => {
    try {
      const response = await axios.put('/api/courses/module-objectives', {
        id,
        objective,
        updatedBy
      });
      dispatch(slice.actions.updateModuleObjectiveSuccess({ 
        moduleId, 
        objective: response.data.objective 
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'Module objective updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to update module objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function deleteModuleObjective(moduleId, id) {
  return async () => {
    try {
      await axios.delete(`/api/courses/module-objectives?id=${id}`);
      dispatch(slice.actions.deleteModuleObjectiveSuccess({ 
        moduleId, 
        objectiveId: id 
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'Module objective deleted successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to delete module objective'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

// Training Plan Actions
export function fetchTrainingPlans(curriculumId, projectId = null) {
  return async () => {
    try {
      dispatch(slice.actions.setTrainingPlanLoading(true));
      const params = new URLSearchParams();
      params.append('curriculumId', curriculumId);
      if (projectId) params.append('projectId', projectId);
      
      const response = await axios.get(`/api/training-plans/fetch?${params}`);
      dispatch(slice.actions.fetchTrainingPlansSuccess(response.data.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.setTrainingPlanLoading(false));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to fetch training plans'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function fetchTrainingPlan(id) {
  return async () => {
    try {
      dispatch(slice.actions.setTrainingPlanLoading(true));
      const response = await axios.get(`/api/training-plans/fetch?id=${id}`);
      dispatch(slice.actions.fetchTrainingPlanSuccess(response.data.data));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.setTrainingPlanLoading(false));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to fetch training plan'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}

export function createTrainingPlan(trainingPlanData) {
  return async () => {
    try {
      dispatch(slice.actions.setTrainingPlanLoading(true));
      const response = await axios.post('/api/training-plans/create', trainingPlanData);
      dispatch(slice.actions.createTrainingPlanSuccess(response.data.data));
      dispatch(openSnackbar({
        open: true,
        message: 'Training plan created successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
      return response.data.data;
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.setTrainingPlanLoading(false));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to create training plan'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      throw error;
    }
  };
}

export function updateTrainingPlan(trainingPlanData) {
  return async () => {
    try {
      dispatch(slice.actions.setTrainingPlanLoading(true));
      const response = await axios.put('/api/training-plans/update', trainingPlanData);
      dispatch(slice.actions.updateTrainingPlanSuccess(response.data.data));
      dispatch(openSnackbar({
        open: true,
        message: 'Training plan updated successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
      return response.data.data;
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.setTrainingPlanLoading(false));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to update training plan'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
      throw error;
    }
  };
}

export function deleteTrainingPlan(id) {
  return async () => {
    try {
      dispatch(slice.actions.setTrainingPlanLoading(true));
      await axios.delete(`/api/training-plans/delete?id=${id}`);
      dispatch(slice.actions.deleteTrainingPlanSuccess(id));
      dispatch(openSnackbar({
        open: true,
        message: 'Training plan deleted successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(getErrorMessage(error)));
      dispatch(slice.actions.setTrainingPlanLoading(false));
      dispatch(openSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to delete training plan'),
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };
}
