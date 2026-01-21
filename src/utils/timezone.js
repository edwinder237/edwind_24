import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Enhanced timezone options with user-friendly labels
 */
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

/**
 * Get just the timezone values for backward compatibility
 */
export const TIMEZONE_VALUES = TIMEZONE_OPTIONS.map(tz => tz.value);

/**
 * Convert a local time to UTC for database storage
 * @param {Date|string} localDate - Date in local/project timezone
 * @param {string} timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns {Date} - UTC Date object for database storage
 */
export function localToUtc(localDate, timezone) {
  if (!localDate) return null;
  const date = typeof localDate === 'string' ? parseISO(localDate) : localDate;
  return zonedTimeToUtc(date, timezone);
}

/**
 * Convert UTC time to project timezone for display
 * @param {Date|string} utcDate - UTC date from database
 * @param {string} timezone - IANA timezone string
 * @returns {Date} - Date object in project timezone
 */
export function utcToLocal(utcDate, timezone) {
  if (!utcDate) return null;
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return utcToZonedTime(date, timezone);
}

/**
 * Format a UTC date in project timezone
 * @param {Date|string} utcDate - UTC date from database
 * @param {string} timezone - IANA timezone string
 * @param {string} formatStr - date-fns format string
 * @returns {string} - Formatted date string in project timezone
 */
export function formatInProjectTimezone(utcDate, timezone, formatStr = 'yyyy-MM-dd HH:mm') {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get current time in project timezone
 * @param {string} timezone - IANA timezone string
 * @returns {Date} - Current time in project timezone
 */
export function getCurrentTimeInTimezone(timezone) {
  return utcToZonedTime(new Date(), timezone);
}

/**
 * Get timezone offset display string (e.g., "EST", "UTC-5")
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Short timezone abbreviation
 */
export function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(p => p.type === 'timeZoneName');
    return tzName ? tzName.value : timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get the label for a timezone value
 * @param {string} timezoneValue - IANA timezone string
 * @returns {string} - Human-readable label
 */
export function getTimezoneLabel(timezoneValue) {
  const option = TIMEZONE_OPTIONS.find(tz => tz.value === timezoneValue);
  return option ? option.label : timezoneValue;
}

/**
 * Convert time from one timezone to another and format it
 * @param {Date|string} date - The date/time to convert
 * @param {string} fromTimezone - Source timezone (e.g., 'America/Los_Angeles')
 * @param {string} toTimezone - Target timezone (e.g., 'America/New_York')
 * @param {string} formatStr - date-fns format string
 * @returns {string} - Formatted time in target timezone
 */
export function convertTimezone(date, fromTimezone, toTimezone, formatStr = 'h:mm a') {
  if (!date || !fromTimezone || !toTimezone) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    // First convert from source timezone to UTC
    const utcDate = zonedTimeToUtc(dateObj, fromTimezone);
    // Then format in target timezone
    return formatInTimeZone(utcDate, toTimezone, formatStr);
  } catch {
    return '';
  }
}

export default {
  TIMEZONE_OPTIONS,
  TIMEZONE_VALUES,
  localToUtc,
  utcToLocal,
  formatInProjectTimezone,
  getCurrentTimeInTimezone,
  getTimezoneOffset,
  getTimezoneLabel,
  convertTimezone
};
