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

export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Toronto', 
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

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