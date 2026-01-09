import { useState, useCallback, useMemo } from 'react';
import { VIEW_MODES } from '../utils/constants';

export const useAgendaState = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.AGENDA);
  const [viewScheduleOpen, setViewScheduleOpen] = useState(false);

  const handleEventSelect = useCallback((eventId) => {
    setSelectedEventId(eventId);
  }, []);

  const handleViewModeChange = useCallback((event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  }, []);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const clearSelectedEvent = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  const openViewSchedule = useCallback(() => {
    setViewScheduleOpen(true);
  }, []);

  const closeViewSchedule = useCallback(() => {
    setViewScheduleOpen(false);
  }, []);

  /**
   * Navigate to today and select the appropriate event based on current time:
   * - If current time is before first event: select first event
   * - If current time is after last event: select last event
   * - Otherwise: select the current/upcoming event
   * Also expands the day section and scrolls to the selected event
   *
   * @param {Array} events - Array of all events
   * @param {Array} eventsByDay - Events grouped by day (from AgendaTimeline)
   */
  const goToToday = useCallback((events = [], eventsByDay = []) => {
    const now = new Date();
    const todayStr = now.toDateString();

    // Set selected date to today
    setSelectedDate(now);

    // Find today's day section
    const todayDay = eventsByDay.find(day => day.date?.toDateString() === todayStr);

    // Get today's events sorted by start time
    const todaysEvents = events
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === todayStr;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (todaysEvents.length === 0) {
      // No events today, just expand and scroll to today's section
      setSelectedEventId(null);

      if (todayDay) {
        // Dispatch custom event to expand the day
        window.dispatchEvent(new CustomEvent('agenda:expandDay', {
          detail: { dayNumber: todayDay.dayNumber }
        }));

        setTimeout(() => {
          const todayElement = document.getElementById(`day-section-${todayDay.dayNumber}`);
          if (todayElement) {
            todayElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100);
      }
      return;
    }

    const currentTime = now.getTime();
    const firstEvent = todaysEvents[0];
    const lastEvent = todaysEvents[todaysEvents.length - 1];
    const firstEventStart = new Date(firstEvent.start).getTime();
    const lastEventEnd = new Date(lastEvent.end || lastEvent.start).getTime();

    let selectedEvent = null;

    if (currentTime < firstEventStart) {
      // Before first event - select first event
      selectedEvent = firstEvent;
    } else if (currentTime > lastEventEnd) {
      // After last event - select last event
      selectedEvent = lastEvent;
    } else {
      // Find current or next upcoming event
      selectedEvent = todaysEvents.find(event => {
        const eventEnd = new Date(event.end || event.start).getTime();
        // Select event if we're currently in it or it's the next one
        return currentTime <= eventEnd;
      }) || lastEvent;
    }

    // Select the event
    if (selectedEvent) {
      setSelectedEventId(selectedEvent.id);
    }

    // Expand today's section and scroll to the event
    if (todayDay) {
      // Dispatch custom event to expand the day
      window.dispatchEvent(new CustomEvent('agenda:expandDay', {
        detail: { dayNumber: todayDay.dayNumber, eventId: selectedEvent?.id }
      }));

      // Wait for expansion, then scroll to the event card
      setTimeout(() => {
        // First scroll to the day section
        const todayElement = document.getElementById(`day-section-${todayDay.dayNumber}`);
        if (todayElement) {
          todayElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }

        // Then scroll to the specific event card after a brief delay
        if (selectedEvent) {
          setTimeout(() => {
            const eventElement = document.getElementById(`event-card-${selectedEvent.id}`);
            if (eventElement) {
              eventElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }
          }, 300);
        }
      }, 100);
    }
  }, []);

  const agendaState = useMemo(() => ({
    selectedDate,
    selectedEventId,
    viewMode,
    viewScheduleOpen
  }), [selectedDate, selectedEventId, viewMode, viewScheduleOpen]);

  const agendaActions = useMemo(() => ({
    handleEventSelect,
    handleViewModeChange,
    handleDateSelect,
    clearSelectedEvent,
    openViewSchedule,
    closeViewSchedule,
    goToToday
  }), [
    handleEventSelect,
    handleViewModeChange,
    handleDateSelect,
    clearSelectedEvent,
    openViewSchedule,
    closeViewSchedule,
    goToToday
  ]);

  return {
    ...agendaState,
    ...agendaActions
  };
};