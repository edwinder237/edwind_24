import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  UserOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ProjectOutlined,
  FileTextOutlined,
  TeamOutlined,
  LockOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  MinusCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';
import axios from 'utils/axios';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';

// ==============================|| PARTICIPANT DETAIL PAGE ||============================== //

const ParticipantDetail = () => {
  const router = useRouter();
  const { participantId, from, recipientId } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState({
    participant: null,
    projects: [],
    courses: [],
    curriculums: [],
    events: [],
    assessments: [],
    checklistItems: [],
    stats: null
  });

  // Fetch participant data
  useEffect(() => {
    if (participantId) {
      fetchParticipantData();
    }
  }, [participantId]);

  const fetchParticipantData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/participants/fetchSingle?participantId=${participantId}`);
      if (response.data.success) {
        setData({
          participant: response.data.participant,
          projects: response.data.projects || [],
          courses: response.data.courses || [],
          curriculums: response.data.curriculums || [],
          events: response.data.events || [],
          assessments: response.data.assessments || [],
          checklistItems: response.data.checklistItems || [],
          stats: response.data.stats
        });
      } else {
        setError(response.data.message || 'Failed to fetch participant data');
      }
    } catch (err) {
      console.error('Error fetching participant:', err);
      setError(err.response?.data?.message || 'Failed to fetch participant data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBackNavigation = () => {
    if (from === 'training-recipient' && recipientId) {
      router.push(`/project-manager/training-recipients/${recipientId}`);
    } else {
      router.back();
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'pending': return 'warning';
      case 'suspended': case 'terminated': return 'error';
      case 'loa': case 'pto': return 'info';
      default: return 'primary';
    }
  };

  const getAttendanceColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'excused': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Page title="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading participant details...</Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  if (error || !data.participant) {
    return (
      <Page title="Access Denied">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            p: 3
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'error.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}
          >
            <LockOutlined style={{ fontSize: 48, color: '#f44336' }} />
          </Box>
          <Typography variant="h3" gutterBottom>
            {error || 'Participant Not Found'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            The participant you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBackNavigation}
            startIcon={<ArrowLeftOutlined />}
          >
            Go Back
          </Button>
        </Box>
      </Page>
    );
  }

  const { participant, projects, courses, curriculums, events, assessments, checklistItems, stats } = data;
  const fullName = `${participant.firstName} ${participant.middleName || ''} ${participant.lastName}`.trim().replace(/\s+/g, ' ');

  return (
    <Page
      title={fullName}
      breadcrumbs={[
        { title: 'Home', to: '/' },
        ...(from === 'training-recipient' && recipientId
          ? [{ title: 'Training Recipients', to: '/project-manager/training-recipients' },
             { title: participant.trainingRecipient?.name || 'Recipient', to: `/project-manager/training-recipients/${recipientId}` }]
          : []),
        { title: fullName }
      ]}
    >
      {/* Header Section */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="flex-start">
          <Avatar
            src={participant.profileImg}
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {participant.firstName?.[0]}{participant.lastName?.[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="h3">{fullName}</Typography>
                  {participant.status && (
                    <Chip
                      label={participant.status}
                      size="small"
                      color={getStatusColor(participant.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  )}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MailOutlined style={{ fontSize: 14 }} />
                    <Typography variant="body2">{participant.email}</Typography>
                  </Box>
                  {participant.role && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TeamOutlined style={{ fontSize: 14 }} />
                      <Typography variant="body2">{participant.role.title}</Typography>
                    </Box>
                  )}
                  {participant.department && (
                    <Typography variant="body2">• {participant.department}</Typography>
                  )}
                </Stack>

                {participant.trainingRecipient && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {participant.trainingRecipient.name}
                    {participant.trainingRecipient.industry && ` • ${participant.trainingRecipient.industry}`}
                  </Typography>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip
                    icon={<ProjectOutlined />}
                    label={`${stats?.activeProjects || 0} Active Projects`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<BookOutlined />}
                    label={`${stats?.completedCourses || 0}/${stats?.totalCourses || 0} Courses`}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<TrophyOutlined />}
                    label={`${stats?.averageScore || 0}% Avg Score`}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>

              <Tooltip title="Go Back">
                <IconButton onClick={handleBackNavigation} color="default">
                  <ArrowLeftOutlined />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>
      </MainCard>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="participant detail tabs">
          <Tab label="Overview" />
          <Tab label="Courses" />
          <Tab label="Curriculums" />
          <Tab label="Events" />
          <Tab label="Assessments" />
          <Tab label="Checklists" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4">{stats?.totalProjects || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Projects</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                        <ProjectOutlined />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4">{stats?.completedCourses || 0}/{stats?.totalCourses || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Courses Completed</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                        <BookOutlined />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4">{stats?.attendedEvents || 0}/{stats?.totalEvents || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Events Attended</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
                        <CalendarOutlined />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4">{stats?.averageScore || 0}%</Typography>
                        <Typography variant="body2" color="text.secondary">Average Score</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
                        <TrophyOutlined />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <MainCard title="Personal Information">
              <List>
                <ListItem>
                  <ListItemText primary="Full Name" secondary={fullName} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Email" secondary={participant.email} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Status" secondary={participant.status || 'Not Set'} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Type" secondary={participant.type || 'Not Set'} />
                </ListItem>
                {participant.department && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText primary="Department" secondary={participant.department} />
                    </ListItem>
                  </>
                )}
                {participant.role && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText primary="Role" secondary={participant.role.title} />
                    </ListItem>
                  </>
                )}
              </List>
            </MainCard>
          </Grid>

          {/* Projects Summary */}
          <Grid item xs={12} md={6}>
            <MainCard title={`Projects (${projects.length})`}>
              {projects.length > 0 ? (
                <List>
                  {projects.slice(0, 5).map((project, index) => (
                    <React.Fragment key={project.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          <Chip
                            label={project.enrollmentStatus}
                            size="small"
                            color={project.enrollmentStatus === 'active' ? 'success' : 'default'}
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                            <ProjectOutlined />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {project.status} • {project.groups.length} group(s)
                              </Typography>
                              {project.groups.length > 0 && (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                  {project.groups.map(g => (
                                    <Chip
                                      key={g.id}
                                      label={g.name}
                                      size="small"
                                      sx={{
                                        bgcolor: g.color || 'grey.300',
                                        color: 'white',
                                        height: 20,
                                        fontSize: '0.65rem'
                                      }}
                                    />
                                  ))}
                                </Stack>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No projects assigned</Typography>
                </Box>
              )}
            </MainCard>
          </Grid>

          {/* Tool Access */}
          {participant.toolAccesses && participant.toolAccesses.length > 0 && (
            <Grid item xs={12}>
              <MainCard title="Tool Access">
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tool</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>URL</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participant.toolAccesses.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <ToolOutlined />
                              <span>{tool.tool}</span>
                            </Stack>
                          </TableCell>
                          <TableCell>{tool.toolType || '-'}</TableCell>
                          <TableCell>{tool.username || '-'}</TableCell>
                          <TableCell>
                            {tool.toolUrl ? (
                              <Button
                                size="small"
                                href={tool.toolUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open
                              </Button>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>
          )}

          {/* Notes */}
          {participant.notes && (
            <Grid item xs={12}>
              <MainCard title="Notes">
                <Typography variant="body2">{participant.notes}</Typography>
              </MainCard>
            </Grid>
          )}
        </Grid>
      )}

      {/* Courses Tab */}
      {tabValue === 1 && (
        <MainCard title={`Courses (${courses.length})`}>
          {courses.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{course.title}</Typography>
                      </TableCell>
                      <TableCell>{course.type || '-'}</TableCell>
                      <TableCell>
                        {course.level && (
                          <Chip label={course.level} size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{course.duration ? `${course.duration} min` : '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {course.projectTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {course.completed ? (
                          <Chip
                            icon={<CheckCircleOutlined />}
                            label="Completed"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            icon={<ClockCircleOutlined />}
                            label="In Progress"
                            size="small"
                            color="warning"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>No Courses Found</Typography>
              <Typography variant="body2" color="text.secondary">
                This participant is not enrolled in any courses yet.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}

      {/* Curriculums Tab */}
      {tabValue === 2 && (
        <MainCard title={`Curriculums (${curriculums.length})`}>
          {curriculums.length > 0 ? (
            <Grid container spacing={2}>
              {curriculums.map((curriculum) => (
                <Grid item xs={12} md={6} key={curriculum.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h6">{curriculum.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {curriculum.description || 'No description'}
                          </Typography>
                        </Box>

                        <Box>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {curriculum.completedCourses}/{curriculum.totalCourses} courses ({curriculum.progress}%)
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={curriculum.progress}
                            color={curriculum.progress === 100 ? 'success' : 'primary'}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          Project: {curriculum.projectTitle}
                        </Typography>

                        {curriculum.courses && curriculum.courses.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Courses:</Typography>
                            <Stack spacing={0.5}>
                              {curriculum.courses.slice(0, 5).map((course) => {
                                const isCompleted = courses.find(c => c.id === course.id)?.completed;
                                return (
                                  <Stack key={course.id} direction="row" alignItems="center" spacing={1}>
                                    {isCompleted ? (
                                      <CheckOutlined style={{ color: '#4caf50', fontSize: 14 }} />
                                    ) : (
                                      <MinusCircleOutlined style={{ color: '#999', fontSize: 14 }} />
                                    )}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        color: isCompleted ? 'text.secondary' : 'text.primary'
                                      }}
                                    >
                                      {course.title}
                                    </Typography>
                                  </Stack>
                                );
                              })}
                              {curriculum.courses.length > 5 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{curriculum.courses.length - 5} more courses
                                </Typography>
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
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>No Curriculums Found</Typography>
              <Typography variant="body2" color="text.secondary">
                This participant is not assigned to any curriculums yet.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}

      {/* Events Tab */}
      {tabValue === 3 && (
        <MainCard title={`Events (${events.length})`}>
          {events.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Attendance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{event.title}</Typography>
                        {event.projectTitle && (
                          <Typography variant="caption" color="text.secondary">
                            {event.projectTitle}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.eventType && (
                          <Chip label={event.eventType} size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{event.courseTitle || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDateTime(event.start)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          to {formatDateTime(event.end)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.attendanceStatus || 'Scheduled'}
                          size="small"
                          color={getAttendanceColor(event.attendanceStatus)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>No Events Found</Typography>
              <Typography variant="body2" color="text.secondary">
                This participant is not scheduled for any events yet.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}

      {/* Assessments Tab */}
      {tabValue === 4 && (
        <MainCard title={`Assessments (${assessments.length})`}>
          {assessments.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Assessment</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Attempt</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Instructor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{assessment.assessmentTitle}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {assessment.courseTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {assessment.scoreEarned}/{assessment.scoreMaximum} ({assessment.scorePercentage}%)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {assessment.passed ? (
                          <Chip
                            icon={<CheckCircleOutlined />}
                            label="Passed"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            icon={<CloseCircleOutlined />}
                            label="Failed"
                            size="small"
                            color="error"
                          />
                        )}
                      </TableCell>
                      <TableCell>#{assessment.attemptNumber}</TableCell>
                      <TableCell>{formatDate(assessment.assessmentDate)}</TableCell>
                      <TableCell>{assessment.instructorName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <TrophyOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>No Assessments Found</Typography>
              <Typography variant="body2" color="text.secondary">
                This participant hasn't taken any assessments yet.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}

      {/* Checklists Tab */}
      {tabValue === 5 && (
        <MainCard title={`Checklist Items (${checklistItems.length})`}>
          {checklistItems.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checklistItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{item.title}</Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.courseTitle || '-'}</TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.projectTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.completed ? (
                          <Chip
                            icon={<CheckCircleOutlined />}
                            label="Completed"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            icon={<ClockCircleOutlined />}
                            label="Pending"
                            size="small"
                            color="warning"
                          />
                        )}
                      </TableCell>
                      <TableCell>{item.completedAt ? formatDate(item.completedAt) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>No Checklist Items Found</Typography>
              <Typography variant="body2" color="text.secondary">
                This participant doesn't have any assigned checklist items yet.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}
    </Page>
  );
};

ParticipantDetail.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ParticipantDetail;
