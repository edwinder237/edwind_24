/**
 * Daily Notes Semantic Commands
 *
 * This module contains semantic commands for daily training notes management.
 * Commands represent user intentions and business operations.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { openSnackbar } from '../reducers/snackbar';
import {
  dailyNoteUpserted,
  keyHighlightAdded as keyHighlightAddedToStore,
  keyHighlightRemoved as keyHighlightRemovedFromStore,
  challengeAdded as challengeAddedToStore,
  challengeRemoved as challengeRemovedFromStore,
  loadingStarted,
  loadingCompleted,
  errorOccurred
} from '../entities/dailyNotesSlice';

// ==============================|| DAILY NOTES COMMANDS ||============================== //

/**
 * Update or create daily training notes
 * Business Intent: User wants to save daily training notes
 */
export const updateDailyNotes = createAsyncThunk(
  'dailyNotes/updateDailyNotes',
  async ({ projectId, date, keyHighlights, challenges, sessionNotes, author, authorRole }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loadingStarted());

      const command = {
        type: 'UPDATE_DAILY_NOTES',
        projectId,
        date,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating daily notes:', command);

      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights,
        challenges,
        sessionNotes,
        author,
        authorRole
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));
      dispatch(loadingCompleted());

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Daily notes saved successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Daily notes updated successfully:', response.data);
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to update daily notes:', error);

      dispatch(errorOccurred(error.message));
      dispatch(loadingCompleted());

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save daily notes',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to update daily notes');
    }
  }
);

/**
 * Add a key highlight to a specific day
 * Business Intent: User wants to add a new key highlight
 */
export const addKeyHighlight = createAsyncThunk(
  'dailyNotes/addKeyHighlight',
  async ({ projectId, date, highlight }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_KEY_HIGHLIGHT',
        projectId,
        date,
        highlight,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Adding key highlight:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      const existingHighlights = currentNote?.keyHighlights || [];

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: [...existingHighlights, highlight],
        challenges: currentNote?.challenges || [],
        sessionNotes: currentNote?.sessionNotes || null,
        author: currentNote?.author || null,
        authorRole: currentNote?.authorRole || null
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Key highlight added successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Key highlight added successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to add key highlight:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to add key highlight',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Remove a key highlight from a specific day
 * Business Intent: User wants to remove a key highlight
 */
export const removeKeyHighlight = createAsyncThunk(
  'dailyNotes/removeKeyHighlight',
  async ({ projectId, date, index }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_KEY_HIGHLIGHT',
        projectId,
        date,
        index,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Removing key highlight:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      if (!currentNote) {
        throw new Error('Daily note not found');
      }

      const updatedHighlights = currentNote.keyHighlights.filter((_, i) => i !== index);

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: updatedHighlights,
        challenges: currentNote.challenges,
        sessionNotes: currentNote.sessionNotes,
        author: currentNote.author,
        authorRole: currentNote.authorRole
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Key highlight removed successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Key highlight removed successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to remove key highlight:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to remove key highlight',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Add a challenge to a specific day
 * Business Intent: User wants to add a new challenge
 */
export const addChallenge = createAsyncThunk(
  'dailyNotes/addChallenge',
  async ({ projectId, date, challenge }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_CHALLENGE',
        projectId,
        date,
        challenge,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Adding challenge:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      const existingChallenges = currentNote?.challenges || [];

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: currentNote?.keyHighlights || [],
        challenges: [...existingChallenges, challenge],
        sessionNotes: currentNote?.sessionNotes || null,
        author: currentNote?.author || null,
        authorRole: currentNote?.authorRole || null
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Challenge added successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Challenge added successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to add challenge:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to add challenge',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Remove a challenge from a specific day
 * Business Intent: User wants to remove a challenge
 */
export const removeChallenge = createAsyncThunk(
  'dailyNotes/removeChallenge',
  async ({ projectId, date, index }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_CHALLENGE',
        projectId,
        date,
        index,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Removing challenge:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      if (!currentNote) {
        throw new Error('Daily note not found');
      }

      const updatedChallenges = currentNote.challenges.filter((_, i) => i !== index);

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: currentNote.keyHighlights,
        challenges: updatedChallenges,
        sessionNotes: currentNote.sessionNotes,
        author: currentNote.author,
        authorRole: currentNote.authorRole
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Challenge removed successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Challenge removed successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to remove challenge:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to remove challenge',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update a key highlight
 * Business Intent: User wants to edit an existing key highlight
 */
export const updateKeyHighlight = createAsyncThunk(
  'dailyNotes/updateKeyHighlight',
  async ({ projectId, date, index, newText }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_KEY_HIGHLIGHT',
        projectId,
        date,
        index,
        newText,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating key highlight:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      if (!currentNote) {
        throw new Error('Daily note not found');
      }

      const updatedHighlights = [...currentNote.keyHighlights];
      updatedHighlights[index] = newText;

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: updatedHighlights,
        challenges: currentNote.challenges,
        sessionNotes: currentNote.sessionNotes,
        author: currentNote.author,
        authorRole: currentNote.authorRole
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Key highlight updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Key highlight updated successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to update key highlight:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update key highlight',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update a challenge
 * Business Intent: User wants to edit an existing challenge
 */
export const updateChallenge = createAsyncThunk(
  'dailyNotes/updateChallenge',
  async ({ projectId, date, index, newText }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_CHALLENGE',
        projectId,
        date,
        index,
        newText,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating challenge:', command);

      // Get current state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];
      if (!currentNote) {
        throw new Error('Daily note not found');
      }

      const updatedChallenges = [...currentNote.challenges];
      updatedChallenges[index] = newText;

      // Update server
      const response = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: currentNote.keyHighlights,
        challenges: updatedChallenges,
        sessionNotes: currentNote.sessionNotes,
        author: currentNote.author,
        authorRole: currentNote.authorRole
      });

      // Update entity store
      dispatch(dailyNoteUpserted(response.data));

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Challenge updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] Challenge updated successfully');
      return { ...response.data, command };

    } catch (error) {
      console.error('[Command] Failed to update challenge:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update challenge',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch daily notes for a project
 * Business Intent: User wants to view daily notes
 */
export const fetchDailyNotes = createAsyncThunk(
  'dailyNotes/fetchDailyNotes',
  async ({ projectId, date }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loadingStarted());

      const dateParam = date ? `&date=${date}` : '';
      const response = await axios.get(`/api/projects/daily-training-notes?projectId=${projectId}${dateParam}`);

      // Update entity store
      if (Array.isArray(response.data)) {
        response.data.forEach(note => dispatch(dailyNoteUpserted(note)));
      } else if (response.data) {
        dispatch(dailyNoteUpserted(response.data));
      }

      dispatch(loadingCompleted());

      console.log('[Command] Daily notes fetched successfully');
      return response.data;

    } catch (error) {
      console.error('[Command] Failed to fetch daily notes:', error);

      dispatch(errorOccurred(error.message));
      dispatch(loadingCompleted());

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Summarize session notes with AI to generate key highlights and challenges
 * Business Intent: User wants to automatically extract insights from session notes
 * @param {object} params
 * @param {number} params.projectId - Project ID
 * @param {string} params.date - Date string (YYYY-MM-DD)
 * @param {string} params.sessionNotes - Session notes text
 * @param {object} params.attendanceData - Optional attendance data
 * @param {number} params.attendanceData.present - Number of participants present
 * @param {number} params.attendanceData.late - Number of participants late
 * @param {number} params.attendanceData.absent - Number of participants absent
 * @param {number} params.attendanceData.total - Total number of participants
 * @param {string[]} params.attendanceData.absentNames - Names of absent participants
 * @param {object[]} params.parkingLotItems - Optional parking lot items
 * @param {string} params.parkingLotItems[].type - Item type (issue or question)
 * @param {string} params.parkingLotItems[].title - Item title
 * @param {string} params.parkingLotItems[].priority - Item priority (low, medium, high)
 * @param {string} params.parkingLotItems[].status - Item status (open, in_progress, resolved)
 */
export const summarizeWithAI = createAsyncThunk(
  'dailyNotes/summarizeWithAI',
  async ({ projectId, date, sessionNotes, attendanceData = null, parkingLotItems = null }, { dispatch, getState, rejectWithValue }) => {
    try {
      const command = {
        type: 'SUMMARIZE_WITH_AI',
        projectId,
        date,
        hasAttendanceData: !!attendanceData,
        hasParkingLotItems: !!parkingLotItems && parkingLotItems.length > 0,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Summarizing session notes with AI:', command);

      dispatch(loadingStarted());

      // Call AI summarization API with optional attendance and parking lot data
      const response = await axios.post('/api/ai/summarize-session-notes', {
        sessionNotes,
        attendanceData,
        parkingLotItems
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'AI summarization failed');
      }

      const { keyHighlights, challenges } = response.data.data;

      // Get current note from state
      const noteId = `${projectId}-${date}`;
      const currentNote = getState().dailyNotes.entities[noteId];

      // Replace existing highlights/challenges with AI-generated ones
      // User expectation: Re-clicking should generate fresh content
      console.log('[Command] Replacing existing items with AI-generated content');

      // Save to database
      const saveResponse = await axios.post(`/api/projects/daily-training-notes?projectId=${projectId}&date=${date}`, {
        keyHighlights: keyHighlights,
        challenges: challenges,
        sessionNotes: currentNote?.sessionNotes || null,
        author: currentNote?.author || null,
        authorRole: currentNote?.authorRole || null
      });

      // Update entity store
      dispatch(dailyNoteUpserted(saveResponse.data));
      dispatch(loadingCompleted());

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `AI generated ${keyHighlights.length} highlights and ${challenges.length} challenges`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      console.log('[Command] AI summarization completed successfully');
      return {
        ...saveResponse.data,
        aiGenerated: { keyHighlights, challenges },
        command
      };

    } catch (error) {
      console.error('[Command] Failed to summarize with AI:', error);

      dispatch(errorOccurred(error.message));
      dispatch(loadingCompleted());

      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || error.message || 'Failed to generate AI summary',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Export all commands
export const dailyNotesCommands = {
  updateDailyNotes,
  addKeyHighlight,
  removeKeyHighlight,
  updateKeyHighlight,
  addChallenge,
  removeChallenge,
  updateChallenge,
  fetchDailyNotes,
  summarizeWithAI
};

export default dailyNotesCommands;
