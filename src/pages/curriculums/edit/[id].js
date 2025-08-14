import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  Support as SupportIcon,
  School as SchoolIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
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
  
  const [curriculum, setCurriculum] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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
    router.back();
  };

  useEffect(() => {
    fetchCurriculum();
    fetchCourses();
  }, [id]);

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
          </Box>
        </MainCard>

        {/* Add Courses Dialog */}
        <Dialog
          open={addCourseDialogOpen}
          onClose={() => setAddCourseDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Add Courses to Curriculum</Typography>
              <IconButton onClick={() => setAddCourseDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
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
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setAddCourseDialogOpen(false)}>
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