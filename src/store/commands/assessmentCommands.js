import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';

/**
 * Semantic Commands for Assessment Management
 *
 * These commands express user intentions for assessment operations.
 * They follow the CQRS pattern used throughout the application.
 */

// ==============================|| ASSESSMENT COMMANDS ||============================== //

/**
 * Record an assessment score for a participant
 * @param {Object} params - Command parameters
 * @param {number} params.assessmentId - Course assessment ID
 * @param {number} params.participantId - Project participant ID
 * @param {Object} params.scoreData - Score information
 * @param {number} params.scoreData.scoreEarned - Points earned
 * @param {number} params.scoreData.scoreMaximum - Maximum possible points
 * @param {string} params.scoreData.feedback - Optional instructor feedback
 * @param {string} params.scoreData.assessmentDate - Date of assessment
 * @param {number} params.scoreData.instructorId - Optional instructor ID
 */
export const recordAssessmentScore = createAsyncThunk(
  'assessment/recordScore',
  async ({ assessmentId, participantId, scoreData }, { dispatch, rejectWithValue }) => {
    try {
      // Build the command context
      const command = {
        type: 'RECORD_ASSESSMENT_SCORE',
        assessmentId,
        participantId,
        scoreData,
        timestamp: new Date().toISOString()
      };

      // Execute the API mutation via RTK Query
      const result = await dispatch(
        projectApi.endpoints.recordAssessmentScore.initiate(scoreData)
      ).unwrap();

      // Show success feedback
      const percentage = ((scoreData.scoreEarned / scoreData.scoreMaximum) * 100).toFixed(1);
      const status = result.score.passed ? 'passed' : 'did not pass';

      dispatch(openSnackbar({
        open: true,
        message: `Score recorded: ${scoreData.scoreEarned}/${scoreData.scoreMaximum} (${percentage}%) - ${status}`,
        variant: 'alert',
        alert: { color: result.score.passed ? 'success' : 'warning' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to record assessment score:', error);

      let errorMessage = 'Failed to record assessment score';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Override an assessment score (instructor manual adjustment)
 * @param {Object} params - Command parameters
 * @param {number} params.scoreId - Score record ID to override
 * @param {boolean} params.passed - Override pass/fail status
 * @param {string} params.reason - Reason for override
 * @param {string} params.overriddenBy - User making the override
 */
export const overrideAssessmentScore = createAsyncThunk(
  'assessment/overrideScore',
  async ({ scoreId, passed, reason, overriddenBy }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'OVERRIDE_ASSESSMENT_SCORE',
        scoreId,
        passed,
        reason,
        overriddenBy,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.overrideAssessmentScore.initiate({
          scoreId,
          passed,
          overrideReason: reason,
          overriddenBy
        })
      ).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `Score override applied: ${passed ? 'Marked as Passed' : 'Marked as Failed'}`,
        variant: 'alert',
        alert: { color: 'info' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to override assessment score:', error);

      let errorMessage = 'Failed to override score';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * View assessment attempt history for a participant
 * This is primarily a query command that triggers appropriate UI updates
 * @param {Object} params - Command parameters
 * @param {number} params.assessmentId - Course assessment ID
 * @param {number} params.participantId - Project participant ID
 */
export const viewAssessmentHistory = createAsyncThunk(
  'assessment/viewHistory',
  async ({ assessmentId, participantId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'VIEW_ASSESSMENT_HISTORY',
        assessmentId,
        participantId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.getAssessmentAttempts.initiate({ assessmentId, participantId })
      ).unwrap();

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to fetch assessment history:', error);

      let errorMessage = 'Failed to load assessment history';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(errorMessage);
    }
  }
);

// Export all commands as a module
export const assessmentCommands = {
  recordAssessmentScore,
  overrideAssessmentScore,
  viewAssessmentHistory
};
