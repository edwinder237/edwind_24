/**
 * Daily Notes Entity Slice - CQRS Pattern
 *
 * Manages daily training notes including:
 * - Key Highlights
 * - Challenges
 * - Session Notes
 * - Per-project, per-date notes
 *
 * This is a normalized entity store that separates daily notes
 * from event data.
 */

import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';

// ==============================|| ENTITY ADAPTER ||============================== //

/**
 * Daily notes adapter
 * Uses composite key: "projectId-date" for unique identification
 * Normalizes date to YYYY-MM-DD format for consistent lookups
 */
const dailyNotesAdapter = createEntityAdapter({
  selectId: (note) => {
    const dateStr = new Date(note.date).toISOString().split('T')[0];
    return `${note.projectId}-${dateStr}`;
  },
  sortComparer: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
});

// ==============================|| INITIAL STATE ||============================== //

const initialState = dailyNotesAdapter.getInitialState({
  isLoading: false,
  error: null,
  lastUpdated: null
});

// ==============================|| SLICE ||============================== //

const dailyNotesSlice = createSlice({
  name: 'dailyNotes',
  initialState,
  reducers: {
    // ===== CRUD Operations =====

    dailyNoteAdded: dailyNotesAdapter.addOne,

    dailyNotesReceived: (state, action) => {
      dailyNotesAdapter.setAll(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      console.log('[DailyNotesSlice] Notes received:', action.payload.length);
    },

    dailyNoteUpserted: (state, action) => {
      dailyNotesAdapter.upsertOne(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      console.log('[DailyNotesSlice] Note upserted:', action.payload);
    },

    dailyNotesUpserted: (state, action) => {
      dailyNotesAdapter.upsertMany(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      console.log('[DailyNotesSlice] Multiple notes upserted:', action.payload.length);
    },

    dailyNoteUpdated: (state, action) => {
      const { id, changes } = action.payload;
      dailyNotesAdapter.updateOne(state, { id, changes });
      state.lastUpdated = new Date().toISOString();
      console.log('[DailyNotesSlice] Note updated:', { id, changes });
    },

    dailyNoteRemoved: (state, action) => {
      dailyNotesAdapter.removeOne(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      console.log('[DailyNotesSlice] Note removed:', action.payload);
    },

    // ===== Partial Updates (for inline editing) =====

    keyHighlightAdded: (state, action) => {
      const { projectId, date, highlight } = action.payload;
      const id = `${projectId}-${date}`;
      const note = state.entities[id];

      if (note) {
        note.keyHighlights = [...note.keyHighlights, highlight];
        note.updatedAt = new Date().toISOString();
        console.log('[DailyNotesSlice] Key highlight added:', { id, highlight });
      }
    },

    keyHighlightRemoved: (state, action) => {
      const { projectId, date, index } = action.payload;
      const id = `${projectId}-${date}`;
      const note = state.entities[id];

      if (note && note.keyHighlights[index] !== undefined) {
        note.keyHighlights = note.keyHighlights.filter((_, i) => i !== index);
        note.updatedAt = new Date().toISOString();
        console.log('[DailyNotesSlice] Key highlight removed:', { id, index });
      }
    },

    challengeAdded: (state, action) => {
      const { projectId, date, challenge } = action.payload;
      const id = `${projectId}-${date}`;
      const note = state.entities[id];

      if (note) {
        note.challenges = [...note.challenges, challenge];
        note.updatedAt = new Date().toISOString();
        console.log('[DailyNotesSlice] Challenge added:', { id, challenge });
      }
    },

    challengeRemoved: (state, action) => {
      const { projectId, date, index } = action.payload;
      const id = `${projectId}-${date}`;
      const note = state.entities[id];

      if (note && note.challenges[index] !== undefined) {
        note.challenges = note.challenges.filter((_, i) => i !== index);
        note.updatedAt = new Date().toISOString();
        console.log('[DailyNotesSlice] Challenge removed:', { id, index });
      }
    },

    sessionNotesUpdated: (state, action) => {
      const { projectId, date, sessionNotes } = action.payload;
      const id = `${projectId}-${date}`;
      const note = state.entities[id];

      if (note) {
        note.sessionNotes = sessionNotes;
        note.updatedAt = new Date().toISOString();
        console.log('[DailyNotesSlice] Session notes updated:', { id });
      }
    },

    // ===== Loading State =====

    loadingStarted: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    loadingCompleted: (state) => {
      state.isLoading = false;
    },

    errorOccurred: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      console.error('[DailyNotesSlice] Error:', action.payload);
    }
  },

  // Handle RTK Query results
  extraReducers: (builder) => {
    builder
      .addMatcher(
        projectApi.endpoints.getDailyTrainingNotes?.matchFulfilled,
        (state, action) => {
          if (Array.isArray(action.payload)) {
            dailyNotesAdapter.setAll(state, action.payload);
          } else if (action.payload) {
            dailyNotesAdapter.upsertOne(state, action.payload);
          }
          state.lastUpdated = new Date().toISOString();
          console.log('[DailyNotesSlice] RTK Query fulfilled - notes loaded');
        }
      )
      .addMatcher(
        projectApi.endpoints.updateDailyTrainingNotes?.matchFulfilled,
        (state, action) => {
          if (action.payload) {
            dailyNotesAdapter.upsertOne(state, action.payload);
            state.lastUpdated = new Date().toISOString();
            console.log('[DailyNotesSlice] RTK Query fulfilled - note updated');
          }
        }
      );
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  dailyNoteAdded,
  dailyNotesReceived,
  dailyNoteUpserted,
  dailyNotesUpserted,
  dailyNoteUpdated,
  dailyNoteRemoved,
  keyHighlightAdded,
  keyHighlightRemoved,
  challengeAdded,
  challengeRemoved,
  sessionNotesUpdated,
  loadingStarted,
  loadingCompleted,
  errorOccurred
} = dailyNotesSlice.actions;

// ==============================|| SELECTORS ||============================== //

// Get base selectors from adapter
export const {
  selectAll: selectAllDailyNotes,
  selectById: selectDailyNoteById,
  selectIds: selectDailyNoteIds,
  selectEntities: selectDailyNoteEntities,
  selectTotal: selectTotalDailyNotes
} = dailyNotesAdapter.getSelectors((state) => state.dailyNotes);

// Custom selectors

/**
 * Select daily notes for a specific project
 */
export const selectDailyNotesByProject = createSelector(
  [selectAllDailyNotes, (state, projectId) => projectId],
  (dailyNotes, projectId) => {
    return dailyNotes.filter(note => note.projectId === parseInt(projectId));
  }
);

/**
 * Select a specific daily note by project ID and date
 */
export const selectDailyNoteByDate = createSelector(
  [selectDailyNoteEntities, (state, projectId, date) => ({ projectId, date })],
  (entities, { projectId, date }) => {
    const id = `${projectId}-${date}`;
    return entities[id] || null;
  }
);

/**
 * Select loading state
 */
export const selectDailyNotesLoading = (state) => state.dailyNotes.isLoading;

/**
 * Select error state
 */
export const selectDailyNotesError = (state) => state.dailyNotes.error;

/**
 * Select last updated timestamp
 */
export const selectDailyNotesLastUpdated = (state) => state.dailyNotes.lastUpdated;

// ==============================|| REDUCER ||============================== //

export default dailyNotesSlice.reducer;
