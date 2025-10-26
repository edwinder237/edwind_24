import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';

/**
 * Attendance Entity Slice
 *
 * Normalized entity store for attendance records using Redux Toolkit's EntityAdapter.
 * This provides a single source of truth for all attendance data.
 *
 * Entity Structure:
 * - ID: Composite key of 'eventId-participantId'
 * - Entity: { eventId, participantId, status, updatedAt, details }
 */

// ==============================|| ENTITY ADAPTER ||============================== //

const attendanceAdapter = createEntityAdapter({
  // Composite key: eventId-participantId
  selectId: (attendance) => `${attendance.eventId}-${attendance.participantId}`,
  // Sort by most recently updated first
  sortComparer: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
});

// ==============================|| INITIAL STATE ||============================== //

const initialState = attendanceAdapter.getInitialState({
  // Additional state
  currentEventId: null,
  isLoading: false,
  error: null,
  lastSync: null,
  // Batch operation tracking
  batchOperationInProgress: false,
  pendingBatchUpdates: []
});

// ==============================|| SLICE ||============================== //

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    // Standard CRUD operations
    attendanceRecordAdded: (state, action) => {
      const record = {
        ...action.payload,
        updatedAt: new Date().toISOString()
      };
      attendanceAdapter.addOne(state, record);
      console.log('[AttendanceSlice] Record added:', record);
    },

    attendanceRecordUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const updatedChanges = {
        ...changes,
        updatedAt: new Date().toISOString()
      };
      attendanceAdapter.updateOne(state, { id, changes: updatedChanges });
      console.log('[AttendanceSlice] Record updated:', id, updatedChanges);
    },

    attendanceRecordRemoved: (state, action) => {
      attendanceAdapter.removeOne(state, action.payload);
      console.log('[AttendanceSlice] Record removed:', action.payload);
    },

    // Batch operations
    attendanceBatchUpdated: (state, action) => {
      const updates = action.payload.map(record => ({
        id: `${record.eventId}-${record.participantId}`,
        changes: {
          ...record,
          updatedAt: new Date().toISOString()
        }
      }));
      attendanceAdapter.updateMany(state, updates);
      console.log('[AttendanceSlice] Batch update:', updates.length, 'records');
    },

    // Mark all present for an event
    allMarkedPresent: (state, action) => {
      const { eventId, participantIds } = action.payload;
      const updates = participantIds.map(participantId => ({
        id: `${eventId}-${participantId}`,
        changes: {
          status: 'present',
          updatedAt: new Date().toISOString()
        }
      }));
      attendanceAdapter.updateMany(state, updates);
      console.log('[AttendanceSlice] All marked present for event:', eventId);
    },

    // Clear attendance for an event
    eventAttendanceCleared: (state, action) => {
      const eventId = action.payload;
      const idsToRemove = state.ids.filter(id => id.startsWith(`${eventId}-`));
      attendanceAdapter.removeMany(state, idsToRemove);
      console.log('[AttendanceSlice] Cleared attendance for event:', eventId);
    },

    // State management
    currentEventSet: (state, action) => {
      state.currentEventId = action.payload;
    },

    loadingSet: (state, action) => {
      state.isLoading = action.payload;
    },

    errorSet: (state, action) => {
      state.error = action.payload;
    },

    lastSyncSet: (state, action) => {
      state.lastSync = action.payload;
    },

    // Batch operation state
    batchOperationStarted: (state) => {
      state.batchOperationInProgress = true;
      state.pendingBatchUpdates = [];
    },

    batchOperationCompleted: (state) => {
      state.batchOperationInProgress = false;
      state.pendingBatchUpdates = [];
    },

    batchUpdateQueued: (state, action) => {
      state.pendingBatchUpdates.push(action.payload);
    }
  },

  // Handle RTK Query actions
  extraReducers: (builder) => {
    // Handle successful attendance status update
    builder.addMatcher(
      projectApi.endpoints.updateAttendanceStatus.matchFulfilled,
      (state, action) => {
        const { eventId, participantId, attendance_status } = action.meta.arg.originalArgs;
        const id = `${eventId}-${participantId}`;

        attendanceAdapter.upsertOne(state, {
          eventId,
          participantId,
          status: attendance_status,
          updatedAt: new Date().toISOString(),
          syncedWithServer: true
        });

        console.log('[AttendanceSlice] RTK Query: Status updated', { id, status: attendance_status });
      }
    );

    // Handle participant added to event
    builder.addMatcher(
      projectApi.endpoints.addEventParticipant.matchFulfilled,
      (state, action) => {
        const { eventId, participantId } = action.meta.arg.originalArgs;
        const id = `${eventId}-${participantId}`;

        attendanceAdapter.upsertOne(state, {
          eventId,
          participantId,
          status: 'scheduled',
          updatedAt: new Date().toISOString(),
          syncedWithServer: true
        });

        console.log('[AttendanceSlice] RTK Query: Participant added', { id });
      }
    );

    // Handle participant removed from event
    builder.addMatcher(
      projectApi.endpoints.removeEventParticipant.matchFulfilled,
      (state, action) => {
        const { eventId, participantId } = action.meta.arg.originalArgs;
        const id = `${eventId}-${participantId}`;

        attendanceAdapter.removeOne(state, id);

        console.log('[AttendanceSlice] RTK Query: Participant removed', { id });
      }
    );
  }
});

// ==============================|| ACTIONS ||============================== //

export const {
  attendanceRecordAdded,
  attendanceRecordUpdated,
  attendanceRecordRemoved,
  attendanceBatchUpdated,
  allMarkedPresent,
  eventAttendanceCleared,
  currentEventSet,
  loadingSet,
  errorSet,
  lastSyncSet,
  batchOperationStarted,
  batchOperationCompleted,
  batchUpdateQueued
} = attendanceSlice.actions;

// ==============================|| REDUCER ||============================== //

export default attendanceSlice.reducer;

// ==============================|| SELECTORS ||============================== //

// Get the selectors from the adapter
const selectors = attendanceAdapter.getSelectors((state) => state.attendance);

// Basic selectors
export const selectAllAttendanceRecords = selectors.selectAll;
export const selectAttendanceById = selectors.selectById;
export const selectAttendanceEntities = selectors.selectEntities;
export const selectAttendanceTotal = selectors.selectTotal;

// Custom selectors

// Select attendance for a specific event (memoized)
export const selectEventAttendance = createSelector(
  [selectAllAttendanceRecords, (state, eventId) => eventId],
  (records, eventId) => {
    if (!eventId) return [];
    return records.filter(record => record.eventId === eventId);
  }
);

// Select attendance status for a specific participant in an event (memoized)
export const selectParticipantAttendanceStatus = createSelector(
  [selectAttendanceEntities, (state, eventId, participantId) => `${eventId}-${participantId}`],
  (entities, id) => {
    return entities[id]?.status || 'scheduled';
  }
);

// Get attendance statistics for an event (memoized)
export const selectEventAttendanceStats = createSelector(
  [selectEventAttendance],
  (attendanceRecords) => {
    const stats = {
      total: attendanceRecords.length,
      present: 0,
      absent: 0,
      late: 0,
      scheduled: 0,
      excused: 0
    };

    attendanceRecords.forEach(record => {
      const status = record.status || 'scheduled';
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    stats.attendanceRate = stats.total > 0
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;

    return stats;
  }
);

// Get participants by attendance status (memoized)
export const selectParticipantsByStatus = createSelector(
  [selectEventAttendance, (state, eventId, status) => status],
  (attendanceRecords, status) => {
    return attendanceRecords
      .filter(record => record.status === status)
      .map(record => record.participantId);
  }
);

// Check if batch operation is in progress
export const selectBatchOperationInProgress = (state) => state.attendance.batchOperationInProgress;

// Get pending batch updates
export const selectPendingBatchUpdates = (state) => state.attendance.pendingBatchUpdates;

// Get loading state
export const selectAttendanceLoading = (state) => state.attendance.isLoading;

// Get error state
export const selectAttendanceError = (state) => state.attendance.error;

// Get last sync time
export const selectLastSyncTime = (state) => state.attendance.lastSync;