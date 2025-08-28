import React from 'react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { createCourse, updateCourse, getCourses } from 'store/reducers/courses';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  CardActions,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Fade,
  Zoom,
  Checkbox,
  FormGroup,
  Collapse
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// third-party
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';

// project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { 
  DeleteFilled, 
  DollarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BookOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  DownOutlined
} from '@ant-design/icons';

// constants
const getInitialValues = (course) => {
  const newCourse = {
    title: '',
    summary: '',
    description: '',
    language: 'english',
    deliveryMethod: '',
    level: '',
    courseCategory: '',
    courseStatus: 'draft',
    CourseType: '',
    targetAudience: '',
    maxParticipants: '10',
    code: '',
    tags: '',
    accessRestrictions: '',
    certification: '',
    resources: '',
    goLiveDate: null,
    deadline: null,
    published: false,
    isMandatoryToAllRole: false
  };

  if (course) {
    return { ...newCourse, ...course };
  }

  return newCourse;
};

const courseStatuses = ['draft', 'review', 'approved', 'published', 'archived'];
const courseLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
const deliveryMethods = ['online', 'in-person', 'hybrid', 'self-paced'];
const courseTypes = ['training', 'certification', 'workshop', 'seminar', 'conference'];
const courseCategories = ['technical', 'business', 'soft-skills', 'compliance', 'leadership'];
const languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese'];

// Step configurations
const steps = [
  {
    label: 'Basic Information',
    description: 'Course title and summary',
    icon: <InfoCircleOutlined />
  },
  {
    label: 'Classification',
    description: 'Level, category, and type',
    icon: <BookOutlined />
  },
  {
    label: 'Details & Settings',
    description: 'Participants and audience settings',
    icon: <SettingOutlined />
  },
  {
    label: 'Review & Publish',
    description: 'Final review and publication',
    icon: <CheckCircleOutlined />
  }
];

// ==============================|| MULTISTEP COURSE ADD / EDIT ||============================== //

const AddCourseMultiStep = ({ course, onCancel }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const isCreating = !course;

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [participantRoles, setParticipantRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [isTargetAudienceExpanded, setIsTargetAudienceExpanded] = useState(false);

  // Note: Using simplified validation instead of step schemas for better reliability

  const formik = useFormik({
    initialValues: getInitialValues(course),
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      // Combined validation for all steps
      title: Yup.string().max(255).required('Course title is required'),
      summary: Yup.string().max(500, 'Summary must be less than 500 characters'),
      code: Yup.string().max(20, 'Course code must be less than 20 characters').required('Course code is required'),
      level: Yup.string().required('Course level is required'),
      courseCategory: Yup.string().required('Course category is required'),
      CourseType: Yup.string().required('Course type is required'),
      maxParticipants: Yup.number().positive('Max participants must be positive').integer('Must be a whole number'),
      courseStatus: Yup.string().required('Course status is required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      // This should only be called on the final step
      try {
        if (course) {
          await dispatch(updateCourse({ ...values, id: course.id }));
          
          dispatch(
            openSnackbar({
              open: true,
              message: 'Course updated successfully!',
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );

          // Refresh the courses list
          dispatch(getCourses());

          setSubmitting(false);
          onCancel();
        } else {
          // Create new course using Redux action
          const result = await dispatch(createCourse(values));
          
          if (result.success) {
            // Redirect to the course edit page
            router.push(`/courses/${result.courseId}`);
            
            dispatch(
              openSnackbar({
                open: true,
                message: 'Course created successfully!',
                variant: 'alert',
                alert: {
                  color: 'success'
                },
                close: false
              })
            );

            // Refresh the courses list
            dispatch(getCourses());

            setSubmitting(false);
            onCancel();
          } else {
            throw new Error(result.error || 'Course creation failed');
          }
        }
      } catch (error) {
        console.error('Course creation error:', error);
        dispatch(
          openSnackbar({
            open: true,
            message: error.response?.data?.message || error.message || 'Error saving course. Please try again.',
            variant: 'alert',
            alert: {
              color: 'error'
            },
            close: false
          })
        );
        setSubmitting(false);
      }
    }
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue, values, validateForm } = formik;

  // Fetch participant roles on component mount
  React.useEffect(() => {
    const fetchParticipantRoles = async () => {
      try {
        const response = await fetch('/api/participant-roles/for-dropdown');
        if (response.ok) {
          const roles = await response.json();
          setParticipantRoles(roles);
        }
      } catch (error) {
        console.error('Error fetching participant roles:', error);
      }
    };

    fetchParticipantRoles();
  }, []);

  // Initialize selected roles when editing existing course
  React.useEffect(() => {
    if (course && course.targetAudience) {
      try {
        // If targetAudience is stored as JSON array of role IDs
        const roleIds = JSON.parse(course.targetAudience);
        setSelectedRoles(Array.isArray(roleIds) ? roleIds : []);
      } catch (error) {
        // If targetAudience is stored as plain text, keep it empty for now
        setSelectedRoles([]);
      }
    }
  }, [course]);

  // Handle role selection for target audience
  const handleRoleToggle = (roleId) => {
    const newSelectedRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];
    
    setSelectedRoles(newSelectedRoles);
    // Store selected role IDs as JSON string in targetAudience field
    setFieldValue('targetAudience', JSON.stringify(newSelectedRoles));
  };

  // Handle select all visible roles
  const handleSelectAllVisible = () => {
    const visibleRoleIds = filteredRoles.map(role => role.id);
    const newSelectedRoles = [...new Set([...selectedRoles, ...visibleRoleIds])];
    setSelectedRoles(newSelectedRoles);
    setFieldValue('targetAudience', JSON.stringify(newSelectedRoles));
  };

  // Handle deselect all visible roles
  const handleDeselectAllVisible = () => {
    const visibleRoleIds = filteredRoles.map(role => role.id);
    const newSelectedRoles = selectedRoles.filter(id => !visibleRoleIds.includes(id));
    setSelectedRoles(newSelectedRoles);
    setFieldValue('targetAudience', JSON.stringify(newSelectedRoles));
  };

  // Handle clear all selections
  const handleClearAll = () => {
    setSelectedRoles([]);
    setFieldValue('targetAudience', JSON.stringify([]));
  };

  // Filter roles based on search term
  const filteredRoles = React.useMemo(() => {
    if (!roleSearchTerm) {
      return showAllRoles ? participantRoles : participantRoles.slice(0, 10);
    }
    const filtered = participantRoles.filter(role =>
      role.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
    return showAllRoles ? filtered : filtered.slice(0, 10);
  }, [participantRoles, roleSearchTerm, showAllRoles]);

  // Removed complex validation function - using simpler field-by-field validation instead

  const handleNext = async () => {
    
    // For step 0, validate title and code (required fields)
    if (activeStep === 0) {
      const hasErrors = [];
      if (!values.title || values.title.trim() === '') {
        formik.setFieldTouched('title', true);
        formik.setFieldError('title', 'Course title is required');
        hasErrors.push('title');
      }
      if (!values.code || values.code.trim() === '') {
        formik.setFieldTouched('code', true);
        formik.setFieldError('code', 'Course code is required');
        hasErrors.push('code');
      }
      if (hasErrors.length > 0) {
        return;
      }
    }
    
    // For step 1, validate required classification fields
    if (activeStep === 1) {
      const requiredFields = ['level', 'courseCategory', 'CourseType'];
      const missingFields = requiredFields.filter(field => !values[field] || values[field].trim() === '');
      
      if (missingFields.length > 0) {
        missingFields.forEach(field => {
          formik.setFieldTouched(field, true);
          if (field === 'level') {
            formik.setFieldError(field, 'Course level is required');
          } else if (field === 'courseCategory') {
            formik.setFieldError(field, 'Course category is required');
          } else if (field === 'CourseType') {
            formik.setFieldError(field, 'Course type is required');
          }
        });
        return;
      }
    }
    
    // For step 2, no required validation (all optional)
    // For step 3, validate courseStatus
    if (activeStep === 3) {
      if (!values.courseStatus || values.courseStatus.trim() === '') {
        formik.setFieldTouched('courseStatus', true);
        formik.setFieldError('courseStatus', 'Course status is required');
        return;
      }
    }

    // If validation passes, move to next step
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Removed unused helper functions - using direct validation instead

  const getStepIcon = (step, index) => {
    if (completedSteps.has(index)) {
      return <CheckCircleOutlined style={{ color: theme.palette.success.main }} />;
    }
    if (index === activeStep) {
      return React.cloneElement(step.icon, { style: { color: theme.palette.primary.main } });
    }
    return React.cloneElement(step.icon, { style: { color: theme.palette.text.secondary } });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              {/* Basic Information Fields */}
              <Grid item xs={12}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Stack spacing={1.25}>
                      <InputLabel htmlFor="course-title">Course Title *</InputLabel>
                      <TextField
                        fullWidth
                        id="course-title"
                        placeholder="Enter course title"
                        {...getFieldProps('title')}
                        error={Boolean(touched.title && errors.title)}
                        helperText={touched.title && errors.title}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <InputLabel htmlFor="course-code">Course Code *</InputLabel>
                        <Tooltip title="Course codes are converted to uppercase (e.g., cs101 becomes CS101)">
                          <InfoCircleOutlined 
                            style={{ 
                              fontSize: '0.875rem', 
                              color: theme.palette.text.secondary,
                              cursor: 'help'
                            }} 
                          />
                        </Tooltip>
                      </Stack>
                      <TextField
                        fullWidth
                        id="course-code"
                        placeholder="e.g., CS101"
                        {...getFieldProps('code')}
                        onChange={(e) => {
                          const upperValue = e.target.value.toUpperCase();
                          formik.setFieldValue('code', upperValue);
                        }}
                        error={Boolean(touched.code && errors.code)}
                        helperText={touched.code && errors.code}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12}>
                    <Stack spacing={1.25}>
                      <InputLabel htmlFor="course-summary">Course Summary (optional)</InputLabel>
                      <TextField
                        fullWidth
                        id="course-summary"
                        multiline
                        rows={4}
                        placeholder="Brief description of what students will learn in this course..."
                        {...getFieldProps('summary')}
                        error={Boolean(touched.summary && errors.summary)}
                        helperText={
                          touched.summary && errors.summary 
                            ? errors.summary
                            : `${values.summary?.length || 0}/500 characters`
                        }
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Fade>
        );

      case 1:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="course-level">Course Level *</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="course-level"
                      {...getFieldProps('level')}
                      error={Boolean(touched.level && errors.level)}
                    >
                      {courseLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          <ListItemText primary={level.charAt(0).toUpperCase() + level.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.level && errors.level && (
                      <FormHelperText error>{errors.level}</FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="course-category">Category *</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="course-category"
                      {...getFieldProps('courseCategory')}
                      error={Boolean(touched.courseCategory && errors.courseCategory)}
                    >
                      {courseCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          <ListItemText primary={category.charAt(0).toUpperCase() + category.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.courseCategory && errors.courseCategory && (
                      <FormHelperText error>{errors.courseCategory}</FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="course-type">Course Type *</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="course-type"
                      {...getFieldProps('CourseType')}
                      error={Boolean(touched.CourseType && errors.CourseType)}
                    >
                      {courseTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.CourseType && errors.CourseType && (
                      <FormHelperText error>{errors.CourseType}</FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="delivery-method">Delivery Method (optional)</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="delivery-method"
                      {...getFieldProps('deliveryMethod')}
                    >
                      <MenuItem value="">
                        <Typography color="textSecondary">Select Method</Typography>
                      </MenuItem>
                      {deliveryMethods.map((method) => (
                        <MenuItem key={method} value={method}>
                          <ListItemText primary={method.charAt(0).toUpperCase() + method.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="course-language">Language (optional)</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="course-language"
                      {...getFieldProps('language')}
                    >
                      {languages.map((lang) => (
                        <MenuItem key={lang} value={lang}>
                          <ListItemText primary={lang.charAt(0).toUpperCase() + lang.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>
            </Grid>
          </Fade>
        );

      case 2:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              {/* First Row - Target Audience takes full width */}
              <Grid item xs={12}>
                <Stack spacing={1.25}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      bgcolor: 'background.default',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header - Always visible */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        borderBottom: isTargetAudienceExpanded ? `1px solid ${theme.palette.divider}` : 'none',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover
                        }
                      }}
                      onClick={() => setIsTargetAudienceExpanded(!isTargetAudienceExpanded)}
                    >
                      <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InputLabel sx={{ cursor: 'pointer', mb: 0 }}>
                              Target Audience (optional)
                            </InputLabel>
                            {selectedRoles.length > 0 && (
                              <Chip 
                                label={`${selectedRoles.length} selected`} 
                                size="small" 
                                color="primary"
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {selectedRoles.length > 0 && (
                              <Button 
                                size="small" 
                                color="error" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearAll();
                                }}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Clear All
                              </Button>
                            )}
                            <DownOutlined 
                              style={{ 
                                fontSize: '0.875rem',
                                transform: isTargetAudienceExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                              }} 
                            />
                          </Box>
                        </Stack>
                        
                        {/* Mandatory for All Roles - Always visible in header */}
                        <Box 
                          onClick={(e) => e.stopPropagation()}
                          sx={{ 
                            p: 1.5, 
                            bgcolor: theme.palette.action.hover,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                Mandatory for All Roles
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Make this course mandatory for all user roles
                              </Typography>
                            </Box>
                            <FormControlLabel 
                              control={
                                <Switch 
                                  checked={values.isMandatoryToAllRole}
                                  onChange={(e) => setFieldValue('isMandatoryToAllRole', e.target.checked)}
                                  size="small"
                                />
                              } 
                              label="" 
                              sx={{ m: 0 }}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Collapsible content */}
                    <Collapse in={isTargetAudienceExpanded}>
                      {/* Search and bulk actions */}
                      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Stack spacing={2}>
                          <TextField
                            size="small"
                            placeholder="Search roles..."
                            value={roleSearchTerm}
                            onChange={(e) => setRoleSearchTerm(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchOutlined style={{ fontSize: '1rem' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                          
                          {participantRoles.length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={handleSelectAllVisible}
                                disabled={filteredRoles.every(role => selectedRoles.includes(role.id))}
                              >
                                Select Visible ({filteredRoles.length})
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={handleDeselectAllVisible}
                                disabled={!filteredRoles.some(role => selectedRoles.includes(role.id))}
                              >
                                Deselect Visible
                              </Button>
                            </Stack>
                          )}
                        </Stack>
                      </Box>

                      {/* Roles list - Scrollable */}
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {participantRoles.length > 0 ? (
                          <Box sx={{ p: 2 }}>
                            <FormGroup>
                              {filteredRoles.map((role) => (
                                <FormControlLabel
                                  key={role.id}
                                  control={
                                    <Checkbox
                                      checked={selectedRoles.includes(role.id)}
                                      onChange={() => handleRoleToggle(role.id)}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2" fontWeight={500}>
                                        {role.title}
                                      </Typography>
                                      {role.description && (
                                        <Typography variant="caption" color="text.secondary">
                                          {role.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  sx={{ 
                                    alignItems: 'flex-start', 
                                    mb: 1,
                                    width: '100%'
                                  }}
                                />
                              ))}
                              
                              {/* Show more/less button */}
                              {!roleSearchTerm && participantRoles.length > 10 && (
                                <Box sx={{ textAlign: 'center', mt: 1 }}>
                                  <Button 
                                    size="small" 
                                    onClick={() => setShowAllRoles(!showAllRoles)}
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    {showAllRoles 
                                      ? `Show Less (showing all ${participantRoles.length})` 
                                      : `Show All ${participantRoles.length} Roles`
                                    }
                                  </Button>
                                </Box>
                              )}
                            </FormGroup>
                          </Box>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Loading participant roles...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                </Stack>
              </Grid>

              {/* Second Row - Max Participants and Certification */}
              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="max-participants">Max Participants (optional)</InputLabel>
                  <TextField
                    fullWidth
                    id="max-participants"
                    type="number"
                    placeholder="0"
                    {...getFieldProps('maxParticipants')}
                    error={Boolean(touched.maxParticipants && errors.maxParticipants)}
                    helperText={touched.maxParticipants && errors.maxParticipants}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="certification">Certification (optional)</InputLabel>
                  <TextField
                    fullWidth
                    id="certification"
                    placeholder="Certification details"
                    {...getFieldProps('certification')}
                  />
                </Stack>
              </Grid>

              {/* Third Row - Dates */}
              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="go-live-date">Go Live Date (optional)</InputLabel>
                  <DatePicker
                    value={values.goLiveDate}
                    onChange={(date) => setFieldValue('goLiveDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="deadline">Deadline (optional)</InputLabel>
                  <DatePicker
                    value={values.deadline}
                    onChange={(date) => setFieldValue('deadline', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Stack>
              </Grid>

            </Grid>
          </Fade>
        );

      case 3:
        return (
          <Fade in={true} timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" gutterBottom>
                    Course Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Title:</Typography>
                      <Typography variant="body1" fontWeight="medium">{values.title || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Level:</Typography>
                      <Typography variant="body1" fontWeight="medium">{values.level || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Category:</Typography>
                      <Typography variant="body1" fontWeight="medium">{values.courseCategory || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">Type:</Typography>
                      <Typography variant="body1" fontWeight="medium">{values.CourseType || 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.25}>
                  <InputLabel htmlFor="course-status">Course Status *</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="course-status"
                      {...getFieldProps('courseStatus')}
                      error={Boolean(touched.courseStatus && errors.courseStatus)}
                    >
                      {courseStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          <ListItemText primary={status.charAt(0).toUpperCase() + status.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.courseStatus && errors.courseStatus && (
                      <FormHelperText error>{errors.courseStatus}</FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </Grid>


              <Grid item xs={12}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1">Published</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Make this course visible to all users
                      </Typography>
                    </Stack>
                    <FormControlLabel 
                      control={
                        <Switch 
                          checked={values.published}
                          onChange={(e) => setFieldValue('published', e.target.checked)}
                        />
                      } 
                      label="" 
                      labelPlacement="start" 
                    />
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <FormikProvider value={formik}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
          <MainCard
            title={course ? 'Edit Course' : 'Create New Course'}
            content={false}
          >
            <Box sx={{ p: 2.5 }}>
            <Box sx={{ mb: 4, px: 1 }}>
              <Stepper 
                activeStep={activeStep} 
                orientation="horizontal" 
                alternativeLabel
                sx={{ 
                  '& .MuiStepConnector-root': {
                    top: '12px',
                    left: 'calc(-50% + 12px)',
                    right: 'calc(50% + 12px)',
                    '& .MuiStepConnector-line': {
                      borderColor: theme.palette.divider,
                      borderTopWidth: 2
                    }
                  },
                  '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                    borderColor: theme.palette.success.main
                  },
                  '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label} completed={completedSteps.has(index)}>
                    <StepLabel 
                      icon={getStepIcon(step, index)}
                      onClick={() => handleStepClick(index)}
                      sx={{ 
                        cursor: 'pointer',
                        '& .MuiStepLabel-label': {
                          fontSize: '0.875rem',
                          fontWeight: index === activeStep ? 600 : 500,
                          color: index === activeStep 
                            ? theme.palette.primary.main 
                            : completedSteps.has(index)
                              ? theme.palette.success.main
                              : theme.palette.text.secondary,
                          mt: 1
                        },
                        '& .MuiStepLabel-iconContainer': {
                          padding: 0,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem'
                          }
                        }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: index === activeStep ? 600 : 500,
                          color: index === activeStep 
                            ? theme.palette.primary.main 
                            : completedSteps.has(index)
                              ? theme.palette.success.main
                              : theme.palette.text.secondary,
                          textAlign: 'center'
                        }}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              {renderStepContent(activeStep)}
            </Box>
            </Box>
            
            <Divider sx={{ mt: 1, mb: 2 }} />
            <CardActions sx={{ justifyContent: 'space-between', p: 2.5 }}>
              {!isCreating && activeStep === 0 && (
                <Tooltip title="Delete Course" placement="top">
                  <IconButton size="large" color="error">
                    <DeleteFilled />
                  </IconButton>
                </Tooltip>
              )}
              {(isCreating || activeStep !== 0) && <Box />}
              <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                {activeStep > 0 && (
                  <Button 
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowLeftOutlined />}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  type={activeStep === 3 ? "submit" : "button"}
                  onClick={activeStep === 3 ? undefined : (e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  variant="contained" 
                  disabled={isSubmitting}
                  endIcon={activeStep === 3 ? null : <ArrowRightOutlined />}
                >
                  {activeStep === 3
                    ? (course ? 'Update Course' : 'Create Course')
                    : 'Next'
                  }
                </Button>
              </Stack>
            </CardActions>
          </MainCard>
        </Form>
      </LocalizationProvider>
    </FormikProvider>
  );
};

AddCourseMultiStep.propTypes = {
  course: PropTypes.any,
  onCancel: PropTypes.func
};

export default AddCourseMultiStep;