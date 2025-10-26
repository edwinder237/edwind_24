/**
 * Event Monitor Component
 * 
 * Development tool for monitoring domain events in real-time.
 * Shows event flow, performance metrics, and event history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Stack,
  Button,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Speed as SpeedIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useEventBus } from '../store/events/EventBus';
import { eventStore } from '../store/events/eventIntegration';

const EventMonitor = ({ position = 'bottom-right', defaultOpen = false, maxEvents = 50 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [metrics, setMetrics] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);
  
  const { useEventSubscription, getPerformanceMetrics } = useEventBus();

  // Subscribe to all events
  useEventSubscription('*', (event) => {
    if (!isPaused) {
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        return newEvents;
      });
    }
  }, [isPaused, maxEvents]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  const toggleDetails = useCallback((eventId) => {
    setShowDetails(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setShowDetails({});
  }, []);

  const exportEvents = useCallback(() => {
    const eventsJson = eventStore.exportEvents();
    const blob = new Blob([eventsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domain-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const filteredEvents = events.filter(event => 
    !filter || event.type.toLowerCase().includes(filter.toLowerCase())
  );

  const getEventColor = (eventType) => {
    if (eventType.includes('error') || eventType.includes('failed')) return 'error';
    if (eventType.includes('warning')) return 'warning';
    if (eventType.includes('success') || eventType.includes('completed')) return 'success';
    if (eventType.includes('started') || eventType.includes('created')) return 'info';
    return 'default';
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 9999,
      maxHeight: '60vh',
      width: '400px'
    };
    
    switch (position) {
      case 'top-left':
        return { ...base, top: 20, left: 20 };
      case 'top-right':
        return { ...base, top: 20, right: 20 };
      case 'bottom-left':
        return { ...base, bottom: 20, left: 20 };
      case 'bottom-right':
      default:
        return { ...base, bottom: 20, right: 20 };
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Paper
      elevation={8}
      sx={{
        ...getPositionStyles(),
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: 'primary.dark',
          color: 'primary.contrastText',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Badge badgeContent={filteredEvents.length} color="error" max={99}>
            <Typography variant="subtitle2" fontWeight={600}>
              Domain Events Monitor
            </Typography>
          </Badge>
        </Stack>
        
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={isPaused ? "Resume" : "Pause"}>
            <IconButton size="small" sx={{ color: 'inherit' }} onClick={(e) => {
              e.stopPropagation();
              setIsPaused(!isPaused);
            }}>
              {isPaused ? <PlayIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Events">
            <IconButton size="small" sx={{ color: 'inherit' }} onClick={(e) => {
              e.stopPropagation();
              exportEvents();
            }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Clear">
            <IconButton size="small" sx={{ color: 'inherit' }} onClick={(e) => {
              e.stopPropagation();
              clearEvents();
            }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ maxHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <Box sx={{ p: 1, backgroundColor: 'grey.100' }}>
            <Stack spacing={1}>
              <TextField
                size="small"
                placeholder="Filter events..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
              
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                }
                label={<Typography variant="caption">Auto-scroll</Typography>}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Performance Metrics */}
          {Object.keys(metrics).length > 0 && (
            <Box sx={{ p: 1, backgroundColor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Performance Metrics
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(metrics).slice(0, 3).map(([eventType, data]) => (
                  <Chip
                    key={eventType}
                    size="small"
                    icon={<SpeedIcon />}
                    label={`${eventType.split('.').pop()}: ${data.avgDuration.toFixed(1)}ms`}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Event List */}
          <List
            sx={{
              overflow: 'auto',
              flexGrow: 1,
              p: 0,
              backgroundColor: 'background.default'
            }}
          >
            {filteredEvents.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" align="center">
                      {isPaused ? 'Monitoring paused' : 'No events yet...'}
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              filteredEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem
                    button
                    onClick={() => toggleDetails(event.id)}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={event.type.split('.').slice(-1)[0]}
                            size="small"
                            color={getEventColor(event.type)}
                            variant="filled"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.metadata.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {event.metadata.source || 'unknown'} • {event.metadata.correlationId?.slice(0, 8)}
                        </Typography>
                      }
                    />
                    <IconButton size="small">
                      {showDetails[event.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </ListItem>
                  
                  <Collapse in={showDetails[event.id]}>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" component="pre" sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(event.payload, null, 2)}
                      </Typography>
                    </Box>
                  </Collapse>
                </React.Fragment>
              ))
            )}
          </List>

          {/* Status Bar */}
          {isPaused && (
            <Box sx={{ p: 0.5, backgroundColor: 'warning.light', textAlign: 'center' }}>
              <Typography variant="caption" color="warning.contrastText">
                PAUSED - Click play to resume monitoring
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default EventMonitor;