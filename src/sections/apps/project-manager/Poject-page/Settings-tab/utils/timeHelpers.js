import { format, parse } from 'date-fns';
import { TIME_FORMAT, DEFAULT_SETTINGS } from './constants';

/**
 * Converts a time string (HH:mm) to a Date object
 * @param {string} timeString - Time in HH:mm format
 * @returns {Date} Date object with the time set
 */
export const timeStringToDate = (timeString) => {
  if (!timeString) {
    return parse(DEFAULT_SETTINGS.START_OF_DAY, TIME_FORMAT, new Date());
  }
  
  try {
    return parse(timeString, TIME_FORMAT, new Date());
  } catch (error) {
    console.warn('Invalid time string:', timeString);
    return parse(DEFAULT_SETTINGS.START_OF_DAY, TIME_FORMAT, new Date());
  }
};

/**
 * Converts a Date object to time string (HH:mm)
 * @param {Date} date - Date object
 * @returns {string} Time string in HH:mm format
 */
export const dateToTimeString = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return DEFAULT_SETTINGS.START_OF_DAY;
  }
  
  try {
    return format(date, TIME_FORMAT);
  } catch (error) {
    console.warn('Invalid date object:', date);
    return DEFAULT_SETTINGS.START_OF_DAY;
  }
};

/**
 * Validates time range format (HH:mm-HH:mm)
 * @param {string} timeRange - Time range string
 * @returns {boolean} Whether the format is valid
 */
export const validateTimeRange = (timeRange) => {
  if (!timeRange || typeof timeRange !== 'string') return false;
  
  const pattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return pattern.test(timeRange);
};

/**
 * Formats a date for display
 * @param {string|Date} date - Date to format
 * @param {string} formatString - Format string
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'N/A';
  }
};

/**
 * Checks if a time string represents a valid time
 * @param {string} timeString - Time string to validate
 * @returns {boolean} Whether the time is valid
 */
export const isValidTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return false;
  
  const pattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return pattern.test(timeString);
};