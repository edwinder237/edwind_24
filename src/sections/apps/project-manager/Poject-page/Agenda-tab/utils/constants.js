export const EVENT_TYPES = {
  COURSE: 'course',
  SUPPORT_ACTIVITY: 'supportActivity',
  MEETING: 'meeting',
  BREAK: 'break',
  OTHER: 'other'
};

export const COLOR_OPTIONS = [
  { name: 'Primary', value: '#1976d2', lightColor: '#bbdefb' },
  { name: 'Info', value: '#0288d1', lightColor: '#b3e5fc' },
  { name: 'Success', value: '#2e7d32', lightColor: '#c8e6c9' },
  { name: 'Warning', value: '#ed6c02', lightColor: '#ffe0b2' },
  { name: 'Error', value: '#d32f2f', lightColor: '#ffcdd2' },
  { name: 'Secondary', value: '#9c27b0', lightColor: '#e1bee7' },
  { name: 'Dark', value: '#1a1a1a', lightColor: '#e0e0e0' }
];

export const DRAG_TYPES = {
  EVENT: 'event',
  TIME_SLOT: 'timeSlot'
};

export const TIME_FORMATS = {
  DISPLAY: 'HH:mm',
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss'
};

export const VIEW_MODES = {
  AGENDA: 'agenda',
  WEEK: 'week', 
  MONTH: 'month'
};

export const EVENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress'
};

export const CUSTOM_EVENT_CATEGORIES = [
  'Break',
  'Meeting',
  'Presentation',
  'Workshop',
  'Social',
  'Administrative',
  'Other'
];

export const CUSTOM_EVENT_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
];

export const SCROLL_STYLES = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
};