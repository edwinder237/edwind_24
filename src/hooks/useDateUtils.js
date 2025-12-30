/**
 * Date Utility Hook
 *
 * Centralized date parsing and formatting to avoid timezone shift issues.
 *
 * Key Problem: When parsing ISO date strings like "2025-10-20", JavaScript's Date
 * constructor interprets them as UTC midnight, which can shift to the previous day
 * in local timezones (e.g., PST/PDT).
 *
 * Solution: Parse date components and create local Date objects.
 */

import { useMemo } from 'react';

export const useDateUtils = () => {
  return useMemo(() => ({
    /**
     * Parse ISO date string (YYYY-MM-DD) as local date
     * Avoids timezone shifts by creating a local Date object
     *
     * @param {string} dateString - ISO date string (YYYY-MM-DD)
     * @returns {Date} Local Date object
     */
    parseLocalDate: (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    },

    /**
     * Format date string for display with relative labels (Today, Yesterday)
     *
     * @param {string} dateString - ISO date string (YYYY-MM-DD)
     * @returns {string} Formatted date string
     */
    formatDate: (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
    },

    /**
     * Format date string for long display (e.g., for email)
     *
     * @param {string} dateString - ISO date string (YYYY-MM-DD)
     * @returns {string} Long formatted date string
     */
    formatDateLong: (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    /**
     * Format date string for standard display
     *
     * @param {string} dateString - ISO date string (YYYY-MM-DD)
     * @returns {string} Standard formatted date string
     */
    formatDateStandard: (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString();
    },

    /**
     * Convert Date object to ISO date string (YYYY-MM-DD)
     *
     * @param {Date} date - Date object
     * @returns {string} ISO date string (YYYY-MM-DD)
     */
    toISODateString: (date) => {
      return date.toISOString().split('T')[0];
    },

    /**
     * Check if two date strings represent the same date
     *
     * @param {string} dateString1 - ISO date string (YYYY-MM-DD)
     * @param {string} dateString2 - ISO date string (YYYY-MM-DD)
     * @returns {boolean} True if same date
     */
    isSameDate: (dateString1, dateString2) => {
      return dateString1 === dateString2;
    },

    /**
     * Get current date as ISO string (YYYY-MM-DD)
     *
     * @returns {string} Current date as ISO string
     */
    getCurrentDateString: () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  }), []);
};

export default useDateUtils;
