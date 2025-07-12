// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";

const initialState = {
  error: null,
  response: null,
  courses: [],
  columnsOrder: [],
  comments: [],
  modules: [],
  activities: [],
  profiles: [],
  selectedItem: false,
  userStory: [],
  userStoryOrder: [],
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

    // UPDATE MODULES ORDER
    updateModulesOrderSuccess(state, action) {
      state.modules = action.payload.newModulesOrder;
    },

    // UPDATE ACTIVITIES ORDER
    updateActivitiesOrderSuccess(state, action) {
      console.log(state.modules);
      const index = action.payload.index;
      state.modules[index].activities = action.payload.newActivitiesOrder;
    },

    // UPDATE MODULES CONTENT
    updateModuleContentSuccess(state, action) {
      console.log(action.payload.content);
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
      dispatch(slice.actions.hasError(error));
    }
  };
}

/// In USE //
export function getModules(modules) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/modules", { modules });
      dispatch(slice.actions.getModulesSuccess(response.data.modules));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addModule(modules, module) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/add-module", { modules });

      await dispatch(slice.actions.addModuleSuccess(response.data));
      const serverResponse = await axios.post("/api/courses/db-create-module", {
        module,
      });

      await dispatch(slice.actions.hasResponse(serverResponse.data));
      await console.log(serverResponse.data);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editModule(editedModule, moduleId, modules) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/edit-module", {
        editedModule,
        moduleId,
        modules,
      });
      dispatch(slice.actions.editModuleSuccess(response.data));
      const serverResponse = await axios.post("/api/courses/db-update-module", {
        editedModule,
        moduleId,
      });
      await console.log(serverResponse.data);
      await dispatch(slice.actions.hasResponse(serverResponse.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      console.log(serverResponse.data); // This will now be executed after the response is received
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function updateModulesOrder(newModulesOrder, courseId) {
  return async () => {
    try {
      const response = await axios.post("/api/courses/update-modules-order", {
        newModulesOrder,
      });
      await dispatch(slice.actions.updateModulesOrderSuccess(response.data));
      const serverResponse = await axios.post("/api/courses/saveModulesOrder", {
        newModulesOrder,
        courseId,
      });
      console.log(serverResponse.data);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      console.log(serverResponse.data);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
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
      const response = await axios.post("/api/courses/update-activites-order", {
        newActivitiesOrder,
        moduleIndex,
      });
      await dispatch(slice.actions.updateActivitiesOrderSuccess(response.data));
      const serverResponse = await axios.post(
        "/api/courses/db-update-activities-order",
        {
          newActivitiesOrder,
          moduleId,
        }
      );
      console.log(serverResponse.data);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

/// NOTE USED //

export function getColumnsOrder() {
  return async () => {
    try {
      const response = await axios.get("/api/kanban/columns-order");
      dispatch(
        slice.actions.getColumnsOrderSuccess(response.data.columnsOrder)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getComments() {
  return async () => {
    try {
      const response = await axios.get("/api/kanban/comments");
      dispatch(slice.actions.getCommentsSuccess(response.data.comments));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getProfiles() {
  return async () => {
    try {
      const response = await axios.get("/api/kanban/profiles");
      dispatch(slice.actions.getProfilesSuccess(response.data.profiles));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getUserStory() {
  return async () => {
    try {
      const response = await axios.get("/api/kanban/userstory");
      dispatch(slice.actions.getUserStorySuccess(response.data.userStory));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getUserStoryOrder() {
  return async () => {
    try {
      const response = await axios.get("/api/kanban/userstory-order");
      dispatch(
        slice.actions.getUserStoryOrderSuccess(response.data.userStoryOrder)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
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
      dispatch(slice.actions.hasError(error));
    }
  };
}
