/**
 * Participants Entity Slice
 * 
 * Normalized state management for participants using Redux Toolkit's EntityAdapter.
 * Provides efficient CRUD operations and automatic normalization.
 */

import { createSlice, createEntityAdapter, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'utils/axios';

// ==============================|| ENTITY ADAPTER ||============================== //

/**
 * Create entity adapter with custom ID selector and sort comparator
 */
const participantsAdapter = createEntityAdapter({
  // Each participant has a unique ID (project_participants.id)
  selectId: (participant) => participant.id,
  // Sort by nested participant's last name, then first name
  sortComparer: (a, b) => {
    // Handle nested participant structure
    const aLastName = a.participant?.lastName || '';
    const bLastName = b.participant?.lastName || '';
    const lastNameCompare = aLastName.localeCompare(bLastName);
    if (lastNameCompare !== 0) return lastNameCompare;

    const aFirstName = a.participant?.firstName || '';
    const bFirstName = b.participant?.firstName || '';
    return aFirstName.localeCompare(bFirstName);
  }
});

// ==============================|| ASYNC THUNKS ||============================== //

/**
 * Fetch all participants for a project
 */
export const fetchParticipants = createAsyncThunk(
  'participants/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/projects/fetchParticipants?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch participants');
    }
  }
);

/**
 * Add a new participant
 */
export const addParticipant = createAsyncThunk(
  'participants/add',
  async (participantData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/projects/addParticipant', participantData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add participant');
    }
  }
);

/**
 * Update an existing participant
 */
export const updateParticipant = createAsyncThunk(
  'participants/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/projects/updateParticipant`, { id, ...changes });
      return { id, changes: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update participant');
    }
  }
);

/**
 * Remove a participant
 */
export const removeParticipant = createAsyncThunk(
  'participants/remove',
  async (participantId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/projects/removeParticipant?participantId=${participantId}`);
      return participantId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove participant');
    }
  }
);

/**
 * Batch update participants
 */
export const batchUpdateParticipants = createAsyncThunk(
  'participants/batchUpdate',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/projects/batchUpdateParticipants', { updates });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to batch update participants');
    }
  }
);

// ==============================|| SLICE ||============================== //

const initialState = participantsAdapter.getInitialState({
  // Additional state beyond entities
  loading: false,
  error: null,
  selectedParticipantId: null,
  filters: {
    role: null,
    group: null,
    status: null,
    search: ''
  },
  metadata: {
    lastFetch: null,
    totalCount: 0,
    projectId: null
  }
});

const participantsSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    // Standard CRUD operations
    participantAdded: participantsAdapter.addOne,
    participantUpdated: participantsAdapter.updateOne,
    participantRemoved: participantsAdapter.removeOne,
    participantsReceived: participantsAdapter.setAll,
    participantsManyAdded: participantsAdapter.addMany,
    participantsManyUpdated: participantsAdapter.updateMany,
    participantsManyRemoved: participantsAdapter.removeMany,
    participantsUpserted: participantsAdapter.upsertMany,
    participantUpserted: participantsAdapter.upsertOne,
    
    // Custom reducers
    selectParticipant: (state, action) => {
      state.selectedParticipantId = action.payload;
    },
    
    setFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    updateMetadata: (state, action) => {
      state.metadata = { ...state.metadata, ...action.payload };
    },
    
    // Optimistic updates
    optimisticUpdate: (state, action) => {
      const { id, changes } = action.payload;
      participantsAdapter.updateOne(state, { id, changes });
    },
    
    // Batch operations
    mergeParticipants: (state, action) => {
      participantsAdapter.upsertMany(state, action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch participants
      .addCase(fetchParticipants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.loading = false;
        participantsAdapter.setAll(state, action.payload);
        state.metadata.lastFetch = new Date().toISOString();
        state.metadata.totalCount = action.payload.length;
      })
      .addCase(fetchParticipants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add participant
      .addCase(addParticipant.fulfilled, (state, action) => {
        participantsAdapter.addOne(state, action.payload);
        state.metadata.totalCount += 1;
      })
      
      // Update participant
      .addCase(updateParticipant.fulfilled, (state, action) => {
        participantsAdapter.updateOne(state, action.payload);
      })
      
      // Remove participant
      .addCase(removeParticipant.fulfilled, (state, action) => {
        participantsAdapter.removeOne(state, action.payload);
        state.metadata.totalCount -= 1;
      })
      
      // Batch update
      .addCase(batchUpdateParticipants.fulfilled, (state, action) => {
        participantsAdapter.updateMany(state, action.payload);
      });
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  participantAdded,
  participantUpdated,
  participantRemoved,
  participantsReceived,
  participantsManyAdded,
  participantsManyUpdated,
  participantsManyRemoved,
  participantsUpserted,
  participantUpserted,
  selectParticipant,
  setFilter,
  clearFilters,
  updateMetadata,
  optimisticUpdate,
  mergeParticipants
} = participantsSlice.actions;

// ==============================|| SELECTORS ||============================== //

// Get the base selectors from adapter
export const {
  selectById: selectParticipantById,
  selectIds: selectParticipantIds,
  selectEntities: selectParticipantEntities,
  selectAll: selectAllParticipants,
  selectTotal: selectTotalParticipants
} = participantsAdapter.getSelectors(state => state.participants);

// Custom selectors
export const selectParticipantsLoading = state => state.participants.loading;
export const selectParticipantsError = state => state.participants.error;
export const selectSelectedParticipantId = state => state.participants.selectedParticipantId;
export const selectParticipantFilters = state => state.participants.filters;
export const selectParticipantsMetadata = state => state.participants.metadata;

// Memoized selector for selected participant
export const selectSelectedParticipant = createSelector(
  [state => state.participants.entities, selectSelectedParticipantId],
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Memoized selector for filtered participants
export const selectFilteredParticipants = createSelector(
  [selectAllParticipants, selectParticipantFilters],
  (participants, filters) => {
    let filtered = participants;
    
    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(p => p.roleId === filters.role);
    }
    
    // Apply group filter
    if (filters.group) {
      filtered = filtered.filter(p => p.groupId === filters.group);
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.firstName?.toLowerCase().includes(searchLower) ||
        p.lastName?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }
);

// Selector for participants by group
export const selectParticipantsByGroup = createSelector(
  [selectAllParticipants],
  (participants) => {
    const byGroup = {};
    participants.forEach(participant => {
      const groupId = participant.groupId || 'ungrouped';
      if (!byGroup[groupId]) {
        byGroup[groupId] = [];
      }
      byGroup[groupId].push(participant);
    });
    return byGroup;
  }
);

// Selector for participants by role
export const selectParticipantsByRole = createSelector(
  [selectAllParticipants],
  (participants) => {
    const byRole = {};
    participants.forEach(participant => {
      const roleId = participant.roleId || 'unassigned';
      if (!byRole[roleId]) {
        byRole[roleId] = [];
      }
      byRole[roleId].push(participant);
    });
    return byRole;
  }
);

// Selector for participant statistics
export const selectParticipantStatistics = createSelector(
  [selectAllParticipants],
  (participants) => {
    return {
      total: participants.length,
      byStatus: participants.reduce((acc, p) => {
        acc[p.status || 'active'] = (acc[p.status || 'active'] || 0) + 1;
        return acc;
      }, {}),
      byRole: participants.reduce((acc, p) => {
        const role = p.role?.title || 'Unassigned';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}),
      byGroup: participants.reduce((acc, p) => {
        const group = p.group?.name || 'Ungrouped';
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {})
    };
  }
);

// ==============================|| REDUCER ||============================== //

export default participantsSlice.reducer;