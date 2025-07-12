// third-party
import { createSlice } from '@reduxjs/toolkit';

// project imports
import axios from 'utils/axios';
import { dispatch } from '../index';

const dataRoutes = {
  // projects

  addGroup: '/api/kanban/add-group',
  getGroups: '/api/kanban/groups',
  ////
  getColumns: '/api/kanban/columns',
  getNestedColumns: '/api/kanban/nested-columns',
  getNestedColumns2: '/api/kanban/nested-columns2',

  getColumnsOrder: '/api/kanban/columns-order',

  getComments: '/api/kanban/comments',
  getProfiles: '/api/kanban/profiles',
  getItems: '/api/kanban/items',
  getUserStory: '/api/kanban/userstory',
  getUserStoryOrder: '/api/kanban/userstory-order',
  addColumn: '/api/kanban/add-column',
  editColumn: '/api/kanban/edit-column',
  updateColumnOrder: '/api/kanban/update-column-order',
  deleteColumn: '/api/kanban/delete-column',
  addItem: '/api/kanban/add-item',
  editItem: '/api/kanban/edit-item',
  updateColumnItemOrder: '/api/kanban/update-item-order',
  selectItem: '/api/kanban/select-item',
  addItemComment: '/api/kanban/add-item-comment',
  deleteItem: '/api/kanban/delete-item',
  addStory: '/api/kanban/add-story',
  editStory: '/api/kanban/edit-story',
  updateStoryOrder: '/api/kanban/update-story-order',
  updateStoryItemOrder: '/api/kanban/update-storyitem-order',
  addStoryComment: '/api/kanban/add-story-comment',
  deleteStory: '/api/kanban/delete-story',

  // project-manager routes
  getProjects: '/api/kanban/fakeProjects',
  getEvents: '/api/kanban/fakeEvents'
};

const initialState = {
  error: null,
  columns: [],
  columnsOrder: [],
  comments: [],
  items: [],
  profiles: [],
  selectedItem: false,
  userStory: [],
  userStoryOrder: [],
  nestedColumns: [],
  nestedColums2: [],
  modules: [],
  activities: [],

  // project-manager
  projects: [],
  events: [],
  groups: []
};

const slice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    //PROJECTS

    // ADD GROUP
    addGroupSuccess(state, action) {
      state.groups = action.payload.newGroupsArray;
      console.log(state.groups);
    },
    getGroups(state, action) {
      state.groups = action.payload.groups;
    },

    // HAS ERROR
    hasError(state, action) {
      state.error = action.payload;
    },

    // ADD COLUMN
    addColumnSuccess(state, action) {
      state.columns = action.payload.columns;
      state.columnsOrder = action.payload.columnsOrder;
    },

    // EDIT COLUMN
    editColumnSuccess(state, action) {
      state.columns = action.payload.columns;
    },

    // UPDATE COLUMN ORDER
    updateColumnOrderSuccess(state, action) {
      state.columnsOrder = action.payload.columnsOrder;
    },

    // DELETE COLUMN
    deleteColumnSuccess(state, action) {
      state.columns = action.payload.columns;
      state.columnsOrder = action.payload.columnsOrder;
    },

    // ADD ITEM
    addItemSuccess(state, action) {
      state.items = action.payload.items;
      state.columns = action.payload.columns;
      state.userStory = action.payload.userStory;
      //console.log(action)
      state.modules = action.payload.modules;
    },

    // EDIT ITEM
    editItemSuccess(state, action) {
      state.items = action.payload.items;
      state.columns = action.payload.columns;
      state.userStory = action.payload.userStory;
    },

    // UPDATE COLUMN ITEM ORDER
    updateColumnItemOrderSuccess(state, action) {
      //console.log(action.payload)
      //state.columns = action.payload.columns;
      state.nestedColumns = action.payload.columns;
    },

    // SELECT ITEM
    selectItemSuccess(state, action) {
      state.selectedItem = action.payload.selectedItem;
    },

    // ADD ITEM COMMENT
    addItemCommentSuccess(state, action) {
      state.items = action.payload.items;
      state.comments = action.payload.comments;
    },

    // DELETE ITEM
    deleteItemSuccess(state, action) {
      state.items = action.payload.items;
      state.columns = action.payload.columns;
      state.userStory = action.payload.userStory;
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

    // GET COLUMNS
    getColumnsSuccess(state, action) {
      state.columns = action.payload;
    },

    // GET NESTED COLUMN ORDER
    getNestedColumnsSuccess(state, action) {
      state.nestedColumns = action.payload;
    },

    // GET NESTED COLUMN 2 ORDER
    getNestedColumnsSuccess2(state, action) {
      state.nestedColumns2 = action.payload;
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
    // Project-manager stuff///
    // GET ITEMS
    getItemsSuccess(state, action) {
      state.items = action.payload;
    },

    // GET PROJECTS
    getProjectsSuccess(state, action) {
      state.projects = action.payload;
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

    // GET USER STORY
    getUserStorySuccess(state, action) {
      state.userStory = action.payload;
    },

    // GET USER STORY ORDER
    getUserStoryOrderSuccess(state, action) {
      state.userStoryOrder = action.payload;
    }
  }
});

// Reducer
export default slice.reducer;

// projects

export function getGroups(groups) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.getGroups, { groups });
      dispatch(slice.actions.getGroups(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addGroup(newGroup, groups) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addGroup, { newGroup, groups });
      dispatch(slice.actions.addGroupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// ----------------------------------------------------------------------

export function getColumns() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getColumns);
      dispatch(slice.actions.getColumnsSuccess(response.data.columns));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getNestedColumns(courseIndex) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.getNestedColumns, { courseIndex });
      // console.log(response.data.columns)
      dispatch(slice.actions.getNestedColumnsSuccess(response.data.columns));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getNestedColumns2(courseIndex) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.getNestedColumns2, { courseIndex });
      // console.log(response.data.columns)
      dispatch(slice.actions.getNestedColumnsSuccess2(response.data.columns));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getColumnsOrder() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getColumnsOrder);
      dispatch(slice.actions.getColumnsOrderSuccess(response.data.columnsOrder));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getComments() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getComments);
      dispatch(slice.actions.getCommentsSuccess(response.data.comments));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getProfiles() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getProfiles);
      dispatch(slice.actions.getProfilesSuccess(response.data.profiles));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getDndItems(query, stateKey, stateIndex, storedState) {
  return async () => {
    try {
      const response = await axios.get(query);
      dispatch(slice.actions.getModulesSuccess(response.data[stateKey][stateIndex][storedState]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getItems(state, i, child) {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getItems);
      dispatch(slice.actions.getItemsSuccess(response.data.items));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
// project-manager
//export function getProjects(state, i, child) {
// return async () => {
//  try {
//   const response = await axios.get(dataRoutes.getProjects);
//console.log(response.data);
//   dispatch(slice.actions.getProjectsSuccess(response.data.projects))
// } catch (error) {
//   dispatch(slice.actions.hasError(error));
// }
//};
//}

export function getEvents(state, i, child) {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getEvents);
      //console.log(response.data);
      dispatch(slice.actions.getEventsSuccess(response.data.events));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getUserStory() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getUserStory);
      dispatch(slice.actions.getUserStorySuccess(response.data.userStory));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getUserStoryOrder() {
  return async () => {
    try {
      const response = await axios.get(dataRoutes.getUserStoryOrder);
      dispatch(slice.actions.getUserStoryOrderSuccess(response.data.userStoryOrder));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addColumn(column, columns, columnsOrder) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addColumn, { column, columns, columnsOrder });
      dispatch(slice.actions.addColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editColumn(column, columns) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.editColumn, { column, columns });
      dispatch(slice.actions.editColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateColumnOrder(columnsOrder) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateColumnOrder, { columnsOrder });
      dispatch(slice.actions.updateColumnOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteColumn(columnId, columnsOrder, columns) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.deleteColumn, { columnId, columnsOrder, columns });
      dispatch(slice.actions.deleteColumnSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addItem(columnId, columns, item, items, storyId, userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addItem, { columnId, columns, item, items, storyId, userStory });
      dispatch(slice.actions.addItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editItem(columnId, columns, item, items, storyId, userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.editItem, { items, item, userStory, storyId, columns, columnId });
      dispatch(slice.actions.editItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateColumnItemOrder(columns) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateColumnItemOrder, { columns });
      dispatch(slice.actions.updateColumnItemOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function selectItem(selectedItem) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.selectItem, { selectedItem });
      dispatch(slice.actions.selectItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addItemComment(itemId, comment, items, comments) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addItemComment, { items, itemId, comment, comments });
      dispatch(slice.actions.addItemCommentSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteItem(itemId, items, columns, userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.deleteItem, { columns, itemId, userStory, items });
      dispatch(slice.actions.deleteItemSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addStory(story, userStory, userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addStory, { userStory, story, userStoryOrder });
      dispatch(slice.actions.addStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editStory(story, userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.editStory, { userStory, story });
      dispatch(slice.actions.editStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateStoryOrder(userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateStoryOrder, { userStoryOrder });
      dispatch(slice.actions.updateStoryOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateStoryItemOrder(userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.updateStoryItemOrder, { userStory });
      dispatch(slice.actions.updateStoryItemOrderSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addStoryComment(storyId, comment, comments, userStory) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.addStoryComment, { userStory, storyId, comment, comments });
      dispatch(slice.actions.addStoryCommentSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteStory(storyId, userStory, userStoryOrder) {
  return async () => {
    try {
      const response = await axios.post(dataRoutes.deleteStory, { userStory, storyId, userStoryOrder });
      dispatch(slice.actions.deleteStorySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
