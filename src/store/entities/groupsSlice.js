/**
 * Groups Entity Slice
 * 
 * Normalized state management for training groups using Redux Toolkit's EntityAdapter.
 * Handles group operations, membership, and curriculum assignments.
 */

import { createSlice, createEntityAdapter, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'utils/axios';

// ==============================|| ENTITY ADAPTER ||============================== //

const groupsAdapter = createEntityAdapter({
  selectId: (group) => group.id,
  sortComparer: (a, b) => (a.groupName || '').localeCompare(b.groupName || '')
});

// ==============================|| ASYNC THUNKS ||============================== //

export const fetchGroups = createAsyncThunk(
  'groups/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/projects/fetchGroupsDetails?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch groups');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/create',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/projects/add-group', groupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create group');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/projects/update-group', { id, ...changes });
      return { id, changes: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/delete',
  async (groupId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/projects/remove-group?groupId=${groupId}`);
      return groupId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete group');
    }
  }
);

export const moveParticipantToGroup = createAsyncThunk(
  'groups/moveParticipant',
  async ({ participantId, fromGroupId, toGroupId }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/projects/move-participant-between-groups', {
        participantId,
        fromGroupId,
        toGroupId
      });
      return { participantId, fromGroupId, toGroupId, result: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to move participant');
    }
  }
);

export const assignCurriculumToGroup = createAsyncThunk(
  'groups/assignCurriculum',
  async ({ groupId, curriculumId }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/groups/assign-curriculum', {
        groupId,
        curriculumId
      });
      return { groupId, curriculum: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to assign curriculum');
    }
  }
);

// ==============================|| SLICE ||============================== //

const initialState = groupsAdapter.getInitialState({
  loading: false,
  error: null,
  selectedGroupId: null,
  filters: {
    curriculum: null,
    status: null,
    search: ''
  },
  metadata: {
    lastFetch: null,
    totalCount: 0,
    projectId: null
  }
});

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // Standard CRUD operations
    groupAdded: groupsAdapter.addOne,
    groupUpdated: groupsAdapter.updateOne,
    groupRemoved: groupsAdapter.removeOne,
    groupsReceived: groupsAdapter.setAll,
    groupsManyAdded: groupsAdapter.addMany,
    groupsUpserted: groupsAdapter.upsertMany,
    
    // Custom reducers
    selectGroup: (state, action) => {
      state.selectedGroupId = action.payload;
    },
    
    setGroupFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
    },
    
    clearGroupFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Participant management
    addParticipantToGroup: (state, action) => {
      const { groupId, participant } = action.payload;
      const group = state.entities[groupId];
      if (group) {
        if (!group.participants) {
          group.participants = [];
        }
        group.participants.push(participant);
      }
    },
    
    removeParticipantFromGroup: (state, action) => {
      const { groupId, participantId } = action.payload;
      const group = state.entities[groupId];
      if (group && group.participants) {
        group.participants = group.participants.filter(p => p.id !== participantId);
      }
    },
    
    // Curriculum management
    addCurriculumToGroup: (state, action) => {
      const { groupId, curriculum } = action.payload;
      const group = state.entities[groupId];
      if (group) {
        if (!group.curriculums) {
          group.curriculums = [];
        }
        group.curriculums.push(curriculum);
      }
    },
    
    removeCurriculumFromGroup: (state, action) => {
      const { groupId, curriculumId } = action.payload;
      const group = state.entities[groupId];
      if (group && group.curriculums) {
        group.curriculums = group.curriculums.filter(c => c.id !== curriculumId);
      }
    },
    
    // Progress tracking
    updateGroupProgress: (state, action) => {
      const { groupId, progress } = action.payload;
      const group = state.entities[groupId];
      if (group) {
        group.progress = { ...group.progress, ...progress };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        groupsAdapter.setAll(state, action.payload);
        state.metadata.lastFetch = new Date().toISOString();
        state.metadata.totalCount = action.payload.length;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create group
      .addCase(createGroup.fulfilled, (state, action) => {
        groupsAdapter.addOne(state, action.payload);
        state.metadata.totalCount += 1;
      })
      
      // Update group
      .addCase(updateGroup.fulfilled, (state, action) => {
        groupsAdapter.updateOne(state, action.payload);
      })
      
      // Delete group
      .addCase(deleteGroup.fulfilled, (state, action) => {
        groupsAdapter.removeOne(state, action.payload);
        state.metadata.totalCount -= 1;
      })
      
      // Move participant
      .addCase(moveParticipantToGroup.fulfilled, (state, action) => {
        const { participantId, fromGroupId, toGroupId } = action.payload;
        
        // Remove from old group
        if (fromGroupId) {
          const fromGroup = state.entities[fromGroupId];
          if (fromGroup && fromGroup.participants) {
            fromGroup.participants = fromGroup.participants.filter(p => p.id !== participantId);
          }
        }
        
        // Add to new group
        if (toGroupId) {
          const toGroup = state.entities[toGroupId];
          if (toGroup && action.payload.result.participant) {
            if (!toGroup.participants) {
              toGroup.participants = [];
            }
            toGroup.participants.push(action.payload.result.participant);
          }
        }
      })
      
      // Assign curriculum
      .addCase(assignCurriculumToGroup.fulfilled, (state, action) => {
        const { groupId, curriculum } = action.payload;
        const group = state.entities[groupId];
        if (group) {
          if (!group.curriculums) {
            group.curriculums = [];
          }
          group.curriculums.push(curriculum);
        }
      });
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  groupAdded,
  groupUpdated,
  groupRemoved,
  groupsReceived,
  groupsManyAdded,
  groupsUpserted,
  selectGroup,
  setGroupFilter,
  clearGroupFilters,
  addParticipantToGroup,
  removeParticipantFromGroup,
  addCurriculumToGroup,
  removeCurriculumFromGroup,
  updateGroupProgress
} = groupsSlice.actions;

// ==============================|| SELECTORS ||============================== //

// Base selectors
export const {
  selectById: selectGroupById,
  selectIds: selectGroupIds,
  selectEntities: selectGroupEntities,
  selectAll: selectAllGroups,
  selectTotal: selectTotalGroups
} = groupsAdapter.getSelectors(state => state.groups);

// Custom selectors
export const selectGroupsLoading = state => state.groups.loading;
export const selectGroupsError = state => state.groups.error;
export const selectSelectedGroupId = state => state.groups.selectedGroupId;
export const selectGroupFilters = state => state.groups.filters;
export const selectGroupsMetadata = state => state.groups.metadata;

// Selected group with full details
export const selectSelectedGroup = createSelector(
  [selectGroupEntities, selectSelectedGroupId],
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Filtered groups
export const selectFilteredGroups = createSelector(
  [selectAllGroups, selectGroupFilters],
  (groups, filters) => {
    let filtered = groups;
    
    // Apply curriculum filter
    if (filters.curriculum) {
      filtered = filtered.filter(g => 
        g.curriculums?.some(c => c.id === filters.curriculum)
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(g => g.status === filters.status);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(g => 
        g.groupName?.toLowerCase().includes(searchLower) ||
        g.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }
);

// Groups with participant counts
export const selectGroupsWithCounts = createSelector(
  [selectAllGroups],
  (groups) => {
    return groups.map(group => ({
      ...group,
      participantCount: group.participants?.length || 0,
      curriculumCount: group.curriculums?.length || 0
    }));
  }
);

// Groups by curriculum
export const selectGroupsByCurriculum = createSelector(
  [selectAllGroups],
  (groups) => {
    const byCurriculum = {};
    groups.forEach(group => {
      if (group.curriculums) {
        group.curriculums.forEach(curriculum => {
          if (!byCurriculum[curriculum.id]) {
            byCurriculum[curriculum.id] = {
              curriculum,
              groups: []
            };
          }
          byCurriculum[curriculum.id].groups.push(group);
        });
      } else {
        // Groups without curriculum
        if (!byCurriculum['unassigned']) {
          byCurriculum['unassigned'] = {
            curriculum: { id: 'unassigned', name: 'Unassigned' },
            groups: []
          };
        }
        byCurriculum['unassigned'].groups.push(group);
      }
    });
    return byCurriculum;
  }
);

// Group statistics
export const selectGroupStatistics = createSelector(
  [selectAllGroups],
  (groups) => {
    const stats = {
      totalGroups: groups.length,
      totalParticipants: 0,
      averageGroupSize: 0,
      groupsByCurriculum: {},
      groupsByStatus: {}
    };
    
    groups.forEach(group => {
      // Count participants
      const participantCount = group.participants?.length || 0;
      stats.totalParticipants += participantCount;
      
      // Group by status
      const status = group.status || 'active';
      stats.groupsByStatus[status] = (stats.groupsByStatus[status] || 0) + 1;
      
      // Group by curriculum
      if (group.curriculums?.length > 0) {
        group.curriculums.forEach(curriculum => {
          const curriculumName = curriculum.name || 'Unknown';
          if (!stats.groupsByCurriculum[curriculumName]) {
            stats.groupsByCurriculum[curriculumName] = {
              groupCount: 0,
              participantCount: 0
            };
          }
          stats.groupsByCurriculum[curriculumName].groupCount += 1;
          stats.groupsByCurriculum[curriculumName].participantCount += participantCount;
        });
      } else {
        if (!stats.groupsByCurriculum['Unassigned']) {
          stats.groupsByCurriculum['Unassigned'] = {
            groupCount: 0,
            participantCount: 0
          };
        }
        stats.groupsByCurriculum['Unassigned'].groupCount += 1;
        stats.groupsByCurriculum['Unassigned'].participantCount += participantCount;
      }
    });
    
    // Calculate average group size
    stats.averageGroupSize = stats.totalGroups > 0 
      ? stats.totalParticipants / stats.totalGroups 
      : 0;
    
    return stats;
  }
);

// Available groups for participant assignment
export const selectAvailableGroupsForParticipant = createSelector(
  [selectAllGroups, (state, participantId) => participantId],
  (groups, participantId) => {
    return groups.filter(group => 
      !group.participants?.some(p => p.id === participantId)
    );
  }
);

// ==============================|| REDUCER ||============================== //

export default groupsSlice.reducer;