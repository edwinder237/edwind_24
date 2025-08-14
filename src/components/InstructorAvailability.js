import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

// ==============================|| INSTRUCTOR AVAILABILITY COMPONENT ||============================== //

const InstructorAvailability = ({ 
  projectId, 
  selectedDate = new Date(),
  viewMode = 'week', // 'day', 'week', 'month'
  showFilters = true,
  height = 600 
}) => {
  const [instructors, setInstructors] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Fetch instructors and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch instructors
        const instructorsResponse = await fetch('/api/instructors/fetchInstructors');
        const instructorsData = await instructorsResponse.json();

        // Fetch events for the project
        const eventsResponse = await fetch('/api/projects/fetchEvents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId })
        });
        const eventsData = await eventsResponse.json();

        setInstructors(instructorsData || []);
        setEvents(eventsData?.events || []);
      } catch (err) {
        setError('Failed to load instructor availability data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Calculate time range based on view mode
  const timeRange = useMemo(() => {
    const start = viewMode === 'day' 
      ? startOfDay(currentDate)
      : viewMode === 'week'
      ? startOfWeek(currentDate)
      : startOfDay(currentDate);
    
    const end = viewMode === 'day'
      ? endOfDay(currentDate)
      : viewMode === 'week'
      ? endOfWeek(currentDate)
      : endOfDay(addDays(currentDate, 29)); // Month view

    return { start, end };
  }, [currentDate, viewMode]);

  // Calculate instructor availability and busy times
  const instructorAvailability = useMemo(() => {
    return instructors.map(instructor => {
      // Find events where this instructor is assigned
      const instructorEvents = events.filter(event => 
        event.event_instructors?.some(ei => ei.instructorId === instructor.id) &&
        isWithinInterval(parseISO(event.start), timeRange)
      );

      // Calculate busy hours
      const busyHours = instructorEvents.reduce((total, event) => {
        const eventStart = parseISO(event.start);
        const eventEnd = parseISO(event.end);
        const duration = (eventEnd - eventStart) / (1000 * 60 * 60); // Convert to hours
        return total + duration;
      }, 0);

      // Calculate availability status
      const maxWorkHours = viewMode === 'day' ? 8 : viewMode === 'week' ? 40 : 160; // Monthly estimate
      const availabilityPercentage = Math.max(0, ((maxWorkHours - busyHours) / maxWorkHours) * 100);
      
      let status = 'available';
      if (availabilityPercentage < 20) status = 'busy';
      else if (availabilityPercentage < 50) status = 'limited';

      return {
        ...instructor,
        events: instructorEvents,
        busyHours: Math.round(busyHours * 10) / 10,
        availableHours: Math.round((maxWorkHours - busyHours) * 10) / 10,
        availabilityPercentage: Math.round(availabilityPercentage),
        status,
        upcomingEvents: instructorEvents.filter(event => parseISO(event.start) > new Date()).length
      };
    });
  }, [instructors, events, timeRange, viewMode]);

  // Filter instructors
  const filteredInstructors = useMemo(() => {
    return instructorAvailability.filter(instructor => {
      if (statusFilter !== 'all' && instructor.status !== statusFilter) return false;
      if (typeFilter !== 'all' && instructor.instructorType !== typeFilter) return false;
      return true;
    });
  }, [instructorAvailability, statusFilter, typeFilter]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'limited': return 'warning';
      case 'busy': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircleOutlined />;
      case 'limited': return <ExclamationCircleOutlined />;
      case 'busy': return <ClockCircleOutlined />;
      default: return <UserOutlined />;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2">Loading instructor availability...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<ReloadOutlined />}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Instructor Availability
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(timeRange.start, 'MMM dd')} - {format(timeRange.end, 'MMM dd, yyyy')} • {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {showFilters && (
              <>
                <ButtonGroup size="small">
                  <Button 
                    variant={viewMode === 'day' ? 'contained' : 'outlined'}
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant={viewMode === 'week' ? 'contained' : 'outlined'}
                    onClick={() => setCurrentDate(startOfWeek(new Date()))}
                  >
                    This Week
                  </Button>
                </ButtonGroup>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="limited">Limited</MenuItem>
                    <MenuItem value="busy">Busy</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="main">Main</MenuItem>
                    <MenuItem value="assistant">Assistant</MenuItem>
                    <MenuItem value="guest">Guest</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <IconButton onClick={handleRefresh} size="small">
              <ReloadOutlined />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Instructor Cards */}
      <Grid container spacing={2}>
        {filteredInstructors.map((instructor) => (
          <Grid item xs={12} sm={6} md={4} key={instructor.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid`,
                borderColor: instructor.status === 'available' ? 'success.main' : 
                           instructor.status === 'limited' ? 'warning.main' : 
                           instructor.status === 'busy' ? 'error.main' : 'grey.300',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  {/* Instructor Header */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Badge
                      badgeContent={instructor.upcomingEvents}
                      color="primary"
                      invisible={instructor.upcomingEvents === 0}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getStatusColor(instructor.status)}.main`,
                          width: 48,
                          height: 48 
                        }}
                      >
                        {instructor.firstName?.[0]}{instructor.lastName?.[0]}
                      </Avatar>
                    </Badge>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {instructor.firstName} {instructor.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {instructor.email}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Status and Type */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      icon={getStatusIcon(instructor.status)}
                      label={instructor.status.charAt(0).toUpperCase() + instructor.status.slice(1)}
                      color={getStatusColor(instructor.status)}
                      size="small"
                      variant="filled"
                    />
                    <Chip
                      label={instructor.instructorType}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {/* Availability Bar */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Availability
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {instructor.availabilityPercentage}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={instructor.availabilityPercentage}
                      color={getStatusColor(instructor.status)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Hours Info */}
                  <Stack direction="row" justifyContent="space-between">
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Busy Hours
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {instructor.busyHours}h
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {instructor.availableHours}h
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Events
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {instructor.events.length}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Expertise */}
                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Expertise
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {instructor.expertise.slice(0, 3).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {instructor.expertise.length > 3 && (
                          <Tooltip title={instructor.expertise.slice(3).join(', ')}>
                            <Chip
                              label={`+${instructor.expertise.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredInstructors.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CalendarOutlined style={{ fontSize: '48px', color: '#1976d2', marginBottom: 16 }} />
          <Typography variant="h6" gutterBottom>
            No Instructors Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No instructors match the current filter criteria.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InstructorAvailability;