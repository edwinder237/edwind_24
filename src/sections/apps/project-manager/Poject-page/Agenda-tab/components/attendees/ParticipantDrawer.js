import React, { useState, useMemo, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Stack, Avatar, Divider, Chip,
  Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Paper, Grid, Tab, Tabs, Alert, Button, CircularProgress
} from '@mui/material';
import {
  Close, Email, Phone, School, Assignment, CheckCircle, RadioButtonUnchecked,
  AccessTime, CalendarMonth, Grade, EmojiEvents, Quiz, Event, SwapHoriz,
  Schedule, Group as GroupIcon, PlaylistAddCheck, Edit, Delete, Person
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

const generateMockLearningActivities = () => [
  { id: 1, title: 'Introduction to CRM Systems', completed: true, score: 95, duration: '45 min', date: '2024-01-15' },
  { id: 2, title: 'Customer Data Management', completed: true, score: 88, duration: '60 min', date: '2024-01-16' },
  { id: 3, title: 'Sales Pipeline Overview', completed: true, score: 92, duration: '30 min', date: '2024-01-17' },
  { id: 4, title: 'Lead Qualification Process', completed: false, score: null, duration: '45 min', date: null },
  { id: 5, title: 'Reporting and Analytics', completed: false, score: null, duration: '90 min', date: null },
  { id: 6, title: 'Integration with Email Systems', completed: false, score: null, duration: '45 min', date: null },
  { id: 7, title: 'Advanced Automation Features', completed: false, score: null, duration: '120 min', date: null },
  { id: 8, title: 'Best Practices Assessment', completed: false, score: null, duration: '60 min', date: null }
];

const generateMockAssessments = () => [
  { id: 1, title: 'Module 1 Quiz', type: 'Quiz', score: 92, maxScore: 100, status: 'Passed', date: '2024-01-16', attempts: 1 },
  { id: 2, title: 'Practical Exercise: Data Entry', type: 'Practical', score: 88, maxScore: 100, status: 'Passed', date: '2024-01-17', attempts: 2 },
  { id: 3, title: 'Module 2 Quiz', type: 'Quiz', score: 0, maxScore: 100, status: 'Pending', date: null, attempts: 0 },
  { id: 4, title: 'Final Assessment', type: 'Exam', score: 0, maxScore: 100, status: 'Not Started', date: null, attempts: 0 }
];

const generateMockAttendance = () => [
  { date: '2024-01-15', status: 'present', checkIn: '09:00 AM', checkOut: '05:00 PM' },
  { date: '2024-01-16', status: 'present', checkIn: '09:05 AM', checkOut: '05:15 PM' },
  { date: '2024-01-17', status: 'late', checkIn: '09:35 AM', checkOut: '05:00 PM' },
  { date: '2024-01-18', status: 'present', checkIn: '08:55 AM', checkOut: '05:10 PM' },
  { date: '2024-01-19', status: 'absent', checkIn: null, checkOut: null }
];


const ParticipantDrawer = ({ open, onClose, participant }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [courseChecklists, setCourseChecklists] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const { singleProject } = useSelector((state) => state.projects);
  const dispatch = useDispatch();

  const learningActivities = generateMockLearningActivities();
  const assessments = generateMockAssessments();
  const attendance = generateMockAttendance();

  const fetchChecklistItems = async (participantId) => {
    if (!participantId) return;
    
    setChecklistLoading(true);
    try {
      const response = await fetch(`/api/participants/checklist-items?participantId=${participantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourseChecklists(data);
      } else {
        console.error('Failed to fetch checklist items');
        setCourseChecklists([]);
      }
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      setCourseChecklists([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const toggleItemCompletion = async (itemId, currentStatus) => {
    if (updatingItems.has(itemId)) return;
    
    setUpdatingItems(prev => new Set([...prev, itemId]));
    
    try {
      const response = await fetch('/api/participants/checklist-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          checklistItemId: itemId,
          completed: !currentStatus
        })
      });

      if (response.ok) {
        setCourseChecklists(prevChecklists => 
          prevChecklists.map(checklist => ({
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    completed: !currentStatus,
                    completedAt: !currentStatus ? new Date().toISOString() : null 
                  }
                : item
            )
          }))
        );
        
        dispatch(openSnackbar({
          open: true,
          message: `Item ${!currentStatus ? 'completed' : 'uncompleted'} successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to update completion status',
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Error updating completion status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (participant?.id && activeTab === 3) {
      fetchChecklistItems(participant.id);
    }
  }, [participant?.id, activeTab]);

  useEffect(() => {
    if (!open) {
      setCourseChecklists([]);
      setUpdatingItems(new Set());
      setActiveTab(0);
    }
  }, [open]);

  const participantEvents = useMemo(() => {
    if (!singleProject?.events || !participant) return [];
    
    return singleProject.events.filter(event => {
      const isDirectAttendee = event.event_attendees?.some(attendee => 
        attendee.enrollee?.participant?.id === participant.id
      );
      
      const isInGroupAttendee = event.event_groups?.some(eventGroup => {
        const group = singleProject.groups?.find(g => g.id === eventGroup.groupId);
        return group?.participants?.some(gp => 
          gp.participant?.participant?.id === participant.id
        );
      });
      
      return isDirectAttendee || isInGroupAttendee;
    }).map(event => {
      const attendeeRecord = event.event_attendees?.find(attendee => 
        attendee.enrollee?.participant?.id === participant.id
      );
      
      const assignedGroup = event.event_groups?.find(eventGroup => {
        const group = singleProject.groups?.find(g => g.id === eventGroup.groupId);
        return group?.participants?.some(gp => 
          gp.participant?.participant?.id === participant.id
        );
      });
      
      return {
        ...event,
        attendanceStatus: attendeeRecord?.attendance_status || 'scheduled',
        assignmentType: attendeeRecord ? 'direct' : 'group',
        assignedGroupName: assignedGroup ? singleProject.groups?.find(g => g.id === assignedGroup.groupId)?.groupName : null
      };
    });
  }, [singleProject?.events, singleProject?.groups, participant]);

  const availableEvents = useMemo(() => {
    if (!singleProject?.events) return [];
    return singleProject.events.filter(event => 
      !participantEvents.some(pe => pe.id === event.id)
    );
  }, [singleProject?.events, participantEvents]);

  const completedActivities = learningActivities.filter(a => a.completed).length;
  const totalActivities = learningActivities.length;
  const progressPercentage = (completedActivities / totalActivities) * 100;
  
  const averageScore = learningActivities
    .filter(a => a.score !== null)
    .reduce((acc, curr, _, arr) => acc + curr.score / arr.length, 0);

  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    total: attendance.length
  };

  const attendanceRate = ((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue !== 3) {
      setCourseChecklists([]);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  if (!participant) return null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '80vh',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          p: 3,
          position: 'relative'
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            bgcolor: alpha('#fff', 0.1),
            '&:hover': { bgcolor: alpha('#fff', 0.2) }
          }}
        >
          <Close />
        </IconButton>

        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              bgcolor: 'white',
              color: theme.palette.primary.main,
              border: '3px solid white',
              boxShadow: theme.shadows[3]
            }}
          >
            {participant.firstName?.[0]}{participant.lastName?.[0]}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {participant.firstName} {participant.lastName}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<School />}
                label={participant.role?.title || participant.role || 'Participant'}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              {participant.email && (
                <Chip
                  icon={<Email />}
                  label={participant.email}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
              {participant.phone && (
                <Chip
                  icon={<Phone />}
                  label={participant.phone}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Learning Progress" icon={<School />} iconPosition="start" />
          <Tab label="Assessments" icon={<Quiz />} iconPosition="start" />
          <Tab label="Attendance" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="Course Checklists" icon={<PlaylistAddCheck />} iconPosition="start" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6">Learning Progress & Schedule</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${completedActivities}/${totalActivities} completed`} size="small" color="primary" />
                  <Chip label={`${participantEvents.length} events`} size="small" variant="outlined" />
                </Stack>
              </Stack>

              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progressPercentage.toFixed(1)}%
                  </Typography>
                </Stack>
                <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                  <Box
                    sx={{
                      width: `${progressPercentage}%`,
                      bgcolor: 'primary.main',
                      height: '100%',
                      borderRadius: 1
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Course Activities
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {learningActivities.slice(0, 5).map((activity) => (
                      <ListItem
                        key={activity.id}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: activity.completed ? alpha(theme.palette.success.main, 0.05) : 'background.default',
                          p: 1.5
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {activity.completed ? (
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          ) : (
                            <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: 20 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: activity.completed ? 400 : 500 }}>
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <AccessTime sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{activity.duration}</Typography>
                              </Stack>
                              {activity.completed && activity.score && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Grade sx={{ fontSize: 12, color: 'warning.main' }} />
                                  <Typography variant="caption" color="warning.main">
                                    {activity.score}%
                                  </Typography>
                                </Stack>
                              )}
                              {activity.date && (
                                <Typography variant="caption" color="text.secondary">
                                  {activity.date}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Assigned Events
                  </Typography>
                  {participantEvents.length > 0 ? (
                    <Stack spacing={1.5}>
                      {participantEvents.slice(0, 4).map((event) => (
                        <Box
                          key={event.id}
                          sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Event sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2" fontWeight={500}>
                                  {event.title}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={event.attendanceStatus}
                                  color={
                                    event.attendanceStatus === 'present' ? 'success' :
                                    event.attendanceStatus === 'late' ? 'warning' :
                                    event.attendanceStatus === 'absent' ? 'error' : 'info'
                                  }
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Stack>
                              
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(event.start).toLocaleDateString()} • {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Typography>
                                </Stack>
                                
                                {event.assignedGroupName && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <GroupIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {event.assignedGroupName}
                                    </Typography>
                                  </Stack>
                                )}
                                
                                <Chip
                                  size="small"
                                  label={event.assignmentType === 'direct' ? 'Direct' : 'Group'}
                                  variant="outlined"
                                  sx={{ height: 16, fontSize: '0.65rem' }}
                                />
                              </Stack>
                            </Box>
                            
                            <IconButton
                              size="small"
                              onClick={() => {
                                console.log('Available events to move to:', availableEvents);
                              }}
                              disabled={availableEvents.length === 0}
                              sx={{ ml: 1 }}
                            >
                              <SwapHoriz sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Event sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No events assigned
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Stack spacing={3}>
            {assessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>{assessment.title}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          size="small"
                          label={assessment.type}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={assessment.status}
                          color={assessment.status === 'Passed' ? 'success' : assessment.status === 'Pending' ? 'warning' : 'default'}
                        />
                      </Stack>
                      {assessment.date && (
                        <Typography variant="body2" color="text.secondary">
                          Completed: {assessment.date}
                        </Typography>
                      )}
                      {assessment.attempts > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Attempts: {assessment.attempts}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Typography variant="h3" color={assessment.score >= 80 ? 'success.main' : assessment.score >= 60 ? 'warning.main' : 'text.primary'}>
                        {assessment.score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / {assessment.maxScore}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={3}>
            {/* Attendance Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Attendance Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main">{attendanceStats.present}</Typography>
                      <Typography variant="body2" color="text.secondary">Present</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                      <Typography variant="h4" color="warning.main">{attendanceStats.late}</Typography>
                      <Typography variant="body2" color="text.secondary">Late</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
                      <Typography variant="h4" color="error.main">{attendanceStats.absent}</Typography>
                      <Typography variant="body2" color="text.secondary">Absent</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Attendance Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Attendance History</Typography>
                <List>
                  {attendance.map((record, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: alpha(theme.palette[getStatusColor(record.status)].main, 0.05)
                      }}
                    >
                      <ListItemText
                        primary={record.date}
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={record.status.toUpperCase()}
                              color={getStatusColor(record.status)}
                              sx={{ height: 20 }}
                            />
                            {record.checkIn && (
                              <Typography variant="caption" color="text.secondary">
                                Check-in: {record.checkIn}
                              </Typography>
                            )}
                            {record.checkOut && (
                              <Typography variant="caption" color="text.secondary">
                                Check-out: {record.checkOut}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={3}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Course Checklists
            </Typography>
            
            {checklistLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Stack alignItems="center" spacing={2}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading checklist items...
                  </Typography>
                </Stack>
              </Box>
            ) : courseChecklists.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PlaylistAddCheck sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Participant Checklists
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This participant doesn't have any participant-only checklist items from their enrolled courses.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {courseChecklists.map((checklist) => (
                  <Card key={checklist.courseId} sx={{ bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ pb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlaylistAddCheck sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {checklist.courseTitle}
                          </Typography>
                          <Chip 
                            label={`${checklist.items.filter(item => item.completed).length}/${checklist.items.length} items`}
                            size="small" 
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Stack>
                      </Stack>
                      
                      <Stack spacing={1}>
                        {checklist.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: item.completed ? alpha(theme.palette.success.main, 0.05) : 'background.paper',
                              border: 1,
                              borderColor: item.completed ? 'success.light' : 'divider',
                              '&:hover': {
                                bgcolor: item.completed ? alpha(theme.palette.success.main, 0.1) : 'action.hover'
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                              <IconButton
                                size="small"
                                onClick={() => toggleItemCompletion(item.id, item.completed)}
                                disabled={updatingItems.has(item.id)}
                                sx={{
                                  color: item.completed ? 'success.main' : 'grey.400',
                                  '&:hover': {
                                    bgcolor: item.completed ? 'success.lighter' : 'action.hover'
                                  }
                                }}
                              >
                                {updatingItems.has(item.id) ? (
                                  <CircularProgress size={18} />
                                ) : item.completed ? (
                                  <CheckCircle sx={{ fontSize: 18 }} />
                                ) : (
                                  <RadioButtonUnchecked sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                              
                              <Box flex={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: item.completed ? 400 : 500,
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                      color: item.completed ? 'text.secondary' : 'text.primary'
                                    }}
                                  >
                                    {item.title}
                                  </Typography>
                                  {item.participantOnly && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 1,
                                        bgcolor: 'info.lighter',
                                        border: '1px solid',
                                        borderColor: 'info.light'
                                      }}
                                    >
                                      <Person sx={{ fontSize: 12, color: 'info.main' }} />
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          fontSize: '0.6rem', 
                                          color: 'info.main', 
                                          fontWeight: 600,
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.5
                                        }}
                                      >
                                        Participant Only
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={item.category}
                                    size="small"
                                    color="default"
                                    sx={{ height: 16, fontSize: '0.65rem' }}
                                  />
                                  {item.priority && (
                                    <Chip
                                      label={item.priority}
                                      size="small"
                                      color={
                                        item.priority === 'high' ? 'error' :
                                        item.priority === 'medium' ? 'warning' : 'success'
                                      }
                                      sx={{ height: 16, fontSize: '0.65rem' }}
                                    />
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(item.createdAt).toLocaleDateString()}
                                  </Typography>
                                  {item.completed && item.completedAt && (
                                    <Typography variant="caption" color="success.main">
                                      Completed: {new Date(item.completedAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}

      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button variant="contained" startIcon={<Assignment />}>
            Generate Report
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ParticipantDrawer;