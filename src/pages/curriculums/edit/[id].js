import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack,
  Button,
  Chip,
  Divider,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  IconButton,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
  alpha,
  Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  Support as SupportIcon,
  School as SchoolIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  Remove as RemoveIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Quiz as QuizIcon,
  Groups as GroupsIcon,
  Folder as FolderIcon,
  Forum as ForumIcon,
  Science as ScienceIcon,
  Slideshow as SlideshowIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  Search as SearchIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Warning as AlertIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import { 
  fetchTrainingPlan, 
  createTrainingPlan, 
  updateTrainingPlan 
} from 'store/reducers/courses';

// Custom hooks and utilities
import { useModuleUsage } from '../../../hooks/useModuleUsage';
import { useTrainingPlan } from '../../../hooks/useTrainingPlan';
import { createModuleOptions, createSupportActivityOptions, formatDuration } from '../../../utils/moduleUtils';
import { ModuleSelector, SupportActivitySelector, ModuleDropdownCell } from '../../../components/ModuleSelector';
import SupportActivitiesManager from 'components/curriculum/SupportActivitiesManager';
import MainCard from 'components/MainCard';
import Layout from 'layout';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`curriculum-tabpanel-${index}`}
      aria-labelledby={`curriculum-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const CurriculumEditPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const [curriculum, setCurriculum] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Training Plan states
  const [trainingDays, setTrainingDays] = useState(5);
  const [trainingPlan, setTrainingPlan] = useState([]);
  const [openModuleSelectors, setOpenModuleSelectors] = useState({});
  const [openSupportActivitySelectors, setOpenSupportActivitySelectors] = useState({});
  const [existingTrainingPlanId, setExistingTrainingPlanId] = useState(null);
  const [savingTrainingPlan, setSavingTrainingPlan] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Redux selectors
  const { currentTrainingPlan, trainingPlanLoading } = useSelector((state) => state.courses);
  
  // Training plan operations hook
  const {
    updateModule,
    moveModuleUp,
    moveModuleDown,
    addModule,
    removeModule,
    updateModuleFromSelection,
    updateSupportActivityFromSelection
  } = useTrainingPlan(trainingPlan, setTrainingPlan, setHasUnsavedChanges);
  
  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'course', 'module', 'activity'
  
  // Bulk selection helpers
  const handleRowSelect = (dayIndex, moduleIndex, isSelected) => {
    const rowId = `${dayIndex}-${moduleIndex}`;
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };
  
  const handleSelectAll = (dayIndex, isSelected) => {
    const dayModules = trainingPlan[dayIndex]?.modules || [];
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      dayModules.forEach((_, moduleIndex) => {
        const rowId = `${dayIndex}-${moduleIndex}`;
        if (isSelected) {
          newSet.add(rowId);
        } else {
          newSet.delete(rowId);
        }
      });
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };
  
  const handleBulkDelete = () => {
    // Sort selected rows by day and module index (reverse order to avoid index issues)
    const sortedRows = Array.from(selectedRows)
      .map(rowId => {
        const [dayIndex, moduleIndex] = rowId.split('-').map(Number);
        return { dayIndex, moduleIndex };
      })
      .sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return b.dayIndex - a.dayIndex;
        return b.moduleIndex - a.moduleIndex;
      });
    
    // Remove modules
    const updatedPlan = [...trainingPlan];
    sortedRows.forEach(({ dayIndex, moduleIndex }) => {
      if (updatedPlan[dayIndex]?.modules?.[moduleIndex]) {
        updatedPlan[dayIndex].modules.splice(moduleIndex, 1);
      }
    });
    
    setTrainingPlan(updatedPlan);
    setSelectedRows(new Set());
    setShowBulkActions(false);
  };

  // Fetch curriculum details
  const fetchCurriculum = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/curriculums/fetchSingle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumId: parseInt(id) })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurriculum(result.curriculum);
      } else {
        throw new Error(result.message || 'Failed to fetch curriculum');
      }
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch curriculum details',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/fetchCourses');
      const data = await response.json();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Add courses to curriculum
  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select at least one course',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    try {
      setActionLoading(true);
      
      await Promise.all(
        selectedCourses.map(courseId =>
          fetch('/api/curriculums/add-course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              curriculumId: parseInt(id),
              courseId
            })
          })
        )
      );

      dispatch(openSnackbar({
        open: true,
        message: 'Courses added successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      setAddCourseDialogOpen(false);
      setSelectedCourses([]);
      fetchCurriculum();
    } catch (error) {
      console.error('Error adding courses:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to add courses',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Remove course from curriculum
  const handleRemoveCourse = async (courseId) => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/curriculums/remove-course', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId: parseInt(id),
          courseId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Course removed successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        fetchCurriculum();
      } else {
        throw new Error(result.message || 'Failed to remove course');
      }
    } catch (error) {
      console.error('Error removing course:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to remove course',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => () => router.back());
      setShowUnsavedDialog(true);
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Initialize training plan when days change
  const initializeTrainingPlan = (days) => {
    const newPlan = [];
    for (let i = 0; i < days; i++) {
      const existingDay = trainingPlan[i] || {};
      newPlan.push({
        day: i + 1,
        modules: existingDay.modules || [],
        objectives: existingDay.objectives || '',
        trainer: existingDay.trainer || '',
        resources: existingDay.resources || '',
        notes: existingDay.notes || '',
        sequences: existingDay.sequences || []
      });
    }
    setTrainingPlan(newPlan);
  };

  // Handle training days change
  const handleTrainingDaysChange = (event) => {
    const days = parseInt(event.target.value) || 1;
    setTrainingDays(days);
    initializeTrainingPlan(days);
    setHasUnsavedChanges(true);
  };

  // Update a specific day's field
  const updateDayField = (dayIndex, field, value) => {
    const updatedPlan = [...trainingPlan];
    updatedPlan[dayIndex] = {
      ...updatedPlan[dayIndex],
      [field]: value
    };
    setTrainingPlan(updatedPlan);
  };

  // Add module to a specific day
  const addModuleToDay = (dayIndex, module) => {
    const updatedPlan = [...trainingPlan];
    if (!updatedPlan[dayIndex].modules) {
      updatedPlan[dayIndex].modules = [];
    }
    
    updatedPlan[dayIndex].modules.push({
      ...module
    });
    setTrainingPlan(updatedPlan);
  };

  // Add support activity to a specific day
  const addSupportActivityToDay = (dayIndex) => {
    const updatedPlan = [...trainingPlan];
    if (!updatedPlan[dayIndex].modules) {
      updatedPlan[dayIndex].modules = [];
    }
    
    updatedPlan[dayIndex].modules.push({
      isSupportActivity: true,
      title: 'Support Activity',
      duration: 30, // Default 30 minutes for support activities
      description: ''
    });
    setTrainingPlan(updatedPlan);
  };
  
  // Update module duration
  const updateModuleDuration = (dayIndex, moduleIndex, duration) => {
    const updatedPlan = [...trainingPlan];
    if (updatedPlan[dayIndex].modules[moduleIndex]) {
      updatedPlan[dayIndex].modules[moduleIndex].duration = duration;
    }
    setTrainingPlan(updatedPlan);
  };

  // Legacy function alias for compatibility
  const removeModuleFromDay = useCallback((dayIndex, moduleIndex) => {
    removeModule(dayIndex, moduleIndex);
  }, [removeModule]);

  // Memoized module usage detection hook
  const getModuleUsage = useModuleUsage(trainingPlan);

  // Memoized module options creation
  const moduleOptions = useMemo(() => {
    if (!curriculum?.curriculum_courses) return [];
    return createModuleOptions(curriculum.curriculum_courses, getModuleUsage);
  }, [curriculum?.curriculum_courses, getModuleUsage]);

  // Memoized support activity options creation
  const supportActivityOptions = useMemo(() => {
    if (!curriculum?.curriculum_courses) return [];
    return createSupportActivityOptions(curriculum.curriculum_courses);
  }, [curriculum?.curriculum_courses]);

  useEffect(() => {
    fetchCurriculum();
    fetchCourses();
    initializeTrainingPlan(trainingDays);
    // Fetch existing training plan if exists
    if (id) {
      fetchExistingTrainingPlan();
    }
  }, [id]);

  // Warn user about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handleRouteChange = (url) => {
      if (hasUnsavedChanges) {
        router.events.emit('routeChangeError');
        setPendingNavigation(() => () => router.push(url));
        setShowUnsavedDialog(true);
        throw 'Route change aborted - showing confirmation dialog';
      }
    };

    // Browser refresh/close warning
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Next.js route change warning
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [hasUnsavedChanges, router]);
  
  const fetchExistingTrainingPlan = async () => {
    try {
      const response = await fetch(`/api/training-plans/fetch?curriculumId=${id}`);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const existingPlan = data.data[0];
        setExistingTrainingPlanId(existingPlan.id);
        // Convert existing plan to UI format
        if (existingPlan.days && existingPlan.days.length > 0) {
          const convertedPlan = existingPlan.days.map(day => ({
            dayNumber: day.dayNumber,
            dayTitle: day.dayTitle || `Day ${day.dayNumber}`,
            dayDescription: day.dayDescription,
            date: day.date,
            modules: day.modules.map(module => ({
              id: module.id,
              moduleId: module.moduleId,
              courseId: module.courseId,
              supportActivityId: module.supportActivityId,
              title: module.customTitle || module.module?.title || module.course?.title || module.supportActivity?.title || '',
              duration: module.customDuration || module.module?.duration || module.supportActivity?.duration,
              activities: module.activities || [],
              learningObjectives: module.learningObjectives || [],
              notes: module.notes,
              isSupportActivity: !!module.supportActivityId,
              courseName: module.course?.title
            }))
          }));
          setTrainingPlan(convertedPlan);
          setTrainingDays(existingPlan.totalDays || convertedPlan.length);
        }
      }
    } catch (error) {
      console.error('Error fetching existing training plan:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  if (!curriculum) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">
            Curriculum not found or failed to load.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          
          <Breadcrumbs>
            <Link color="inherit" href="/curriculums">
              Curriculums
            </Link>
            <Typography color="text.primary">Edit Curriculum</Typography>
          </Breadcrumbs>
        </Stack>

        {/* Curriculum Header */}
        <MainCard sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MenuBookIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {curriculum.title}
                </Typography>
                
                {curriculum.description && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: '600px' }}>
                    {curriculum.description}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip
                    icon={<SchoolIcon />}
                    label={`${curriculum.curriculum_courses?.length || 0} Courses`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<SupportIcon />}
                    label={`${curriculum.supportActivities?.length || 0} Support Activities`}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Created ${new Date(curriculum.createdAt).toLocaleDateString()}`}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>
            
            <Button variant="contained" color="primary">
              Save Changes
            </Button>
          </Stack>
        </MainCard>

        {/* Tabs */}
        <MainCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                icon={<AssignmentIcon />}
                label="Overview"
                iconPosition="start"
              />
              <Tab
                icon={<SchoolIcon />}
                label="Courses"
                iconPosition="start"
              />
              <Tab
                icon={<SupportIcon />}
                label="Support Activities"
                iconPosition="start"
              />
              <Tab
                icon={<ViewListIcon />}
                label="Outlined"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: 3 }}>
            <TabPanel value={activeTab} index={0}>
              {/* Overview Tab */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Curriculum Details
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Title
                          </Typography>
                          <Typography variant="body1">
                            {curriculum.title}
                          </Typography>
                        </Box>
                        
                        {curriculum.description && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Description
                            </Typography>
                            <Typography variant="body1">
                              {curriculum.description}
                            </Typography>
                          </Box>
                        )}
                        
                        <Divider />
                        
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Statistics
                          </Typography>
                          <Stack direction="row" spacing={3}>
                            <Box>
                              <Typography variant="h4" color="primary">
                                {curriculum.curriculum_courses?.length || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Courses
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="h4" color="secondary">
                                {curriculum.supportActivities?.length || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Support Activities
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quick Actions
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SchoolIcon />}
                          onClick={() => setActiveTab(1)}
                        >
                          Manage Courses
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SupportIcon />}
                          onClick={() => setActiveTab(2)}
                        >
                          Manage Support Activities
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ViewListIcon />}
                          onClick={() => setActiveTab(3)}
                        >
                          View Outline
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {/* Courses Tab */}
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      Curriculum Courses ({curriculum.curriculum_courses?.length || 0})
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAddCourseDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Add Courses
                    </Button>
                  </Stack>
                  
                  {curriculum.curriculum_courses?.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No courses assigned to this curriculum yet. Click "Add Courses" to get started.
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {curriculum.curriculum_courses?.map((curriculumCourse) => (
                        <Grid item xs={12} md={6} key={curriculumCourse.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {curriculumCourse.course?.title || 'Course Title'}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveCourse(curriculumCourse.courseId)}
                                  disabled={actionLoading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                              
                              {/* Inactive Course Warning */}
                              {curriculumCourse.course?.isActive === false && (
                                <Alert
                                  severity="warning"
                                  size="small"
                                  sx={{ mb: 2 }}
                                  icon={<AlertIcon fontSize="small" />}
                                >
                                  This course is not active and may not be available for training delivery.
                                </Alert>
                              )}
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {curriculumCourse.course?.summary || 'No description available'}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip label={curriculumCourse.course?.level || 'N/A'} size="small" />
                                <Chip 
                                  label={curriculumCourse.course?.courseCategory || 'General'} 
                                  size="small" 
                                  variant="outlined" 
                                />
                                {curriculumCourse.course?.isActive === false && (
                                  <Chip 
                                    label="INACTIVE" 
                                    size="small" 
                                    color="warning"
                                    variant="filled"
                                  />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {curriculumCourse.course?.modules?.length || 0} modules • 
                                Duration: {curriculumCourse.course?.modules?.reduce((total, module) => {
                                  const moduleTotal = module.customDuration || 
                                    module.activities?.reduce((sum, activity) => sum + (activity.duration || 0), 0) || 0;
                                  return total + moduleTotal;
                                }, 0) || 0} minutes
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {/* Support Activities Tab */}
              <SupportActivitiesManager
                curriculumId={curriculum.id}
                curriculumTitle={curriculum.title}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              {/* Training Plan Organizer Tab */}
              <Box>
                {/* Check if curriculum has courses */}
                {(!curriculum.curriculum_courses || curriculum.curriculum_courses.length === 0) && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      No courses assigned to this curriculum
                    </Typography>
                    <Typography variant="body2">
                      Please add courses to this curriculum first by going to the "Courses" tab before creating a training plan.
                    </Typography>
                  </Alert>
                )}

                {/* Header Section */}
                <Card sx={{ 
                  mb: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}>
                  <CardContent sx={{ p: 2 }}>
                    {/* Main Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            Training Plan Organizer
                          </Typography>
                          {hasUnsavedChanges && (
                            <Chip 
                              label="Unsaved changes" 
                              size="small" 
                              color="warning" 
                              variant="filled"
                              sx={{ 
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 }
                                }
                              }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Organize your curriculum into a structured training schedule with daily plans
                        </Typography>
                      </Box>
                      <Button
                        variant={hasUnsavedChanges ? "contained" : "outlined"}
                        color={hasUnsavedChanges ? "warning" : "primary"}
                        data-save-button="true"
                        onClick={async () => {
                          setSavingTrainingPlan(true);
                          try {
                            const trainingPlanData = {
                              curriculumId: parseInt(id),
                              title: `Training Plan for ${curriculum?.title || 'Curriculum'}`,
                              description: `${trainingDays}-day training plan`,
                              totalDays: trainingDays,
                              days: trainingPlan.map((day, index) => ({
                                dayTitle: day.dayTitle || `Day ${index + 1}`,
                                dayDescription: day.dayDescription,
                                date: day.date,
                                modules: day.modules.map(module => ({
                                  moduleId: module.moduleId,
                                  courseId: module.courseId,
                                  supportActivityId: module.supportActivityId || module.activityId,
                                  title: module.title,
                                  duration: module.duration,
                                  activities: module.activities,
                                  learningObjectives: module.learningObjectives,
                                  notes: module.notes
                                }))
                              })),
                              createdBy: 'current_user' // You should get this from auth context
                            };
                            
                            if (existingTrainingPlanId) {
                              // Update existing plan
                              trainingPlanData.id = existingTrainingPlanId;
                              trainingPlanData.updatedBy = 'current_user'; // You should get this from auth context
                              await dispatch(updateTrainingPlan(trainingPlanData));
                              setHasUnsavedChanges(false); // Reset unsaved changes flag
                            } else {
                              // Create new plan
                              const result = await dispatch(createTrainingPlan(trainingPlanData));
                              if (result && result.id) {
                                setExistingTrainingPlanId(result.id);
                                setHasUnsavedChanges(false); // Reset unsaved changes flag
                              }
                            }
                          } catch (error) {
                            console.error('Error saving training plan:', error);
                          } finally {
                            setSavingTrainingPlan(false);
                          }
                        }}
                        disabled={savingTrainingPlan || !trainingPlan.some(day => day.modules.length > 0)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        {savingTrainingPlan ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Saving...
                          </>
                        ) : (
                          hasUnsavedChanges ? 'Save Changes' : (existingTrainingPlanId ? 'Update Plan' : 'Save Plan')
                        )}
                      </Button>
                    </Stack>
                    
                    {/* Configuration Section */}
                    <Stack direction="row" spacing={3} alignItems="center">
                      {/* Training Days Selector */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Number of Training Days:
                        </Typography>
                        <TextField
                          type="number"
                          value={trainingDays}
                          onChange={handleTrainingDaysChange}
                          inputProps={{ min: 1, max: 30 }}
                          size="small"
                          sx={{ width: 100 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          (1-30 days)
                        </Typography>
                      </Stack>
                      
                      {/* Available Courses Info */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Chip 
                          label={`${curriculum.curriculum_courses?.length || 0} Courses Available`}
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                        {curriculum.curriculum_courses?.length > 0 && (
                          <Chip
                            label={(() => {
                              // Get unique modules used in training plan
                              const usedModuleIds = new Set();
                              trainingPlan.forEach(day => {
                                day.modules?.forEach(module => {
                                  if (module.moduleId) {
                                    usedModuleIds.add(module.moduleId);
                                  }
                                });
                              });
                              
                              // Count total available modules
                              const totalModules = curriculum.curriculum_courses?.reduce((total, cc) => {
                                return total + (cc.course?.modules?.length || 0);
                              }, 0) || 0;
                              
                              const scheduledCount = usedModuleIds.size;
                              return `${scheduledCount} of ${totalModules} modules scheduled`;
                            })()}
                            size="small"
                            color={(() => {
                              // Get unique modules used in training plan
                              const usedModuleIds = new Set();
                              trainingPlan.forEach(day => {
                                day.modules?.forEach(module => {
                                  if (module.moduleId) {
                                    usedModuleIds.add(module.moduleId);
                                  }
                                });
                              });
                              
                              // Count total available modules
                              const totalModules = curriculum.curriculum_courses?.reduce((total, cc) => {
                                return total + (cc.course?.modules?.length || 0);
                              }, 0) || 0;
                              
                              const scheduledCount = usedModuleIds.size;
                              
                              if (scheduledCount === 0) return "default";
                              if (scheduledCount === totalModules) return "success";
                              return "warning";
                            })()}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Training Days Components */}
                <Stack spacing={3}>
                  {trainingPlan.map((day, dayIndex) => (
                    <Card 
                      key={dayIndex} 
                      elevation={0}
                      sx={{ 
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          boxShadow: theme.shadows[2]
                        }
                      }}>
                      <CardContent>
                        {/* Day Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.primary.contrastText,
                                fontWeight: 'bold'
                              }}
                            >
                              {dayIndex + 1}
                            </Box>
                            <Typography variant="h6">
                              Day {dayIndex + 1}
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Bulk Actions Toolbar */}
                        {(() => {
                          // Check if this day has any selected items
                          const dayModules = day.modules || [];
                          const dayHasSelected = dayModules.some((_, moduleIndex) => 
                            selectedRows.has(`${dayIndex}-${moduleIndex}`)
                          );
                          return showBulkActions && dayHasSelected;
                        })() && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: 'primary.light',
                            borderRadius: 1,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 600 }}>
                              {(() => {
                                const dayModules = day.modules || [];
                                const daySelectedCount = dayModules.filter((_, moduleIndex) => 
                                  selectedRows.has(`${dayIndex}-${moduleIndex}`)
                                ).length;
                                return `${daySelectedCount} item${daySelectedCount !== 1 ? 's' : ''} selected`;
                              })()}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedRows(new Set());
                                  setShowBulkActions(false);
                                }}
                              >
                                Clear Selection
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleBulkDelete}
                              >
                                Delete Selected
                              </Button>
                            </Stack>
                          </Box>
                        )}

                        {/* Day Content Table */}
                        <TableContainer component={Paper} variant="outlined" sx={{ 
                          borderColor: theme.palette.divider,
                          width: '100%',
                          overflowX: 'auto',
                          minWidth: '800px',
                          '& .MuiTableCell-head': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            whiteSpace: 'nowrap'
                          },
                          '& .MuiTableCell-root': {
                            padding: '10px 8px',
                            minWidth: 'fit-content'
                          }
                        }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ minWidth: '50px', width: '50px', textAlign: 'center' }}>
                                  <Checkbox
                                    size="small"
                                    checked={(() => {
                                      const dayModules = day.modules?.filter(m => m.sequence !== null) || [];
                                      if (dayModules.length === 0) return false;
                                      return dayModules.every((_, moduleIndex) => 
                                        selectedRows.has(`${dayIndex}-${moduleIndex}`)
                                      );
                                    })()}
                                    indeterminate={(() => {
                                      const dayModules = day.modules?.filter(m => m.sequence !== null) || [];
                                      if (dayModules.length === 0) return false;
                                      const selectedCount = dayModules.filter((_, moduleIndex) => 
                                        selectedRows.has(`${dayIndex}-${moduleIndex}`)
                                      ).length;
                                      return selectedCount > 0 && selectedCount < dayModules.length;
                                    })()}
                                    onChange={(e) => handleSelectAll(dayIndex, e.target.checked)}
                                  />
                                </TableCell>
                                <TableCell sx={{ minWidth: '80px', width: '80px' }}>Order</TableCell>
                                <TableCell sx={{ minWidth: '400px', width: '400px' }}>Course & Module</TableCell>
                                <TableCell sx={{ minWidth: '380px', width: '380px' }}>Activities</TableCell>
                                <TableCell sx={{ minWidth: '280px', width: '280px' }}>Learning Objectives</TableCell>
                                <TableCell sx={{ minWidth: '90px', width: '90px' }}>Duration (min)</TableCell>
                                <TableCell sx={{ minWidth: '150px', width: '150px' }}>Notes</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {day.modules?.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">
                                    <Box sx={{ py: 3 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        No modules added yet. Use the dropdown below to add modules.
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                day.modules
                                  ?.map((module, moduleIndex) => {
                                    // Find the original index for state updates
                                    const originalIndex = day.modules.findIndex(m => m === module);
                                    
                                    // Check if this is a different course/module from the previous row
                                    const previousModule = moduleIndex > 0 ? day.modules?.filter(m => m.sequence !== null)
                                      ?.sort((a, b) => {
                                        const seqA = a.sequence || 999;
                                        const seqB = b.sequence || 999;
                                        return seqA - seqB;
                                      })[moduleIndex - 1] : null;
                                    
                                    const isDifferentModule = previousModule && 
                                      (previousModule.courseId !== module.courseId || previousModule.moduleId !== module.moduleId);
                                    
                                    return (
                                  <TableRow 
                                    key={moduleIndex}
                                    sx={{
                                      ...(isDifferentModule && {
                                        borderTop: `2px solid ${theme.palette.divider}`,
                                        '& td': {
                                          borderTop: `2px solid ${theme.palette.divider}`,
                                          position: 'relative',
                                          '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: -1,
                                            left: 0,
                                            right: 0,
                                            height: '2px',
                                            backgroundColor: theme.palette.primary.main,
                                            opacity: 0.3
                                          }
                                        }
                                      })
                                    }}
                                  >
                                    {/* Selection Checkbox */}
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Checkbox
                                        size="small"
                                        checked={selectedRows.has(`${dayIndex}-${moduleIndex}`)}
                                        onChange={(e) => handleRowSelect(dayIndex, moduleIndex, e.target.checked)}
                                      />
                                    </TableCell>

                                    {/* Order Controls */}
                                    <TableCell>
                                      <Stack direction="column" spacing={0} alignItems="center">
                                        <IconButton
                                          size="small"
                                          onClick={() => moveModuleUp(dayIndex, moduleIndex)}
                                          disabled={moduleIndex === 0}
                                          sx={{ 
                                            padding: '2px',
                                            '&:disabled': { opacity: 0.3 }
                                          }}
                                        >
                                          <KeyboardArrowUpIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => moveModuleDown(dayIndex, moduleIndex)}
                                          disabled={moduleIndex >= day.modules.length - 1}
                                          sx={{ 
                                            padding: '2px',
                                            '&:disabled': { opacity: 0.3 }
                                          }}
                                        >
                                          <KeyboardArrowDownIcon fontSize="small" />
                                        </IconButton>
                                      </Stack>
                                    </TableCell>

                                    {/* Course & Module Column */}
                                    <TableCell>
                                      {module.isSupportActivity ? (
                                        // Support Activity - dropdown selector
                                        (() => {
                                          // Create options from curriculum support activities
                                          const supportActivityOptions = curriculum.supportActivities?.map(sa => ({
                                            id: sa.id,
                                            title: sa.title,
                                            description: sa.description,
                                            duration: sa.duration,
                                            searchText: `${sa.title} ${sa.description || ''}`.toLowerCase()
                                          })) || [];
                                          
                                          // Find current selection
                                          const currentValue = module.supportActivityId ? 
                                            supportActivityOptions.find(opt => opt.id === module.supportActivityId) : null;
                                          
                                          const selectorKey = `${dayIndex}-${originalIndex}`;
                                          const isOpen = openSupportActivitySelectors[selectorKey] || false;
                                          const setIsOpen = (open) => {
                                            setOpenSupportActivitySelectors(prev => ({
                                              ...prev,
                                              [selectorKey]: open
                                            }));
                                          };
                                          
                                          return (
                                            <Box sx={{ position: 'relative' }}>
                                              {/* Display current selection with edit icon */}
                                              {currentValue ? (
                                                <Box 
                                                  sx={{ 
                                                    p: 1.5, 
                                                    border: '1px solid', 
                                                    borderColor: 'divider', 
                                                    borderRadius: 1,
                                                    bgcolor: 'background.paper',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                      bgcolor: 'action.hover'
                                                    }
                                                  }}
                                                  onClick={() => setIsOpen(true)}
                                                >
                                                  <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                      <SupportIcon sx={{ fontSize: '16px', color: 'secondary.main', flexShrink: 0 }} />
                                                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'secondary.main', fontSize: '0.875rem' }}>
                                                        Support Activity
                                                      </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 500 }}>
                                                      {currentValue.title}
                                                    </Typography>
                                                  </Box>
                                                  <EditIcon sx={{ fontSize: '16px', color: 'action.active', flexShrink: 0 }} />
                                                </Box>
                                              ) : (
                                                <Box 
                                                  sx={{ 
                                                    p: 1.5, 
                                                    border: '1px dashed', 
                                                    borderColor: 'secondary.main', 
                                                    borderRadius: 1,
                                                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                      borderColor: 'secondary.main',
                                                      bgcolor: alpha(theme.palette.secondary.main, 0.08)
                                                    }
                                                  }}
                                                  onClick={() => setIsOpen(true)}
                                                >
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <SupportIcon sx={{ fontSize: '16px', color: 'secondary.main', flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{ color: 'secondary.main' }}>
                                                      Click to select support activity
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              )}
                                              
                                              {/* Hidden autocomplete for selection */}
                                              {isOpen && (
                                                <Box sx={{ 
                                                  position: 'absolute', 
                                                  top: 0, 
                                                  left: 0, 
                                                  right: 0, 
                                                  zIndex: 1000,
                                                  boxShadow: 3,
                                                  borderRadius: 1,
                                                  bgcolor: 'background.paper'
                                                }}>
                                                  <Autocomplete
                                                    open={true}
                                                    onClose={() => setIsOpen(false)}
                                                    size="small"
                                                    value={currentValue}
                                                    onChange={(event, newValue) => {
                                                      if (newValue) {
                                                        const updatedPlan = [...trainingPlan];
                                                        updatedPlan[dayIndex].modules[originalIndex].supportActivityId = newValue.id;
                                                        updatedPlan[dayIndex].modules[originalIndex].title = newValue.title;
                                                        updatedPlan[dayIndex].modules[originalIndex].description = newValue.description;
                                                        updatedPlan[dayIndex].modules[originalIndex].duration = newValue.duration || 30;
                                                        setTrainingPlan(updatedPlan);
                                                      }
                                                      setIsOpen(false);
                                                    }}
                                                    options={supportActivityOptions}
                                                    getOptionLabel={(option) => option.title}
                                                    renderInput={(params) => (
                                                      <TextField
                                                        {...params}
                                                        placeholder="Search support activities..."
                                                        autoFocus
                                                        sx={{
                                                          '& .MuiInputBase-root': {
                                                            fontSize: '0.875rem'
                                                          }
                                                        }}
                                                      />
                                                    )}
                                                    renderOption={(props, option) => (
                                                      <Box component="li" {...props} sx={{ flexDirection: 'column', alignItems: 'flex-start !important', py: 1.5 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                          {option.title}
                                                          {option.duration && (
                                                            <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                              ({option.duration}min)
                                                            </Typography>
                                                          )}
                                                        </Typography>
                                                        {option.description && (
                                                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            {option.description}
                                                          </Typography>
                                                        )}
                                                      </Box>
                                                    )}
                                                    filterOptions={(options, { inputValue }) => {
                                                      return options.filter(option =>
                                                        option.searchText.includes(inputValue.toLowerCase())
                                                      );
                                                    }}
                                                    noOptionsText="No support activities found"
                                                  />
                                                </Box>
                                              )}
                                            </Box>
                                          );
                                        })()
                                      ) : (
                                        // Regular Course Module - Using new ModuleSelector component
                                        <ModuleDropdownCell
                                          module={module}
                                          dayIndex={dayIndex}
                                          originalIndex={originalIndex}
                                          trainingPlan={trainingPlan}
                                          curriculum={curriculum}
                                          updateModuleFromSelection={updateModuleFromSelection}
                                        />
                                      )}
                                    </TableCell>

                                    {/* Activities Column */}
                                    <TableCell>
                                      {module.isSupportActivity ? (
                                        // Support activities don't have predefined activities - show empty
                                        <Box sx={{ 
                                          py: 2,
                                          px: 1
                                        }}>
                                          {/* Empty for support activities */}
                                        </Box>
                                      ) : (
                                        <Box sx={{ 
                                          fontSize: '0.85rem',
                                          lineHeight: 1.5,
                                          pr: 1,
                                          width: '100%'
                                        }}>
                                          {(() => {
                                          // Get activities from the selected module
                                          const selectedCourse = curriculum.curriculum_courses?.find(
                                            cc => cc.courseId === module.courseId
                                          );
                                          const selectedModule = selectedCourse?.course?.modules?.find(
                                            m => m.id === module.moduleId
                                          );
                                          const activities = selectedModule?.activities || [];
                                          
                                          if (!module.moduleId || activities.length === 0) {
                                            return (
                                              <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                py: 2,
                                                px: 1,
                                                borderRadius: 1,
                                                bgcolor: 'action.hover',
                                                border: '1px dashed',
                                                borderColor: 'divider'
                                              }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                  {!module.moduleId ? (
                                                    <>
                                                      📚 Select a module above to view activities
                                                    </>
                                                  ) : (
                                                    <>
                                                      ➕ No activities yet
                                                      <br />
                                                      <Typography variant="caption" color="text.disabled">
                                                        Add activities in Course Content tab
                                                      </Typography>
                                                    </>
                                                  )}
                                                </Typography>
                                              </Box>
                                            );
                                          }
                                          
                                          // Function to get icon based on activity type (standardized with CourseContent.js)
                                          const getActivityIcon = (type) => {
                                            switch(type?.toLowerCase()) {
                                              // Main activity types from CourseContent.js
                                              case 'video':
                                                return <PlayCircleOutlineIcon sx={{ fontSize: '16px', mr: 0.5, color: 'primary.main' }} />;
                                              case 'lecture':
                                                return <MenuBookIcon sx={{ fontSize: '16px', mr: 0.5, color: 'info.main' }} />;
                                              case 'presentation':
                                                return <SlideshowIcon sx={{ fontSize: '16px', mr: 0.5, color: 'warning.main' }} />;
                                              case 'group_activity':
                                              case 'group activity':
                                              case 'workshop':
                                                return <GroupsIcon sx={{ fontSize: '16px', mr: 0.5, color: 'success.main' }} />;
                                              case 'assessment':
                                              case 'quiz':
                                                return <QuizIcon sx={{ fontSize: '16px', mr: 0.5, color: 'secondary.main' }} />;
                                              
                                              // Additional legacy types for backwards compatibility
                                              case 'exercise':
                                              case 'lab':
                                              case 'interactive':
                                                return <AssignmentIcon sx={{ fontSize: '16px', mr: 0.5, color: 'info.main' }} />;
                                              case 'reading':
                                                return <MenuBookIcon sx={{ fontSize: '16px', mr: 0.5, color: 'info.main' }} />;
                                              case 'project':
                                                return <FolderIcon sx={{ fontSize: '16px', mr: 0.5, color: 'primary.main' }} />;
                                              case 'discussion':
                                                return <ForumIcon sx={{ fontSize: '16px', mr: 0.5, color: 'success.main' }} />;
                                              case 'simulation':
                                                return <ScienceIcon sx={{ fontSize: '16px', mr: 0.5, color: 'warning.main' }} />;
                                              default:
                                                return <RadioButtonCheckedIcon sx={{ fontSize: '16px', mr: 0.5, color: 'text.secondary' }} />;
                                            }
                                          };
                                          
                                          return (
                                            <Stack spacing={0.5} sx={{ width: '100%' }}>
                                              {activities.map((activity) => (
                                                <Box 
                                                  key={activity.id} 
                                                  sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'flex-start',
                                                    '&:hover': {
                                                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                      borderRadius: 0.5
                                                    },
                                                    px: 0.5,
                                                    py: 0.25,
                                                    width: '100%'
                                                  }}
                                                >
                                                  <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    color: theme.palette.text.secondary,
                                                    mt: 0.25,
                                                    flexShrink: 0
                                                  }}>
                                                    {getActivityIcon(activity.activityType)}
                                                  </Box>
                                                  <Box sx={{ 
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden'
                                                  }}>
                                                    <Typography 
                                                      variant="body2" 
                                                      component="div"
                                                      sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexWrap: 'nowrap',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                      }}
                                                    >
                                                      <span style={{ 
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        marginRight: '8px'
                                                      }}>
                                                        {activity.title}
                                                      </span>
                                                      {activity.duration && (
                                                        <Typography 
                                                          variant="caption" 
                                                          component="span" 
                                                          sx={{ 
                                                            color: 'text.secondary',
                                                            flexShrink: 0,
                                                            whiteSpace: 'nowrap',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 600,
                                                            bgcolor: 'action.hover',
                                                            px: 0.5,
                                                            py: 0.25,
                                                            borderRadius: 0.5,
                                                            fontSize: '0.75rem'
                                                          }}
                                                        >
                                                          {activity.duration}min
                                                        </Typography>
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              ))}
                                            </Stack>
                                          );
                                          })()}
                                        </Box>
                                      )}
                                    </TableCell>

                                    {/* Learning Objectives */}
                                    <TableCell>
                                      {module.isSupportActivity ? (
                                        // Support activities don't have predefined learning objectives - show empty
                                        <Box sx={{ 
                                          py: 2,
                                          px: 1
                                        }}>
                                          {/* Empty for support activities */}
                                        </Box>
                                      ) : (
                                        (() => {
                                        // Get the module objectives from the course data
                                        const selectedCourse = curriculum.curriculum_courses?.find(
                                          cc => cc.courseId === module.courseId
                                        );
                                        const selectedModule = selectedCourse?.course?.modules?.find(
                                          m => m.id === module.moduleId
                                        );
                                        
                                        // Get module objectives if they exist
                                        const moduleObjectives = selectedModule?.module_objectives || [];
                                        
                                        if (moduleObjectives.length > 0) {
                                          return (
                                            <Stack spacing={1}>
                                              {moduleObjectives
                                                .sort((a, b) => (a.objectiveOrder || 0) - (b.objectiveOrder || 0))
                                                .map((objective, index) => (
                                                  <Box 
                                                    key={objective.id} 
                                                    sx={{ 
                                                      display: 'flex', 
                                                      alignItems: 'flex-start',
                                                      gap: 0.75,
                                                      mb: 0.5
                                                    }}
                                                  >
                                                    <Typography 
                                                      variant="body2" 
                                                      sx={{ 
                                                        color: 'primary.main',
                                                        fontWeight: 700,
                                                        flexShrink: 0,
                                                        fontSize: '0.8rem',
                                                        mt: 0.1,
                                                        minWidth: '16px'
                                                      }}
                                                    >
                                                      {index + 1}.
                                                    </Typography>
                                                    <Typography 
                                                      variant="body2" 
                                                      sx={{ 
                                                        color: 'text.secondary',
                                                        lineHeight: 1.5,
                                                        fontSize: '0.8rem',
                                                        wordWrap: 'break-word',
                                                        whiteSpace: 'normal'
                                                      }}
                                                    >
                                                      {objective.objective}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                            </Stack>
                                          );
                                        } else {
                                          return (
                                            <Box sx={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'center',
                                              py: 1.5,
                                              px: 1,
                                              borderRadius: 1,
                                              bgcolor: 'action.hover',
                                              border: '1px dashed',
                                              borderColor: 'divider'
                                            }}>
                                              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                🎯 No learning objectives
                                                <br />
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                                  Define objectives in Module Editor
                                                </Typography>
                                              </Typography>
                                            </Box>
                                          );
                                        }
                                        })()
                                      )}
                                    </TableCell>

                                    {/* Duration Column */}
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontFamily: 'monospace',
                                          fontWeight: 600,
                                          fontSize: '0.875rem',
                                          color: 'text.primary'
                                        }}
                                      >
                                        {module.duration || 0}
                                      </Typography>
                                    </TableCell>

                                    {/* Notes */}
                                    <TableCell>
                                      <TextField
                                        multiline
                                        rows={2}
                                        value={module.notes || ''}
                                        onChange={(e) => {
                                          const updatedPlan = [...trainingPlan];
                                          updatedPlan[dayIndex].modules[originalIndex].notes = e.target.value;
                                          setTrainingPlan(updatedPlan);
                                        }}
                                        placeholder="Notes..."
                                        size="small"
                                        fullWidth
                                        sx={{ minWidth: '120px' }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                    );
                                  })
                              )}
                              
                              {/* Add Module Row */}
                              <TableRow>
                                <TableCell colSpan={7}>
                                  <Stack spacing={1}>
                                    <Tooltip 
                                      title={(() => {
                                        const modules = day.modules || [];
                                        if (modules.length === 0) return "Add your first course";
                                        
                                        const lastModule = modules[modules.length - 1];
                                        if (!lastModule.courseId && !lastModule.isSupportActivity) return "Please select a course for the previous row first";
                                        if (!lastModule.moduleId && !lastModule.isSupportActivity) return "Please select a module for the previous row first";
                                        return "Add another course";
                                      })()}
                                      placement="top"
                                    >
                                      <span>
                                        <Button
                                          fullWidth
                                          variant="text"
                                          startIcon={<AddIcon />}
                                          disabled={(() => {
                                            // Check if the last module in this day has both course and module selected
                                            const modules = day.modules || [];
                                            if (modules.length === 0) return false; // Allow first module
                                            
                                            const lastModule = modules[modules.length - 1];
                                            // Support activities don't need course/module validation
                                            if (lastModule.isSupportActivity) return false;
                                            return !lastModule.courseId || !lastModule.moduleId;
                                          })()}
                                          onClick={() => {
                                            // Add a new empty module row
                                            addModuleToDay(dayIndex, {
                                              courseId: '',
                                              courseName: '',
                                              title: 'New Module'
                                            });
                                          }}
                                      sx={{ 
                                        py: 1, 
                                        color: theme.palette.text.secondary,
                                        borderStyle: 'dashed',
                                        borderWidth: 1,
                                        borderColor: theme.palette.divider,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                          borderStyle: 'solid',
                                          borderColor: theme.palette.primary.main,
                                          color: theme.palette.primary.main
                                        }
                                      }}
                                    >
                                      Add Course
                                    </Button>
                                      </span>
                                    </Tooltip>
                                    
                                    <Button
                                      fullWidth
                                      variant="text"
                                      startIcon={<SupportIcon />}
                                      onClick={() => {
                                        addSupportActivityToDay(dayIndex);
                                      }}
                                      sx={{ 
                                        py: 1, 
                                        color: theme.palette.text.secondary,
                                        borderStyle: 'dashed',
                                        borderWidth: 1,
                                        borderColor: theme.palette.divider,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                                          borderStyle: 'solid',
                                          borderColor: theme.palette.secondary.main,
                                          color: theme.palette.secondary.main
                                        }
                                      }}
                                    >
                                      Add Support Activity
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* Day Summary */}
                        <Box sx={{ 
                          mt: 2, 
                          p: 2, 
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}>
                          <Stack direction="row" spacing={3}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Total Duration:</strong> {
                                day.modules?.reduce((total, module) => total + (module.duration || 0), 0) || 0
                              } minutes ({
                                Math.floor((day.modules?.reduce((total, module) => total + (module.duration || 0), 0) || 0) / 60)
                              }h {
                                (day.modules?.reduce((total, module) => total + (module.duration || 0), 0) || 0) % 60
                              }m)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Modules:</strong> {day.modules?.length || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Activities:</strong> {day.modules?.filter(m => m.type === 'activity').length || 0}
                            </Typography>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                {/* Export/Import Actions */}
                <Card sx={{ 
                  mt: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="center" spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          // TODO: Export to CSV/Excel
                          dispatch(openSnackbar({
                            open: true,
                            message: 'Training plan exported successfully',
                            variant: 'alert',
                            alert: { color: 'success' }
                          }));
                        }}
                      >
                        Export to Excel
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          // TODO: Print preview
                          window.print();
                        }}
                      >
                        Print Preview
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
          </Box>
        </MainCard>

        {/* Add Courses Dialog */}
        <Dialog
          open={addCourseDialogOpen}
          onClose={() => setAddCourseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              maxWidth: '500px',
              width: '100%'
            }
          }}
        >
          <MainCard
            title="Add Courses to Curriculum"
            secondary={
              <IconButton onClick={() => setAddCourseDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Courses</InputLabel>
                <Select
                  multiple
                  value={selectedCourses}
                  onChange={(e) => setSelectedCourses(e.target.value)}
                  input={<OutlinedInput label="Select Courses" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const course = courses.find(c => c.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={course?.title || `Course ${value}`} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {courses
                    .filter(course => 
                      !curriculum.curriculum_courses?.some(cc => cc.courseId === course.id)
                    )
                    .map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Checkbox checked={selectedCourses.indexOf(course.id) > -1} />
                        <ListItemText 
                          primary={course.title}
                          secondary={`${course.level} • ${course.courseCategory} • ${course.modules?.length || 0} modules`}
                        />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              {courses.filter(course => 
                !curriculum.curriculum_courses?.some(cc => cc.courseId === course.id)
              ).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  All available courses are already assigned to this curriculum.
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button variant="outlined" onClick={() => setAddCourseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCourses}
                  variant="contained"
                  startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
                  disabled={actionLoading || selectedCourses.length === 0}
                >
                  Add Selected Courses
                </Button>
              </Box>
            </Box>
          </MainCard>
        </Dialog>

        {/* Unsaved Changes Warning Dialog */}
        <Dialog
          open={showUnsavedDialog}
          onClose={handleCancelNavigation}
          maxWidth="xs"
          fullWidth={false}
          PaperProps={{
            sx: {
              minWidth: 400,
              maxWidth: 480
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.dark,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <AlertIcon color="warning" />
            Unsaved Changes
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You have unsaved changes in your training plan.
            </Typography>
            <Alert severity="warning" sx={{ mb: 0 }}>
              Your changes will be lost if you leave without saving.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleCancelNavigation} 
              variant="outlined"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Stay
            </Button>
            <Button 
              onClick={handleDiscardChanges} 
              color="error"
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Discard
            </Button>
            <Button 
              onClick={async () => {
                setShowUnsavedDialog(false);
                // Trigger save
                document.querySelector('[data-save-button]')?.click();
              }} 
              variant="contained"
              color="warning"
              sx={{ textTransform: 'none' }}
            >
              Save & Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

CurriculumEditPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CurriculumEditPage;