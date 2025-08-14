import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addMinutes, differenceInMinutes } from 'date-fns';
import { TIME_FORMATS } from './constants';

export const formatTime = (time, formatType = TIME_FORMATS.DISPLAY) => {
  if (!time) return '';
  try {
    const date = typeof time === 'string' ? parseISO(time) : time;
    return format(date, formatType);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const getWeekDays = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const isEventToday = (eventDate) => {
  if (!eventDate) return false;
  try {
    const date = typeof eventDate === 'string' ? parseISO(eventDate) : eventDate;
    return isToday(date);
  } catch (error) {
    return false;
  }
};

export const areEventsSameDay = (event1Date, event2Date) => {
  if (!event1Date || !event2Date) return false;
  try {
    const date1 = typeof event1Date === 'string' ? parseISO(event1Date) : event1Date;
    const date2 = typeof event2Date === 'string' ? parseISO(event2Date) : event2Date;
    return isSameDay(date1, date2);
  } catch (error) {
    return false;
  }
};

export const generateTimeSlots = (startTime = '08:00', endTime = '18:00', intervalMinutes = 30) => {
  const slots = [];
  let current = parseISO(`2023-01-01T${startTime}:00`);
  const end = parseISO(`2023-01-01T${endTime}:00`);
  
  while (current < end) {
    slots.push({
      time: format(current, TIME_FORMATS.DISPLAY),
      value: format(current, TIME_FORMATS.TIME_ONLY)
    });
    current = addMinutes(current, intervalMinutes);
  }
  
  return slots;
};

export const calculateEventDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
    return differenceInMinutes(end, start);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

export const getTimeFromDateTime = (dateTime) => {
  if (!dateTime) return '';
  try {
    const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
    return format(date, TIME_FORMATS.DISPLAY);
  } catch (error) {
    return '';
  }
};

export const combineDateAndTime = (date, time) => {
  if (!date || !time) return null;
  try {
    const dateStr = typeof date === 'string' ? date : format(date, TIME_FORMATS.DATE_ONLY);
    return parseISO(`${dateStr}T${time}`);
  } catch (error) {
    console.error('Error combining date and time:', error);
    return null;
  }
};