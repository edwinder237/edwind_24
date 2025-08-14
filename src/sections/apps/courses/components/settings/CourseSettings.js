import React, { useState, useEffect } from 'react';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { getCourses } from 'store/reducers/courses';

// material-ui
import {
  Box,
  Grid,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// material-ui icons
import {
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

// local components
import {
  BasicInformation,
  PublishingSettings,
  EnrollmentSettings,
  ScheduleSettings,
  InstructorSettings
} from '.';

const CourseSettings = ({ course, courseId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState('basic'); // Default to basic info expanded
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    code: '',
    version: '',
    language: '',
    deliveryMethod: '',
    goLiveDate: null,
    deadline: null,
    maxParticipants: '',
    cost: '',
    level: '',
    courseCategory: '',
    courseStatus: '',
    targetAudience: '',
    certification: '',
    published: false,
    isMandatoryToAllRole: false,
  });

  // Initialize form data when course prop changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        summary: course.summary || '',
        code: course.code || '',
        version: course.version || '',
        language: course.language || 'english',
        deliveryMethod: course.deliveryMethod || '',
        goLiveDate: course.goLiveDate ? new Date(course.goLiveDate) : null,
        deadline: course.deadline ? new Date(course.deadline) : null,
        maxParticipants: course.maxParticipants || '',
        cost: course.cost || '',
        level: course.level || '',
        courseCategory: course.courseCategory || '',
        courseStatus: course.courseStatus || 'draft',
        targetAudience: course.targetAudience || '',
        certification: course.certification || '',
        published: course.published || false,
        isMandatoryToAllRole: course.isMandatoryToAllRole || false,
      });
    }
  }, [course]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/courses/updateCourse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(courseId),
          ...formData,
          goLiveDate: formData.goLiveDate ? formData.goLiveDate.toISOString() : null,
          deadline: formData.deadline ? formData.deadline.toISOString() : null,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Course settings updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));

        // Refresh courses data
        dispatch(getCourses());
      } else {
        throw new Error(result.message || 'Failed to update course settings');
      }
    } catch (error) {
      console.error('Error updating course settings:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update course settings',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const settingsSections = [
    {
      id: 'basic',
      title: 'Course Information',
      subtitle: 'Basic details and content metadata',
      component: <BasicInformation formData={formData} onInputChange={handleInputChange} />
    },
    {
      id: 'advanced',
      title: 'Advanced Settings',
      subtitle: 'Publishing, enrollment, schedule, and team management',
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <PublishingSettings formData={formData} onInputChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EnrollmentSettings formData={formData} onInputChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ScheduleSettings formData={formData} onInputChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InstructorSettings courseId={courseId} />
          </Grid>
        </Grid>
      )
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        {/* Settings Sections */}
        <Stack spacing={2}>
          {settingsSections.map((section) => (
            <Accordion
              key={section.id}
              expanded={expanded === section.id}
              onChange={handleAccordionChange(section.id)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: expanded === section.id 
                  ? '0 4px 20px rgba(0,0,0,0.1)' 
                  : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: expanded === section.id ? 'primary.light' : 'background.paper',
                  color: expanded === section.id ? 'primary.contrastText' : 'text.primary',
                  borderRadius: expanded === section.id ? '8px 8px 0 0' : 2,
                  minHeight: 64,
                  '&.Mui-expanded': {
                    minHeight: 64,
                  },
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    my: 1,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.8,
                      mt: 0.5 
                    }}
                  >
                    {section.subtitle}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                  {section.component}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        {/* Save Button */}
        <Paper 
          sx={{ 
            mt: 3,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Save Changes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formData.title ? `Update settings for "${formData.title}"` : 'Save your course configuration'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || !formData.title.trim()}
              size="large"
              sx={{
                minWidth: 140,
                height: 48,
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default CourseSettings;