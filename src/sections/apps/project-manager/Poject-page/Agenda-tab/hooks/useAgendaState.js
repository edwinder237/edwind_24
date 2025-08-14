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
    closeViewSchedule
  }), [
    handleEventSelect,
    handleViewModeChange,
    handleDateSelect,
    clearSelectedEvent,
    openViewSchedule,
    closeViewSchedule
  ]);

  return {
    ...agendaState,
    ...agendaActions
  };
};