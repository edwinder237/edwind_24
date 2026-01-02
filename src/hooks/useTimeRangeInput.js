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
    setStartTimeState((currentStartTime) => {
      // Auto-adjust if user tries to set invalid end time
      if (currentStartTime && newEndTime <= currentStartTime) {
        setEndTimeState(calculateEndTimeOffset(currentStartTime, minDurationMinutes));
      } else {
        setEndTimeState(newEndTime);
      }
      return currentStartTime; // Don't change start time
    });
  }, [minDurationMinutes]);

  const reset = useCallback((start, end) => {
    setStartTimeState(start);
    setEndTimeState(end);
  }, []);

  return {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    reset,
    isValidRange: isValidTimeRange(startTime, endTime),
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
    setStartDateTimeState((currentStart) => {
      if (currentStart && newEnd <= currentStart) {
        setEndDateTimeState(addMinutesToDateTime(currentStart, minDurationMinutes));
      } else {
        setEndDateTimeState(newEnd);
      }
      return currentStart;
    });
  }, [minDurationMinutes]);

  const reset = useCallback((start, end) => {
    setStartDateTimeState(start);
    setEndDateTimeState(end);
  }, []);

  return {
    startDateTime,
    endDateTime,
    setStartDateTime,
    setEndDateTime,
    reset,
    _setStartRaw: setStartDateTimeState,
    _setEndRaw: setEndDateTimeState
  };
};

export default useTimeRangeInput;
