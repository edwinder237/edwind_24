/**
 * Calendar Store Test Panel - Phase 2 Validation
 *
 * This component provides a comprehensive test interface for the calendar entity store.
 * It displays the current state and allows testing of all calendar operations.
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// Import calendar selectors
import {
  selectViewMode,
  selectSelectedDate,
  selectViewRange,
  selectDisplayPreferences,
  selectCalendarFilters,
  selectActiveFilters,
  selectHasActiveFilters,
  selectSelectedEventIds,
  selectDraggedEvent,
  selectCalendarState,
  selectCalendarStats,
  selectCalendarLoading,
  selectCalendarError
} from '../../../../../../store/entities/calendarSlice';

// Import calendar actions
import {
  viewModeChanged,
  dateSelected,
  navigatedToToday,
  navigatedToPrevious,
  navigatedToNext,
  displayPreferencesUpdated,
  filtersSet,
  allFiltersCleared,
  eventSelected,
  allEventsDeselected,
  calendarReset
} from '../../../../../../store/entities/calendarSlice';

const CalendarStoreTestPanel = () => {
  console.log('🧪 [CalendarStoreTestPanel] Rendering test panel');

  const dispatch = useDispatch();

  // State selectors
  const viewMode = useSelector(state => selectViewMode(state));
  const selectedDate = useSelector(state => selectSelectedDate(state));
  const viewRange = useSelector(state => selectViewRange(state));
  const displayPreferences = useSelector(state => selectDisplayPreferences(state));
  const filters = useSelector(state => selectCalendarFilters(state));
  const activeFilters = useSelector(state => selectActiveFilters(state));
  const hasActiveFilters = useSelector(state => selectHasActiveFilters(state));
  const selectedEventIds = useSelector(state => selectSelectedEventIds(state));
  const draggedEvent = useSelector(state => selectDraggedEvent(state));
  const calendarState = useSelector(state => selectCalendarState(state));
  const stats = useSelector(state => selectCalendarStats(state));
  const isLoading = useSelector(state => selectCalendarLoading(state));
  const error = useSelector(state => selectCalendarError(state));

  // Local state for test controls
  const [testEventId, setTestEventId] = useState('');

  console.log('🧪 [CalendarStoreTestPanel] Store state:', {
    viewMode,
    selectedDate,
    viewRange,
    hasActiveFilters,
    selectedEventCount: selectedEventIds.length,
    stats
  });

  // Action handlers
  const handleViewModeChange = (event, newMode) => {
    if (newMode) {
      dispatch(viewModeChanged({ projectId: 'test-project', viewMode: newMode }));
    }
  };

  const handleNavigateToday = () => {
    dispatch(navigatedToToday());
  };

  const handleNavigatePrevious = () => {
    dispatch(navigatedToPrevious());
  };

  const handleNavigateNext = () => {
    dispatch(navigatedToNext());
  };

  const handleToggleWeekends = (event) => {
    dispatch(displayPreferencesUpdated({ showWeekends: event.target.checked }));
  };

  const handleClearFilters = () => {
    dispatch(allFiltersCleared());
  };

  const handleSelectEvent = () => {
    if (testEventId) {
      dispatch(eventSelected({ eventId: testEventId, multiSelect: false }));
    }
  };

  const handleDeselectAll = () => {
    dispatch(allEventsDeselected());
  };

  const handleResetCalendar = () => {
    dispatch(calendarReset());
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.lighter' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">
              🧪 Calendar Entity Store - Phase 2 Test Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Testing calendar CQRS entity store with real-time state monitoring
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleResetCalendar}
            >
              Reset Calendar
            </Button>
            <ReloadOutlined
              style={{ fontSize: 24, cursor: 'pointer' }}
              onClick={() => window.location.reload()}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                View Mode
              </Typography>
              <Typography variant="h3" sx={{ textTransform: 'capitalize' }}>
                {viewMode}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current calendar view
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Selected Events
              </Typography>
              <Typography variant="h3">
                {selectedEventIds.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Events selected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: hasActiveFilters ? 'warning.lighter' : 'inherit' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FilterOutlined style={{ fontSize: 24 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Filters
                  </Typography>
                  <Typography variant="h3">
                    {Object.keys(activeFilters).length}
                  </Typography>
                  <Typography variant="caption">
                    {hasActiveFilters ? 'Filters applied' : 'No filters'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: isLoading ? 'info.lighter' : 'success.lighter' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleOutlined style={{ fontSize: 24 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Typography variant="h6">
                    {isLoading ? 'Loading...' : 'Ready'}
                  </Typography>
                  {error && (
                    <Typography variant="caption" color="error">
                      {error}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Mode Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          View Mode Controls
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="agenda">Agenda</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="day">Day</ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Button
            size="small"
            startIcon={<LeftOutlined />}
            onClick={handleNavigatePrevious}
          >
            Previous
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleNavigateToday}
          >
            Today
          </Button>
          <Button
            size="small"
            endIcon={<RightOutlined />}
            onClick={handleNavigateNext}
          >
            Next
          </Button>
        </Stack>
      </Paper>

      {/* Current State Display */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Selected Date
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" color="primary">
                {formatDate(selectedDate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(selectedDate)}
              </Typography>
            </Box>

            {viewRange.start && viewRange.end && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  View Range:
                </Typography>
                <Typography variant="body2">
                  {formatDate(viewRange.start)} - {formatDate(viewRange.end)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Display Preferences
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={displayPreferences.showWeekends}
                    onChange={handleToggleWeekends}
                  />
                }
                label="Show Weekends"
              />
              <Typography variant="body2" color="text.secondary">
                Slot Duration: {displayPreferences.slotDuration}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time Range: {displayPreferences.slotMinTime} - {displayPreferences.slotMaxTime}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Event Selection Test */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Selection Test
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Event ID"
            size="small"
            value={testEventId}
            onChange={(e) => setTestEventId(e.target.value)}
            placeholder="Enter event ID to test selection"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSelectEvent}
            disabled={!testEventId}
          >
            Select Event
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAll}
            disabled={selectedEventIds.length === 0}
          >
            Deselect All
          </Button>
        </Stack>

        {selectedEventIds.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selected Event IDs:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {selectedEventIds.map(id => (
                <Chip key={id} label={id} size="small" color="primary" />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Filters Display */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Active Filters
          </Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </Button>
          )}
        </Stack>

        {hasActiveFilters ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Filter Type</TableCell>
                  <TableCell>Values</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(activeFilters).map(([key, values]) => (
                  <TableRow key={key}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{key}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {values.map((value, idx) => (
                          <Chip key={idx} label={value} size="small" />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No filters currently applied. Filters will appear here when set.
          </Alert>
        )}
      </Paper>

      {/* Complete State Dump */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Complete Calendar State
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 400,
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}
        >
          {JSON.stringify(calendarState, null, 2)}
        </Box>
      </Paper>

      {/* Debug Info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          Debug: Check browser console for detailed state logs
        </Typography>
      </Paper>
    </Box>
  );
};

export default CalendarStoreTestPanel;
