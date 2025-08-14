import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CalendarToday, 
  Download, 
  Print, 
  ViewList, 
  ViewModule,
  Group,
  Schedule,
  School,
  Email,
  Send
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSelector } from 'store';

const ScheduleExport = ({ projectEvents = [], projectTitle = "Project Schedule" }) => {
  const { singleProject: project } = useSelector((state) => state.projects);
  const [viewMode, setViewMode] = useState('timeline');
  const [dailyFocusData, setDailyFocusData] = useState({});
  const focusCache = useRef(new Map());
  
  // Calendar invite states
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // Fetch daily focus data
  useEffect(() => {
    if (project?.id && projectEvents.length > 0) {
      fetchAllDailyFocus();
    }
  }, [project?.id, projectEvents]);

  const fetchAllDailyFocus = async () => {
    if (!project?.id) return;
    
    const uniqueDates = [...new Set(projectEvents.map(event => {
      const eventDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      return format(eventDate, 'yyyy-MM-dd');
    }))];

    const focusData = {};
    
    for (const dateKey of uniqueDates) {
      const cacheKey = `${project.id}_${dateKey}`;
      if (focusCache.current.has(cacheKey)) {
        const cachedData = focusCache.current.get(cacheKey);
        if (cachedData?.focus) {
          focusData[dateKey] = cachedData.focus;
        }
      } else {
        try {
          const response = await fetch(`/api/projects/daily-focus?projectId=${project.id}&date=${dateKey}`);
          if (response.ok) {
            const data = await response.json();
            const focusText = data?.focus || '';
            focusCache.current.set(cacheKey, { focus: focusText });
            if (focusText) {
              focusData[dateKey] = focusText;
            }
          }
        } catch (error) {
          console.error('Error fetching daily focus:', error);
        }
      }
    }

    setDailyFocusData(focusData);
  };

  // Group events by date
  const groupedEvents = projectEvents.reduce((acc, event) => {
    const eventDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  const handleViewModeChange = (event, newMode) => {
    if (newMode) setViewMode(newMode);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calendar invite functions
  const handleOpenGroupSelection = () => {
    setSelectedGroups([]);
    setInviteResult(null);
    setShowGroupSelection(true);
  };

  const handleCloseGroupSelection = () => {
    setShowGroupSelection(false);
    setSelectedGroups([]);
    setInviteResult(null);
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSendCalendarInvites = async () => {
    if (selectedGroups.length === 0) {
      setInviteResult({ type: 'error', message: 'Please select at least one group to send invites to.' });
      return;
    }

    setSendingInvites(true);
    setInviteResult(null);

    try {
      const response = await fetch('/api/projects/send-calendar-invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          groupIds: selectedGroups,
          events: projectEvents,
          projectTitle,
          dailyFocusData
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setInviteResult({
          type: 'success',
          message: `Calendar invites sent successfully! ${result.summary?.successCount || 0} recipients received invites.`
        });
        // Auto close after 3 seconds
        setTimeout(() => {
          handleCloseGroupSelection();
        }, 3000);
      } else {
        setInviteResult({
          type: 'error',
          message: `Failed to send calendar invites: ${result.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error sending calendar invites:', error);
      setInviteResult({
        type: 'error',
        message: 'Failed to send calendar invites. Please try again.'
      });
    } finally {
      setSendingInvites(false);
    }
  };

  const getEventDisplayTitle = (event) => {
    const baseTitle = event.title || 'Untitled Event';
    const groups = event.event_groups || [];
    
    if (groups.length === 0) return baseTitle;
    
    const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
    if (groupNames.length === 0) return baseTitle;
    
    return `${baseTitle} (${groupNames.join(', ')})`;
  };

  const renderTimelineView = () => (
    <Box sx={{ p: 2 }}>
      {/* Project Groups Section */}
      {project?.groups && project.groups.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group color="primary" />
            Project Groups ({project.groups.length})
          </Typography>
          <Grid container spacing={2}>
            {project.groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: group.chipColor || '#1976d2'
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {group.groupName}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {group.participants?.length || 0} participant{(group.participants?.length || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3 }} />
        </Box>
      )}

      {/* Schedule Timeline */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule color="primary" />
        Schedule Timeline ({projectEvents.length} events)
      </Typography>
      
      {sortedDates.length > 0 ? (
        <Stack spacing={3}>
          {sortedDates.map((dateKey) => {
            const dayEvents = groupedEvents[dateKey];
            const eventDate = parseISO(dateKey + 'T12:00:00');
            const dailyFocus = dailyFocusData[dateKey];
            
            return (
              <Card key={dateKey} variant="outlined">
                {/* Date Header */}
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'primary.contrastText', 
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {format(eventDate, 'EEEE, MMMM d, yyyy', { locale: fr })}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Chip 
                    label={format(eventDate, 'd MMM', { locale: fr })} 
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'inherit',
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>

                {/* Daily Focus */}
                {dailyFocus && (
                  <Box sx={{ backgroundColor: 'info.light', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'info.dark' }}>
                      📋 Focus of the day:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'info.dark' }}>
                      {dailyFocus}
                    </Typography>
                  </Box>
                )}

                {/* Events */}
                <CardContent>
                  <Stack spacing={2}>
                    {dayEvents.map((event) => {
                      const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
                      const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
                      const startTime = format(startDate, 'HH:mm');
                      const endTime = endDate ? format(endDate, 'HH:mm') : '';
                      
                      const groups = event.event_groups || [];
                      const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
                      
                      return (
                        <Paper key={event.id} variant="outlined" sx={{ p: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {startTime}{endTime && ` - ${endTime}`}
                                </Typography>
                                <Typography variant="h6" color="primary.main">
                                  {getEventDisplayTitle(event)}
                                </Typography>
                              </Stack>
                              
                              {event.course && (
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                  <School fontSize="small" color="success" />
                                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                    {event.course.title}
                                  </Typography>
                                </Stack>
                              )}
                              
                              {groupNames.length > 0 && (
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {groupNames.map((groupName, index) => {
                                    const group = project?.groups?.find(g => g.groupName === groupName);
                                    return (
                                      <Chip 
                                        key={index} 
                                        label={groupName} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{
                                          borderColor: group?.chipColor || 'primary.main',
                                          color: group?.chipColor || 'primary.main'
                                        }}
                                      />
                                    );
                                  })}
                                </Stack>
                              )}
                            </Box>
                            
                            <Chip 
                              label={event.course ? 'Course' : 'Event'} 
                              color={event.course ? 'success' : 'warning'}
                              size="small"
                            />
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="h6" gutterBottom>
            📭 No scheduled events found
          </Typography>
          <Typography variant="body2">
            Events will appear here once they are added to the project schedule.
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderTableView = () => (
    <Box sx={{ p: 2 }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time</strong></TableCell>
              <TableCell><strong>Event</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Groups</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDates.map((dateKey) => {
              const dayEvents = groupedEvents[dateKey];
              const eventDate = parseISO(dateKey + 'T12:00:00');
              
              return dayEvents.map((event, index) => {
                const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
                const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
                const startTime = format(startDate, 'HH:mm');
                const endTime = endDate ? format(endDate, 'HH:mm') : '';
                
                const groups = event.event_groups || [];
                const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
                
                return (
                  <TableRow key={`${dateKey}-${event.id}`} hover>
                    <TableCell>
                      {index === 0 ? format(eventDate, 'MMM d, yyyy') : ''}
                    </TableCell>
                    <TableCell>
                      {startTime}{endTime && ` - ${endTime}`}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getEventDisplayTitle(event)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.course ? (
                        <Chip label={event.course.title} size="small" color="success" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {groupNames.length > 0 ? groupNames.join(', ') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.course ? 'Course' : 'Event'} 
                        size="small"
                        color={event.course ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {projectTitle}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="timeline">
                <ViewModule sx={{ mr: 0.5 }} />
                Timeline
              </ToggleButton>
              <ToggleButton value="table">
                <ViewList sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Email />}
              onClick={handleOpenGroupSelection}
              sx={{ mr: 1 }}
            >
              Send Invites
            </Button>
            
            <Tooltip title="Print Schedule">
              <IconButton onClick={handlePrint} size="small">
                <Print />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'timeline' ? renderTimelineView() : renderTableView()}
      </Box>

      {/* Group Selection Dialog */}
      <Dialog 
        open={showGroupSelection} 
        onClose={handleCloseGroupSelection} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Email color="primary" />
            <Typography variant="h6">Send Calendar Invites</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which groups should receive individual calendar invites for all scheduled events.
          </Typography>
          
          {inviteResult && (
            <Alert 
              severity={inviteResult.type} 
              sx={{ mb: 2 }}
              onClose={() => setInviteResult(null)}
            >
              {inviteResult.message}
            </Alert>
          )}
          
          {project?.groups && project.groups.length > 0 ? (
            <FormGroup>
              {project.groups.map((group) => (
                <Stack key={group.id} direction="row" alignItems="center" spacing={2} sx={{ mb: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: 'action.hover' } }}>
                  <Checkbox
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    color="primary"
                  />
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: group.chipColor || '#1976d2'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {group.groupName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.participants?.length || 0} participant{(group.participants?.length || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${projectEvents.filter(event => 
                      event.event_groups?.some(eg => eg.groupId === group.id)
                    ).length} events`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              ))}
            </FormGroup>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No groups found for this project.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseGroupSelection} disabled={sendingInvites}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendCalendarInvites}
            disabled={selectedGroups.length === 0 || sendingInvites}
            startIcon={sendingInvites ? <CircularProgress size={20} /> : <Send />}
          >
            {sendingInvites ? 'Sending...' : `Send Invites (${selectedGroups.length} groups)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleExport;