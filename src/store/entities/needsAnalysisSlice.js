import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';

const needsAnalysisAdapter = createEntityAdapter({
  selectId: (na) => na.projectId,
  sortComparer: (a, b) => a.projectId - b.projectId,
});

const initialState = needsAnalysisAdapter.getInitialState({
  currentProjectId: null,
  isLoading: false,
  error: null,
});

const needsAnalysisSlice = createSlice({
  name: 'needsAnalysis',
  initialState,
  reducers: {
    needsAnalysisReceived: (state, action) => {
      needsAnalysisAdapter.upsertOne(state, action.payload);
      if (action.payload.projectId) {
        state.currentProjectId = action.payload.projectId;
      }
      state.isLoading = false;
      state.error = null;
    },

    needsAnalysisUpdated: (state, action) => {
      const { projectId, ...changes } = action.payload;
      needsAnalysisAdapter.updateOne(state, {
        id: projectId,
        changes
      });
    },

    needsAnalysisCleared: (state, action) => {
      needsAnalysisAdapter.removeOne(state, action.payload);
      if (state.currentProjectId === action.payload) {
        state.currentProjectId = null;
      }
    },

    allNeedsAnalysisCleared: (state) => {
      needsAnalysisAdapter.removeAll(state);
      state.currentProjectId = null;
      state.error = null;
    },

    currentProjectSet: (state, action) => {
      state.currentProjectId = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder.addMatcher(
      projectApi.endpoints.getNeedsAnalysis.matchFulfilled,
      (state, action) => {
        if (action.payload) {
          needsAnalysisAdapter.upsertOne(state, action.payload);
          state.currentProjectId = action.payload.projectId;
        }
        state.isLoading = false;
        state.error = null;
      }
    );

    builder.addMatcher(
      projectApi.endpoints.updateNeedsAnalysis.matchFulfilled,
      (state, action) => {
        const projectId = action.meta.arg.originalArgs.projectId;
        const updates = action.meta.arg.originalArgs;
        needsAnalysisAdapter.updateOne(state, {
          id: parseInt(projectId),
          changes: updates
        });
      }
    );

    builder.addMatcher(
      projectApi.endpoints.getNeedsAnalysis.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      projectApi.endpoints.getNeedsAnalysis.matchRejected,
      (state, action) => {
        state.isLoading = false;
        const errorMessage = action.error?.message || '';
        const isSkipError = errorMessage.includes('condition callback returning false');
        state.error = isSkipError ? null : (errorMessage || 'Failed to load needs analysis');
      }
    );
  }
});

export const {
  needsAnalysisReceived,
  needsAnalysisUpdated,
  needsAnalysisCleared,
  allNeedsAnalysisCleared,
  currentProjectSet
} = needsAnalysisSlice.actions;

export default needsAnalysisSlice.reducer;

// Selectors
const selectors = needsAnalysisAdapter.getSelectors((state) => state.needsAnalysis);

export const selectAllNeedsAnalysis = selectors.selectAll;
export const selectNeedsAnalysisById = selectors.selectById;
export const selectNeedsAnalysisEntities = selectors.selectEntities;

export const selectCurrentNeedsAnalysis = (state) => {
  const currentProjectId = state.needsAnalysis.currentProjectId;
  return currentProjectId ? state.needsAnalysis.entities[currentProjectId] : null;
};

export const selectNeedsAnalysisLoading = (state) => state.needsAnalysis.isLoading;
export const selectNeedsAnalysisError = (state) => state.needsAnalysis.error;
