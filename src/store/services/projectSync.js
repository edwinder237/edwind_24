/**
 * Project Synchronization Service
 *
 * Centralizes cross-store synchronization logic for project-related data.
 * This ensures that changes in one store are properly reflected in related stores.
 *
 * Note: Dashboard store has been removed - dashboard metrics are now computed
 * via derived selectors from projectSettings, projectAgenda, and other stores.
 */

import { updateProjectInfo as updateSettingsProjectInfo } from '../reducers/project/settings';

/**
 * Synchronizes complete project data across all relevant stores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} projectData - Complete project data object
 *
 * Note: Dashboard store sync removed - dashboard now uses derived selectors
 */
export const syncProjectToStores = (dispatch, projectData) => {
  if (!projectData) return;

  // Dashboard sync removed - now using derived selectors for dashboard metrics
  // All project data is already in projectSettings store
};

/**
 * Synchronizes project settings changes to relevant stores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} settingsData - Project settings data
 *
 * Note: Dashboard store sync removed - dashboard now uses derived selectors
 */
export const syncSettingsToStores = (dispatch, settingsData) => {
  if (!settingsData) return;

  // Dashboard sync removed - settings are already in projectSettings store
  // and dashboard metrics are computed via derived selectors
};

/**
 * Synchronizes project info changes (like title, summary updates) to relevant stores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} projectUpdates - Updated project information
 *
 * Note: Dashboard store sync removed - dashboard now uses derived selectors
 */
export const syncProjectInfoToStores = (dispatch, projectUpdates) => {
  if (!projectUpdates) return;

  // Dashboard sync removed - project info is already in projectSettings store
  // Sync to project settings store only
  syncProjectInfoToSettingsStore(dispatch, projectUpdates);
};

/**
 * Synchronizes project info changes to the project settings store
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} projectUpdates - Updated project information
 */
export const syncProjectInfoToSettingsStore = (dispatch, projectUpdates) => {
  if (!projectUpdates) return;

  // Extract fields that the settings store cares about
  const settingsProjectUpdates = {};
  
  // Basic project information
  if (projectUpdates.id !== undefined) settingsProjectUpdates.id = projectUpdates.id;
  if (projectUpdates.title !== undefined) settingsProjectUpdates.title = projectUpdates.title;
  if (projectUpdates.summary !== undefined) settingsProjectUpdates.summary = projectUpdates.summary;
  if (projectUpdates.projectStatus !== undefined) settingsProjectUpdates.status = projectUpdates.projectStatus;
  if (projectUpdates.status !== undefined) settingsProjectUpdates.status = projectUpdates.status;
  
  // Dates
  if (projectUpdates.startDate !== undefined) settingsProjectUpdates.startDate = projectUpdates.startDate;
  if (projectUpdates.endDate !== undefined) settingsProjectUpdates.endDate = projectUpdates.endDate;
  
  // Training recipient - this is the key one for the current issue
  if (projectUpdates.trainingRecipientId !== undefined) settingsProjectUpdates.trainingRecipientId = projectUpdates.trainingRecipientId;
  if (projectUpdates.training_recipient !== undefined) settingsProjectUpdates.training_recipient = projectUpdates.training_recipient;
  
  // Organization info
  if (projectUpdates.organization !== undefined) settingsProjectUpdates.organization = projectUpdates.organization;
  if (projectUpdates.sub_organization !== undefined) settingsProjectUpdates.organization = projectUpdates.sub_organization;

  // Dispatch update to settings store if there are changes
  if (Object.keys(settingsProjectUpdates).length > 0) {
    dispatch(updateSettingsProjectInfo(settingsProjectUpdates));
  }
};

/**
 * Handles full project data synchronization from fetchProjectSettings API response
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} settingsResponse - Full response from fetchProjectSettings API
 */
export const syncSettingsResponseToStores = (dispatch, settingsResponse) => {
  if (!settingsResponse?.data) return;

  const { project, settings, projectInstructors } = settingsResponse.data;

  // Sync project basic info
  if (project) {
    syncProjectToStores(dispatch, project);
  }

  // Sync settings that affect other stores
  if (settings) {
    syncSettingsToStores(dispatch, settings);
  }

  // Sync instructor changes to dashboard store
  if (projectInstructors) {
    syncInstructorsToStores(dispatch, projectInstructors);
  }
};

/**
 * Synchronizes instructor changes to relevant stores
 * @param {Function} dispatch - Redux dispatch function
 * @param {Array} instructors - Array of project instructors
 *
 * Note: Dashboard store sync removed - dashboard now uses derived selectors
 * that compute lead instructor from projectSettings.projectInstructors
 */
export const syncInstructorsToStores = (dispatch, instructors) => {
  if (!instructors || !Array.isArray(instructors)) return;

  // Dashboard sync removed - instructors are already in projectSettings store
  // and lead instructor is computed via selectLeadInstructor selector
};

/**
 * Utility function to log synchronization operations for debugging
 * @param {string} operation - The sync operation being performed
 * @param {Object} data - The data being synchronized
 */
export const logSync = (operation, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ProjectSync] ${operation}:`, data);
  }
};

/**
 * Validates that the required dispatch function is available
 * @param {Function} dispatch - Redux dispatch function
 * @throws {Error} If dispatch is not a function
 */
export const validateDispatch = (dispatch) => {
  if (typeof dispatch !== 'function') {
    throw new Error('ProjectSync: dispatch must be a function');
  }
};

// Future extensibility: Add more sync functions as needed
// For example:
// - syncAgendaToStores()
// - syncParticipantsToStores()  
// - syncGroupsToStores()

export default {
  syncProjectToStores,
  syncSettingsToStores,
  syncProjectInfoToStores,
  syncProjectInfoToSettingsStore,
  syncSettingsResponseToStores,
  syncInstructorsToStores,
  logSync,
  validateDispatch
};