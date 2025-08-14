import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  ButtonGroup,
  Tooltip,
  IconButton,
  Stack,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Divider,
  Card,
  Avatar,
  LinearProgress,
  Badge,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  CalendarOutlined,
  FilterOutlined,
  FullscreenOutlined,
  SettingOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  getStatusColor,
  getStatusColorAlpha,
  calculateProgress,
  formatDuration,
  getTimelineIntervals,
  getProjectBarStyle,
  getColumnWidth,
  formatTimelineHeader,
  getProjectTypeIcon,
  isProjectOverdue,
  getProjectHealthStatus,
  exportGanttData,
  groupProjectsByCategory,
  getTimelineStats,
  getCurrentDateLinePosition
} from './GanttUtils';

// ==============================|| GANTT CHART COMPONENT ||============================== //

const GanttChart = ({ projects = [], onProjectUpdate, height = 600 }) => {
  const [viewMode, setViewMode] = useState('weeks'); // 'days', 'weeks', 'months'
  const [zoom, setZoom] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'category', 'status'
  const [showStats, setShowStats] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [timelineStart, setTimelineStart] = useState(null);
  const [timelineEnd, setTimelineEnd] = useState(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef(null);

  // Calculate timeline bounds from project dates
  useEffect(() => {
    if (projects.length === 0) return;
    
    const startDates = projects.map(p => p.startDate).filter(Boolean);
    const endDates = projects.map(p => p.endDate).filter(Boolean);
    
    if (startDates.length > 0 && endDates.length > 0) {
      const minStart = new Date(Math.min(...startDates.map(d => new Date(d))));
      const maxEnd = new Date(Math.max(...endDates.map(d => new Date(d))));
      
      // Add padding
      setTimelineStart(addDays(startOfWeek(minStart), -7));
      setTimelineEnd(addDays(endOfWeek(maxEnd), 14));
    }
  }, [projects]);

  // Generate timeline intervals
  const timelineIntervals = useMemo(() => {
    return getTimelineIntervals(timelineStart, timelineEnd, viewMode);
  }, [timelineStart, timelineEnd, viewMode]);

  // Calculate timeline width
  const timelineWidth = useMemo(() => {
    return timelineIntervals.length * getColumnWidth(viewMode, zoom);
  }, [timelineIntervals.length, viewMode, zoom]);

  // Filter projects based on status
  const filteredProjects = useMemo(() => {
    if (filterStatus === 'all') return projects;
    return projects.filter(project => project.projectStatus === filterStatus);
  }, [projects, filterStatus]);

  // Group projects if needed
  const groupedProjects = useMemo(() => {
    if (groupBy === 'none') return { 'All Projects': filteredProjects };
    if (groupBy === 'category') return groupProjectsByCategory(filteredProjects);
    if (groupBy === 'status') {
      return filteredProjects.reduce((groups, project) => {
        const status = project.projectStatus || 'unknown';
        if (!groups[status]) groups[status] = [];
        groups[status].push(project);
        return groups;
      }, {});
    }
    return { 'All Projects': filteredProjects };
  }, [filteredProjects, groupBy]);

  // Calculate statistics
  const stats = useMemo(() => getTimelineStats(filteredProjects), [filteredProjects]);

  // Calculate current date line position
  const currentDateLinePosition = useMemo(() => {
    return getCurrentDateLinePosition(timelineStart, timelineEnd);
  }, [timelineStart, timelineEnd]);

  // Handle scroll
  const handleScroll = (newScrollLeft) => {
    setScrollLeft(newScrollLeft);
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Reorder projects
    const newProjects = Array.from(filteredProjects);
    const [reorderedProject] = newProjects.splice(sourceIndex, 1);
    newProjects.splice(destinationIndex, 0, reorderedProject);
    
    if (onProjectUpdate) {
      onProjectUpdate(newProjects);
    }
  };

  // Handle zoom
  const handleZoom = (direction) => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  // Handle export
  const handleExport = () => {
    const data = exportGanttData(filteredProjects);
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-timeline-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportDialog(false);
  };

  if (!timelineStart || !timelineEnd || timelineIntervals.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No timeline data available. Please add projects with start and end dates.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height, display: 'flex', flexDirection: 'column' }}>
      {/* Header Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">Project Timeline</Typography>
            
            <ButtonGroup size="small">
              <Button 
                variant={viewMode === 'days' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('days')}
              >
                Days
              </Button>
              <Button 
                variant={viewMode === 'weeks' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('weeks')}
              >
                Weeks
              </Button>
              <Button 
                variant={viewMode === 'months' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('months')}
              >
                Months
              </Button>
            </ButtonGroup>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filterStatus}
                label="Status Filter"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="ongoing">
                  <Badge badgeContent={stats.ongoing} color="success" sx={{ mr: 1 }}>
                    Ongoing
                  </Badge>
                </MenuItem>
                <MenuItem value="completed">
                  <Badge badgeContent={stats.completed} color="primary" sx={{ mr: 1 }}>
                    Completed
                  </Badge>
                </MenuItem>
                <MenuItem value="pending">
                  <Badge badgeContent={stats.pending} color="warning" sx={{ mr: 1 }}>
                    Pending
                  </Badge>
                </MenuItem>
                <MenuItem value="cancelled">
                  <Badge badgeContent={stats.cancelled} color="error" sx={{ mr: 1 }}>
                    Cancelled
                  </Badge>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                label="Group By"
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="View Statistics">
              <IconButton onClick={() => setShowStats(true)} size="small">
                <InfoCircleOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Timeline">
              <IconButton onClick={() => setExportDialog(true)} size="small">
                <DownloadOutlined />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Tooltip title="Zoom In">
              <IconButton onClick={() => handleZoom('in')} size="small">
                <ZoomInOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={() => handleZoom('out')} size="small">
                <ZoomOutOutlined />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: '60px' }}>
              {Math.round(zoom * 100)}%
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Gantt Chart Container */}
      <Paper elevation={2} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box
          ref={scrollContainerRef}
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.100',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.400',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'grey.600',
              },
            }
          }}
          onScroll={(e) => setScrollLeft(e.target.scrollLeft)}
        >
          <Box sx={{ minWidth: 300 + timelineWidth, display: 'flex', flexDirection: 'column' }}>
            {/* Timeline Header */}
            <Box sx={{ 
              display: 'flex', 
              borderBottom: 1, 
              borderColor: 'divider', 
              backgroundColor: 'grey.50',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}>
              {/* Project Names Column */}
              <Box sx={{ 
                width: 300, 
                p: 2, 
                borderRight: 1, 
                borderColor: 'divider', 
                fontWeight: 'bold',
                flexShrink: 0,
                backgroundColor: 'grey.50'
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">
                    Projects ({filteredProjects.length})
                  </Typography>
                  {stats.overdue > 0 && (
                    <Tooltip title={`${stats.overdue} overdue project${stats.overdue !== 1 ? 's' : ''}`}>
                      <Chip 
                        icon={<WarningOutlined />}
                        label={stats.overdue}
                        color="error"
                        size="small"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </Box>
              
              {/* Timeline Header */}
              <Box sx={{ 
                display: 'flex',
                width: timelineWidth,
                backgroundColor: 'grey.50',
                position: 'relative'
              }}>
                {timelineIntervals.map((interval, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      width: getColumnWidth(viewMode, zoom),
                      p: 1,
                      borderRight: 1,
                      borderColor: 'divider',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}
                  >
                    {formatTimelineHeader(interval, viewMode)}
                  </Box>
                ))}
                
                {/* Current Date Line in Header */}
                {currentDateLinePosition !== null && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${currentDateLinePosition}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#f44336',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Project Rows */}
            {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
              <Box key={groupName}>
                {groupBy !== 'none' && (
                  <Box sx={{ 
                    display: 'flex',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ 
                      width: 300, 
                      p: 1, 
                      backgroundColor: 'primary.50', 
                      borderRight: 1, 
                      borderColor: 'divider',
                      flexShrink: 0
                    }}>
                      <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                        {groupName} ({groupProjects.length})
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: timelineWidth,
                      backgroundColor: 'primary.50'
                    }} />
                  </Box>
                )}
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`projects-${groupName}`}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {groupProjects.map((project, index) => {
                          const barStyle = getProjectBarStyle(project, timelineStart, timelineEnd);
                          const progress = calculateProgress(project);
                          const healthStatus = getProjectHealthStatus(project);
                          const isOverdue = isProjectOverdue(project);
                          
                          return (
                            <Draggable 
                              key={project.id} 
                              draggableId={project.id.toString()} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{
                                    display: 'flex',
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    minHeight: 60,
                                    backgroundColor: isOverdue ? 'error.50' : 'transparent',
                                    '&:hover': { 
                                      backgroundColor: isOverdue ? 'error.100' : 'grey.50' 
                                    },
                                    ...(snapshot.isDragging && { 
                                      backgroundColor: 'action.selected',
                                      boxShadow: 2 
                                    })
                                  }}
                                >
                                  {/* Project Info Column */}
                                  <Box 
                                    sx={{ 
                                      width: 300, 
                                      p: 2, 
                                      borderRight: 1, 
                                      borderColor: 'divider',
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexShrink: 0
                                    }}
                                    {...provided.dragHandleProps}
                                  >
                                    <Stack spacing={1} sx={{ width: '100%' }}>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">
                                          {getProjectTypeIcon(project.projectType)}
                                        </Typography>
                                        <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                                          {project.title}
                                        </Typography>
                                        <Chip 
                                          label={project.projectStatus} 
                                          size="small"
                                          sx={{ 
                                            backgroundColor: getStatusColor(project.projectStatus),
                                            color: 'white',
                                            fontSize: '0.65rem'
                                          }}
                                        />
                                        {isOverdue && (
                                          <Tooltip title="Project is overdue">
                                            <WarningOutlined sx={{ color: 'error.main', fontSize: '16px' }} />
                                          </Tooltip>
                                        )}
                                      </Stack>
                                      
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        {project.training_recipient && (
                                          <Chip 
                                            label={project.training_recipient.name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.65rem' }}
                                          />
                                        )}
                                        <Typography variant="caption" color="text.secondary">
                                          {progress}% • {healthStatus.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDuration(project.duration)}
                                        </Typography>
                                      </Stack>
                                    </Stack>
                                  </Box>

                                  {/* Timeline Column */}
                                  <Box sx={{ 
                                    width: timelineWidth,
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      width: timelineWidth,
                                      height: '100%'
                                    }}>
                                      {timelineIntervals.map((interval, idx) => (
                                        <Box 
                                          key={idx}
                                          sx={{ 
                                            width: getColumnWidth(viewMode, zoom),
                                            borderRight: 1,
                                            borderColor: 'divider',
                                            position: 'relative',
                                            flexShrink: 0
                                          }}
                                        />
                                      ))}
                                      
                                      {/* Current Date Line */}
                                      {currentDateLinePosition !== null && (
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            left: `${currentDateLinePosition}%`,
                                            top: 0,
                                            bottom: 0,
                                            width: '2px',
                                            backgroundColor: '#f44336',
                                            zIndex: 10,
                                            pointerEvents: 'none'
                                          }}
                                        />
                                      )}
                                      
                                      {/* Project Bar */}
                                      {barStyle && (
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            height: 24,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            boxShadow: 1,
                                            border: isOverdue ? '2px solid #f44336' : 'none',
                                            '&:hover': { 
                                              boxShadow: 2,
                                              transform: 'translateY(-50%) scale(1.02)'
                                            },
                                            ...barStyle
                                          }}
                                          onClick={() => setSelectedProject(project)}
                                        >
                                          {/* Progress Overlay */}
                                          <Box
                                            sx={{
                                              position: 'absolute',
                                              left: 0,
                                              top: 0,
                                              height: '100%',
                                              width: `${progress}%`,
                                              backgroundColor: 'rgba(255,255,255,0.3)',
                                              borderRadius: 'inherit'
                                            }}
                                          />
                                          
                                          {/* Project Title on Bar */}
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              color: 'white',
                                              fontWeight: 'bold',
                                              px: 1,
                                              position: 'relative',
                                              zIndex: 1,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            {project.title}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Project Details Modal/Tooltip */}
      {selectedProject && (
        <Paper 
          elevation={4}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 3,
            zIndex: 1300,
            maxWidth: 400,
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{selectedProject.title}</Typography>
              <IconButton onClick={() => setSelectedProject(null)} size="small">
                ×
              </IconButton>
            </Stack>
            
            <Divider />
            
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedProject.projectStatus}
              </Typography>
              <Typography variant="body2">
                <strong>Start:</strong> {selectedProject.startDate ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy') : 'Not set'}
              </Typography>
              <Typography variant="body2">
                <strong>End:</strong> {selectedProject.endDate ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy') : 'Not set'}
              </Typography>
              <Typography variant="body2">
                <strong>Duration:</strong> {selectedProject.duration || 'Not specified'}
              </Typography>
              {selectedProject.training_recipient && (
                <Typography variant="body2">
                  <strong>Client:</strong> {selectedProject.training_recipient.name}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Progress:</strong> {calculateProgress(selectedProject)}%
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={calculateProgress(selectedProject)} 
                sx={{ mt: 1 }}
              />
            </Stack>
            
            {selectedProject.summary && (
              <>
                <Divider />
                <Typography variant="body2">
                  <strong>Summary:</strong> {selectedProject.summary}
                </Typography>
              </>
            )}
          </Stack>
        </Paper>
      )}
      
      {/* Backdrop for modal */}
      {selectedProject && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1200
          }}
          onClick={() => setSelectedProject(null)}
        />
      )}

      {/* Statistics Dialog */}
      <Dialog open={showStats} onClose={() => setShowStats(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Timeline Statistics</Typography>
            <IconButton onClick={() => setShowStats(false)} size="small">
              ×
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="primary">{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Projects</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">{stats.averageProgress}%</Typography>
                <Typography variant="body2" color="text.secondary">Average Progress</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                <Typography variant="h4" color="success.main">{stats.ongoing}</Typography>
                <Typography variant="body2">Ongoing</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                <Typography variant="h4" color="info.main">{stats.completed}</Typography>
                <Typography variant="body2">Completed</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                <Typography variant="body2">Pending</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                <Typography variant="h4" color="error.main">{stats.overdue}</Typography>
                <Typography variant="body2">Overdue</Typography>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Timeline Data</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Export will include all filtered projects with their timeline data, status, and progress information.
            </Alert>
            <Typography variant="body2">
              <strong>Projects to export:</strong> {filteredProjects.length}
            </Typography>
            <Typography variant="body2">
              <strong>File format:</strong> CSV (Comma Separated Values)
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            startIcon={<DownloadOutlined />}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GanttChart;