// CQRS versions - using RTK Query and entity stores
export { default as FullCalendarMonthView } from './FullCalendarMonthViewCQRS';
export { default as FullCalendarWeekView } from './FullCalendarWeekViewCQRS';

// Legacy fallback (kept for rollback if needed)
// export { default as FullCalendarMonthView } from './FullCalendarMonthView';
// export { default as FullCalendarWeekView } from './FullCalendarWeekView';