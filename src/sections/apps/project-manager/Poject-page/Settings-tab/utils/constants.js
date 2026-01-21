export const DEFAULT_SETTINGS = {
  START_OF_DAY: '09:00',
  END_OF_DAY: '17:00',
  LUNCH_TIME: '12:00-13:00',
  TIMEZONE: 'UTC',
  WORKING_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
};

export const WORKING_DAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

// Enhanced timezone options with labels
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Edmonton', label: 'Mountain Time (Edmonton)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
];

// Legacy: simple array of timezone values for backward compatibility
export const TIMEZONE_VALUES = TIMEZONE_OPTIONS.map(tz => tz.value);

export const NOTIFICATION_MESSAGES = {
  SAVE_SUCCESS: 'Project settings updated successfully',
  SAVE_ERROR: 'Failed to update project settings',
  CANCEL_SUCCESS: 'Changes cancelled',
  NO_PROJECT: 'No project selected',
  UNSAVED_CHANGES: 'You have unsaved changes'
};

export const TIME_FORMAT = 'HH:mm';
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';