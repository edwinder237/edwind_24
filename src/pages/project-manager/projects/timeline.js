"use client"
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card,
  CardContent,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Slider,
  Paper,
  Divider,
  Tooltip,
  Fade,
  Grid,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  CalendarOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  UserOutlined,
  ExpandOutlined,
  CompressOutlined,
  TableOutlined,
  UnorderedListOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

// Project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import ReportCard from 'components/cards/statistics/ReportCard';
import { mockProjects, mockInstructors } from 'data/mockData';
import GanttChart from 'components/GanttChart/GanttChart';
import ProjectDetailsDialog from './ProjectDetailsDialog';
import CreateProjectDialog from './CreateProjectDialog';
import ProjectsMap from 'components/ProjectsMap';

// ==============================|| PROJECTS TIMELINE ||============================== //

const ProjectsTimeline = ({ googleMapsApiKey }) => {
  // State management
  const [projects, setProjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [scrollToToday, setScrollToToday] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: [],
    instructors: [],
    dateRange: {
      start: null,
      end: null
    },
    searchText: ''
  });

  // Zoom control for Gantt chart
  const [zoomLevel, setZoomLevel] = useState(100);

  // Load mock data on mount
  useEffect(() => {
    const loadData = () => {
      setProjects(mockProjects);
      setInstructors(mockInstructors);
      setLoading(false);
      // Auto-scroll to today on initial load
      setTimeout(() => {
        setScrollToToday(true);
        setTimeout(() => setScrollToToday(false), 100);
      }, 100);
    };

    // Simulate API call delay
    setTimeout(loadData, 500);
  }, []);

  // Filter projects based on current filters
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by status
    if (filters.status.length > 0) {
      result = result.filter(project => filters.status.includes(project.status));
    }

    // Filter by instructors
    if (filters.instructors.length > 0) {
      result = result.filter(project => 
        filters.instructors.includes(project.instructorId)
      );
    }

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      result = result.filter(project => {
        const projectStart = parseISO(project.startDate);
        const projectEnd = parseISO(project.endDate);
        const filterStart = filters.dateRange.start;
        const filterEnd = filters.dateRange.end;
        
        return (
          isWithinInterval(projectStart, { start: filterStart, end: filterEnd }) ||
          isWithinInterval(projectEnd, { start: filterStart, end: filterEnd }) ||
          (projectStart <= filterStart && projectEnd >= filterEnd)
        );
      });
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [projects, filters]);

  // Get available instructors for a date range
  const getAvailableInstructors = useCallback((startDate, endDate, excludeProjectId = null) => {
    const busyInstructorIds = projects
      .filter(p => p.id !== excludeProjectId)
      .filter(p => {
        const pStart = parseISO(p.startDate);
        const pEnd = parseISO(p.endDate);
        return (
          isWithinInterval(pStart, { start: startDate, end: endDate }) ||
          isWithinInterval(pEnd, { start: startDate, end: endDate }) ||
          (pStart <= startDate && pEnd >= endDate)
        );
      })
      .map(p => p.instructorId);

    return instructors.filter(inst => !busyInstructorIds.includes(inst.id));
  }, [projects, instructors]);

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode) {
      setViewMode(newMode);
    }
  };

  // Handle filter changes
  const handleStatusFilterChange = (event) => {
    setFilters(prev => ({
      ...prev,
      status: event.target.value
    }));
  };

  const handleInstructorFilterChange = (event) => {
    setFilters(prev => ({
      ...prev,
      instructors: event.target.value
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      searchText: event.target.value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      instructors: [],
      dateRange: { start: null, end: null },
      searchText: ''
    });
  };

  // Handle project actions
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setOpenProjectDialog(true);
  };

  const handleCreateProject = (newProject) => {
    const projectWithId = {
      ...newProject,
      id: Date.now().toString()
    };
    setProjects(prev => [...prev, projectWithId]);
    setOpenCreateDialog(false);
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    setOpenProjectDialog(false);
  };

  const handleDeleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setOpenProjectDialog(false);
  };

  const handleScrollToToday = () => {
    setScrollToToday(true);
    // Reset after scroll
    setTimeout(() => setScrollToToday(false), 100);
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      upcoming: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'error',
      onhold: 'default'
    };
    return statusColors[status] || 'default';
  };

  // Calculate project statistics
  const projectStats = useMemo(() => {
    const stats = {
      total: projects.length,
      upcoming: projects.filter(p => p.status === 'upcoming').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length
    };
    return stats;
  }, [projects]);

  return (
    <Page title="Projects Timeline">
      <Stack spacing={3}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Projects Timeline</Typography>
        </Box>

        {/* Statistics Cards */}
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <ReportCard
                primary={projectStats.total.toString()}
                secondary="Total Projects"
                iconPrimary={AppstoreOutlined}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ReportCard
                primary={projectStats.upcoming.toString()}
                secondary="Upcoming"
                iconPrimary={WarningOutlined}
                color="#ff9800"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ReportCard
                primary={projectStats.inProgress.toString()}
                secondary="In Progress"
                iconPrimary={SyncOutlined}
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ReportCard
                primary={projectStats.completed.toString()}
                secondary="Completed"
                iconPrimary={CheckCircleOutlined}
                color="#4caf50"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Controls Section */}
        <MainCard>
          <Stack spacing={2}>
            {/* View Mode and Filter Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1">View:</Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                >
                  <ToggleButton value="month">
                    <Tooltip title="Month View">
                      <AppstoreOutlined />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="week">
                    <Tooltip title="Week View">
                      <UnorderedListOutlined />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="day">
                    <Tooltip title="Day View">
                      <TableOutlined />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Zoom Control */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                  <Typography variant="caption">Zoom:</Typography>
                  <Slider
                    value={zoomLevel}
                    onChange={(e, val) => setZoomLevel(val)}
                    min={50}
                    max={150}
                    step={10}
                    sx={{ width: 120 }}
                  />
                  <Typography variant="caption">{zoomLevel}%</Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  startIcon={showFilters ? <CompressOutlined /> : <FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? 'contained' : 'outlined'}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlusOutlined />}
                  onClick={() => setOpenCreateDialog(true)}
                >
                  New Project
                </Button>
              </Stack>
            </Box>

            {/* Filters Section */}
            {showFilters && (
              <Fade in={showFilters}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    {/* Search Field */}
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search projects..."
                        value={filters.searchText}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: <SearchOutlined style={{ marginRight: 8 }} />
                        }}
                      />
                    </Grid>

                    {/* Status Filter */}
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          multiple
                          value={filters.status}
                          onChange={handleStatusFilterChange}
                          input={<OutlinedInput label="Status" />}
                          renderValue={(selected) => selected.join(', ')}
                        >
                          {['upcoming', 'in-progress', 'completed', 'cancelled', 'onhold'].map((status) => (
                            <MenuItem key={status} value={status}>
                              <Checkbox checked={filters.status.indexOf(status) > -1} />
                              <ListItemText primary={status.charAt(0).toUpperCase() + status.slice(1)} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Instructor Filter */}
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Instructor</InputLabel>
                        <Select
                          multiple
                          value={filters.instructors}
                          onChange={handleInstructorFilterChange}
                          input={<OutlinedInput label="Instructor" />}
                          renderValue={(selected) => 
                            selected.map(id => instructors.find(i => i.id === id)?.name).join(', ')
                          }
                        >
                          {instructors.map((instructor) => (
                            <MenuItem key={instructor.id} value={instructor.id}>
                              <Checkbox checked={filters.instructors.indexOf(instructor.id) > -1} />
                              <ListItemText primary={instructor.name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Date Range Filter */}
                    <Grid item xs={12} md={2}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Date"
                          value={filters.dateRange.start}
                          onChange={(date) => handleDateRangeChange('start', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="End Date"
                          value={filters.dateRange.end}
                          onChange={(date) => handleDateRangeChange('end', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    {/* Clear Filters Button */}
                    <Grid item xs={12} md={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleClearFilters}
                        sx={{ height: '40px' }}
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Fade>
            )}
          </Stack>
        </MainCard>

        {/* Gantt Chart Section */}
        <MainCard>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Timeline View
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClockCircleOutlined />}
                onClick={handleScrollToToday}
                sx={{ borderRadius: 1 }}
              >
                Today
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <GanttChart
              projects={filteredProjects}
              viewMode={viewMode}
              zoomLevel={zoomLevel}
              onProjectClick={handleProjectClick}
              instructors={instructors}
              scrollToToday={scrollToToday}
            />
          </Box>
        </MainCard>

        {/* Project Map and Details Section */}
        <MainCard>
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Project Locations & Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, height: 600 }}>
              {/* Map Section - Takes most of the width */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ProjectsMap 
                  projects={filteredProjects}
                  height={600}
                  showDirections={false}
                  googleMapsApiKey={googleMapsApiKey}
                />
              </Box>
              
              {/* Project List Section - Fixed width */}
              <Box sx={{ width: 300, flexShrink: 0 }}>
                <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                  <Stack spacing={2}>
                    {filteredProjects.map((project) => {
                      const instructor = instructors.find(i => i.id === project.instructorId);
                      const duration = differenceInDays(parseISO(project.endDate), parseISO(project.startDate));
                      
                      return (
                        <Paper
                          key={project.id}
                          elevation={1}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            borderRadius: 1,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                              bgcolor: 'action.hover'
                            }
                          }}
                          onClick={() => handleProjectClick(project)}
                        >
                          <Stack spacing={1.5}>
                            {/* Project Name */}
                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                              {project.name}
                            </Typography>
                            
                            {/* Status and Duration */}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={project.status}
                                color={getStatusColor(project.status)}
                                size="small"
                                sx={{ height: 20, borderRadius: 1 }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {duration} days
                              </Typography>
                            </Stack>
                            
                            {/* Date Range */}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CalendarOutlined style={{ fontSize: '16px', color: '#1976d2' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'text.primary' }}>
                                {format(parseISO(project.startDate), 'MMM dd, yyyy')} - {format(parseISO(project.endDate), 'MMM dd, yyyy')}
                              </Typography>
                            </Stack>
                            
                            {/* Instructor */}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <UserOutlined style={{ fontSize: '14px', color: '#666' }} />
                              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                {instructor?.name || 'Unassigned'}
                              </Typography>
                            </Stack>
                            
                            {/* Participants */}
                            {project.participants && project.participants.length > 0 && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
                                  {project.participants.map((p, idx) => (
                                    <Avatar key={idx}>
                                      {p.charAt(0)}
                                    </Avatar>
                                  ))}
                                </AvatarGroup>
                                {project.participants.length > 4 && (
                                  <Typography variant="caption" color="textSecondary">
                                    +{project.participants.length - 4} more
                                  </Typography>
                                )}
                              </Stack>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        </MainCard>

        {/* Dialogs */}
        <ProjectDetailsDialog
          open={openProjectDialog}
          project={selectedProject}
          instructors={instructors}
          getAvailableInstructors={getAvailableInstructors}
          onClose={() => setOpenProjectDialog(false)}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />

        <CreateProjectDialog
          open={openCreateDialog}
          instructors={instructors}
          getAvailableInstructors={getAvailableInstructors}
          onClose={() => setOpenCreateDialog(false)}
          onCreate={handleCreateProject}
        />
      </Stack>
    </Page>
  );
};

ProjectsTimeline.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getServerSideProps() {
  return {
    props: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null
    }
  };
}

export default ProjectsTimeline;