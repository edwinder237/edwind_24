import { useState, useCallback } from 'react';

/**
 * Calculate end time that is a specified duration after start time
 * @param {string} startTime - Time string in "HH:mm" format
 * @param {number} offsetMinutes - Minutes to add (default: 60)
 * @returns {string} New end time in "HH:mm" format
 */
export const calculateEndTimeOffset = (startTime, offsetMinutes = 60) => {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + offsetMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

/**
 * Check if end time is valid (after start time)
 * @param {string} startTime - Start time in "HH:mm" format
 * @param {string} endTime - End time in "HH:mm" format
 * @returns {boolean} True if valid range
 */
export const isValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  return endTime > startTime;
};

/**
 * Custom hook for managing time range inputs with auto-adjustment
 *
 * When the user sets an invalid time range (end <= start), the hook
 * automatically adjusts the end time to be minDurationMinutes after start.
 *
 * @param {Object} options
 * @param {string} options.initialStartTime - Initial start time ("HH:mm")
 * @param {string} options.initialEndTime - Initial end time ("HH:mm")
 * @param {number} options.minDurationMinutes - Minimum duration in minutes (default: 60)
 * @returns {Object} Time range state and handlers
 */
export const useTimeRangeInput = ({
  initialStartTime = '',
  initialEndTime = '',
  minDurationMinutes = 60
} = {}) => {
  const [startTime, setStartTimeState] = useState(initialStartTime);
  const [endTime, setEndTimeState] = useState(initialEndTime);

  const setStartTime = useCallback((newStartTime) => {
    setStartTimeState(newStartTime);
    // Auto-adjust end time if new start >= current end
    setEndTimeState((currentEndTime) => {
      if (currentEndTime && newStartTime >= currentEndTime) {
        return calculateEndTimeOffset(newStartTime, minDurationMinutes);
      }
      return currentEndTime;
    });
  }, [minDurationMinutes]);

  const setEndTime = useCallback((newEndTime) => {
    // Allow user to freely edit end time - no auto-correction
    // Validation is available via isValidRange for checking on save
    setEndTimeState(newEndTime);
  }, []);

  const reset = useCallback((start, end) => {
    setStartTimeState(start);
    setEndTimeState(end);
  }, []);

  // Validation state
  const isValidRange = isValidTimeRange(startTime, endTime);
  const hasEndTimeError = !!startTime && !!endTime && !isValidRange;

  return {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    reset,
    isValidRange,
    // Validation helpers for UI components
    endTimeError: hasEndTimeError,
    endTimeHelperText: hasEndTimeError ? 'End must be after start' : '',
    canSave: !!startTime && !!endTime && isValidRange,
    // Raw setters for initialization without auto-adjust
    _setStartTimeRaw: setStartTimeState,
    _setEndTimeRaw: setEndTimeState
  };
};

/**
 * Format Date to datetime-local string (YYYY-MM-DDTHH:mm)
 * @param {Date} date - Date object
 * @returns {string} datetime-local formatted string
 */
export const formatDateTimeLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Add minutes to a datetime-local string
 * @param {string} dateTimeStr - datetime-local string (YYYY-MM-DDTHH:mm)
 * @param {number} minutes - Minutes to add
 * @returns {string} New datetime-local string
 */
const addMinutesToDateTime = (dateTimeStr, minutes) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  date.setMinutes(date.getMinutes() + minutes);
  return formatDateTimeLocal(date);
};

/**
 * Custom hook for datetime range inputs with auto-adjustment
 * Works with datetime-local format: "YYYY-MM-DDTHH:mm"
 *
 * Auto-adjusts:
 * - If start datetime >= end datetime: sets end to minDurationMinutes after start
 * - If start date > end date: sets end date to start date (+ minDurationMinutes)
 *
 * @param {Object} options
 * @param {string} options.initialStart - Initial start datetime (YYYY-MM-DDTHH:mm)
 * @param {string} options.initialEnd - Initial end datetime (YYYY-MM-DDTHH:mm)
 * @param {number} options.minDurationMinutes - Minimum duration in minutes (default: 60)
 * @returns {Object} DateTime range state and handlers
 */
export const useDateTimeRangeInput = ({
  initialStart = '',
  initialEnd = '',
  minDurationMinutes = 60
} = {}) => {
  const [startDateTime, setStartDateTimeState] = useState(initialStart);
  const [endDateTime, setEndDateTimeState] = useState(initialEnd);

  const setStartDateTime = useCallback((newStart) => {
    setStartDateTimeState(newStart);
    setEndDateTimeState((currentEnd) => {
      if (currentEnd && newStart >= currentEnd) {
        return addMinutesToDateTime(newStart, minDurationMinutes);
      }
      return currentEnd;
    });
  }, [minDurationMinutes]);

  const setEndDateTime = useCallback((newEnd) => {
    // Allow user to freely edit end datetime - no auto-correction
    // Validation should be done on save
    setEndDateTimeState(newEnd);
  }, []);

  const reset = useCallback((start, end) => {
    setStartDateTimeState(start);
    setEndDateTimeState(end);
  }, []);

  // Validation state
  const isValidRange = !startDateTime || !endDateTime || endDateTime > startDateTime;
  const hasEndTimeError = !!startDateTime && !!endDateTime && !isValidRange;

  return {
    startDateTime,
    endDateTime,
    setStartDateTime,
    setEndDateTime,
    reset,
    isValidRange,
    // Validation helpers for UI components
    endTimeError: hasEndTimeError,
    endTimeHelperText: hasEndTimeError ? 'End must be after start' : '',
    canSave: !!startDateTime && !!endDateTime && isValidRange,
    _setStartRaw: setStartDateTimeState,
    _setEndRaw: setEndDateTimeState
  };
};

/**
 * Add days to a Date object
 * @param {Date} date - Date object
 * @param {number} days - Days to add
 * @returns {Date} New Date object
 */
const addDaysToDate = (date, days) => {
  if (!date) return null;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Check if date1 is after date2 (comparing dates only, not time)
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if date1 > date2
 */
const isDateAfter = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1 > d2;
};

/**
 * Custom hook for date range inputs with auto-adjustment
 * Works with Date objects (for MUI DatePicker)
 *
 * Auto-adjusts:
 * - If start date > end date: sets end date to start date + minDurationDays
 * - If end date < start date: sets end date to start date + minDurationDays
 *
 * @param {Object} options
 * @param {Date} options.initialStartDate - Initial start date
 * @param {Date} options.initialEndDate - Initial end date
 * @param {number} options.minDurationDays - Minimum duration in days (default: 1)
 * @returns {Object} Date range state and handlers
 */
export const useDateRangeInput = ({
  initialStartDate = null,
  initialEndDate = null,
  minDurationDays = 1
} = {}) => {
  const [startDate, setStartDateState] = useState(initialStartDate);
  const [endDate, setEndDateState] = useState(initialEndDate);

  const setStartDate = useCallback((newStart) => {
    setStartDateState(newStart);
    setEndDateState((currentEnd) => {
      // If new start date is after current end date, adjust end date
      if (currentEnd && newStart && isDateAfter(newStart, currentEnd)) {
        return addDaysToDate(newStart, minDurationDays);
      }
      return currentEnd;
    });
  }, [minDurationDays]);

  const setEndDate = useCallback((newEnd) => {
    // Allow user to freely edit end date - no auto-correction
    // Validation is available via isValidRange for checking on save
    setEndDateState(newEnd);
  }, []);

  const reset = useCallback((start, end) => {
    setStartDateState(start);
    setEndDateState(end);
  }, []);

  // Validation state
  const isValidRange = !startDate || !endDate || !isDateAfter(startDate, endDate);
  const hasEndDateError = !!startDate && !!endDate && !isValidRange;

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    reset,
    isValidRange,
    isSameDay: startDate && endDate && isSameDay(startDate, endDate),
    // Validation helpers for UI components
    endDateError: hasEndDateError,
    endDateHelperText: hasEndDateError ? 'End must be after start' : '',
    canSave: !!startDate && !!endDate && isValidRange,
    _setStartDateRaw: setStartDateState,
    _setEndDateRaw: setEndDateState
  };
};

export default useTimeRangeInput;
