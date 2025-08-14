import { DEFAULT_SETTINGS } from './constants';

/**
 * Creates initial settings state from projectSettings
 * @param {Object} projectSettings - Project settings from API
 * @returns {Object} Initial state object
 */
export const createInitialState = (projectSettings) => {
  if (!projectSettings) {
    return {
      startDate: null,
      endDate: null,
      startOfDayTime: DEFAULT_SETTINGS.START_OF_DAY,
      endOfDayTime: DEFAULT_SETTINGS.END_OF_DAY,
      lunchTime: DEFAULT_SETTINGS.LUNCH_TIME,
      timezone: DEFAULT_SETTINGS.TIMEZONE,
      workingDays: [...DEFAULT_SETTINGS.WORKING_DAYS]
    };
  }

  return {
    startDate: projectSettings.startDate ? new Date(projectSettings.startDate) : null,
    endDate: projectSettings.endDate ? new Date(projectSettings.endDate) : null,
    startOfDayTime: projectSettings.startOfDayTime || DEFAULT_SETTINGS.START_OF_DAY,
    endOfDayTime: projectSettings.endOfDayTime || DEFAULT_SETTINGS.END_OF_DAY,
    lunchTime: projectSettings.lunchTime || DEFAULT_SETTINGS.LUNCH_TIME,
    timezone: projectSettings.timezone || DEFAULT_SETTINGS.TIMEZONE,
    workingDays: projectSettings.workingDays || [...DEFAULT_SETTINGS.WORKING_DAYS]
  };
};

/**
 * Compares current state with original settings to detect changes
 * @param {Object} currentState - Current form state
 * @param {Object} originalSettings - Original project settings
 * @returns {boolean} Whether there are changes
 */
export const hasSettingsChanged = (currentState, originalSettings) => {
  if (!originalSettings) return false;

  const original = createInitialState(originalSettings);
  
  // Compare dates
  const currentStartTime = currentState.startDate?.getTime();
  const originalStartTime = original.startDate?.getTime();
  const currentEndTime = currentState.endDate?.getTime();
  const originalEndTime = original.endDate?.getTime();
  
  if (currentStartTime !== originalStartTime || currentEndTime !== originalEndTime) {
    return true;
  }

  // Compare other settings
  return (
    currentState.startOfDayTime !== original.startOfDayTime ||
    currentState.endOfDayTime !== original.endOfDayTime ||
    currentState.lunchTime !== original.lunchTime ||
    currentState.timezone !== original.timezone ||
    JSON.stringify(currentState.workingDays) !== JSON.stringify(original.workingDays)
  );
};

/**
 * Prepares settings data for API submission
 * @param {Object} state - Current form state
 * @returns {Object} Settings data ready for API
 */
export const prepareSettingsForSubmission = (state) => {
  return {
    startDate: state.startDate?.toISOString() || null,
    endDate: state.endDate?.toISOString() || null,
    startOfDayTime: state.startOfDayTime,
    endOfDayTime: state.endOfDayTime,
    lunchTime: state.lunchTime,
    timezone: state.timezone,
    workingDays: state.workingDays,
    updatedBy: 'user'
  };
};

/**
 * Validates the settings state
 * @param {Object} state - Settings state to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateSettings = (state) => {
  const errors = [];

  // Validate date range
  if (state.startDate && state.endDate && state.startDate >= state.endDate) {
    errors.push('End date must be after start date');
  }

  // Validate time format
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(state.startOfDayTime)) {
    errors.push('Invalid start of day time format');
  }
  if (!timePattern.test(state.endOfDayTime)) {
    errors.push('Invalid end of day time format');
  }

  // Validate lunch time format
  const lunchPattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!lunchPattern.test(state.lunchTime)) {
    errors.push('Invalid lunch time format (use HH:mm-HH:mm)');
  }

  // Validate working days
  if (!state.workingDays || state.workingDays.length === 0) {
    errors.push('At least one working day must be selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};