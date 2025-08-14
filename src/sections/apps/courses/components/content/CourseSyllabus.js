import React, { useState } from 'react';

// material-ui
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// assets
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { calculateCourseDurationFromModules, getModuleDisplayDuration } from 'utils/durationCalculations';


const CourseSyllabus = ({ course, modules }) => {
  const theme = useTheme();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const courseModules = modules || [];

  // Calculate totals using dynamic calculation
  const totalDuration = calculateCourseDurationFromModules(courseModules);
  const totalActivities = courseModules.reduce((acc, module) => 
    acc + (module.activities?.length || 0), 0);

  const learningObjectives = [
    "Master the fundamentals of Customer Relationship Management",
    "Implement CRM strategies in real-world business scenarios", 
    "Analyze customer data to improve business relationships",
    "Design effective customer retention programs",
    "Evaluate CRM software solutions and their applications"
  ];

  const requirements = [
    "Basic understanding of business concepts",
    "Computer literacy and internet access",
    "Willingness to engage in practical exercises",
    "No prior CRM experience required"
  ];

  const assessmentMethods = [
    { type: "Quizzes", weight: "30%", description: "Module-based knowledge checks" },
    { type: "Practical Exercises", weight: "40%", description: "Hands-on CRM implementations" },
    { type: "Final Project", weight: "30%", description: "Comprehensive CRM strategy development" }
  ];

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // PDF export functionality temporarily disabled
      console.log('PDF export is currently disabled');
      alert('PDF export functionality is currently being updated. Please check back later.');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Actions Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Course Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Export and share course materials
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={isGeneratingPDF ? <CircularProgress size={16} color="inherit" /> : <FilePdfOutlined />}
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                sx={{
                  background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #b71c1c 30%, #d32f2f 90%)',
                  }
                }}
              >
                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                color="primary"
              >
                Download Materials
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Course Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <FileTextOutlined style={{ color: theme.palette.primary.main, fontSize: 24 }} />
                <Typography variant="h5" fontWeight={600}>
                  Course Description
                </Typography>
              </Stack>
              <Typography variant="body1" lineHeight={1.8} color="text.secondary">
                This comprehensive course provides an in-depth study of Customer Relationship Management (CRM) 
                principles and practices. Students will explore advanced CRM strategies, data analytics, 
                customer segmentation, and technology implementation across various industries. Through practical 
                exercises and real-world case studies, participants will develop the skills needed to design, 
                implement, and optimize CRM systems that drive business growth and customer satisfaction.
              </Typography>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <TrophyOutlined style={{ color: theme.palette.warning.main, fontSize: 24 }} />
                <Typography variant="h5" fontWeight={600}>
                  Learning Objectives
                </Typography>
              </Stack>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Understand core course concepts and principles" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Apply theoretical knowledge to practical scenarios" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Develop skills for real-world implementation" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Course Modules */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <BookOutlined style={{ color: theme.palette.info.main, fontSize: 24 }} />
                <Typography variant="h5" fontWeight={600}>
                  Course Outline
                </Typography>
              </Stack>
              
              {courseModules.length > 0 ? (
                courseModules.map((module, index) => (
                  <Accordion key={module.id || index} sx={{ mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <Chip 
                          label={`Module ${index + 1}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                          {module.title}
                        </Typography>
                        <Chip 
                          label={`${getModuleDisplayDuration(module)} min`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {module.summary || 'Module content and learning objectives will be detailed here.'}
                      </Typography>
                      {module.activities && module.activities.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Activities ({module.activities.length}):
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {module.activities.map((activity, actIndex) => (
                              <Chip
                                key={actIndex}
                                label={activity.title}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <BookOutlined style={{ fontSize: 48, color: theme.palette.grey[400], marginBottom: 16 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Modules Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Course modules will appear here once they are created.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Requirements */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <QuestionCircleOutlined style={{ color: theme.palette.warning.main, fontSize: 24 }} />
                <Typography variant="h6" fontWeight={600}>
                  Prerequisites
                </Typography>
              </Stack>
              <List sx={{ p: 0 }}>
                {requirements.map((req, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Box 
                        sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.primary.main 
                        }} 
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={req}
                      primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <TrophyOutlined style={{ color: theme.palette.error.main, fontSize: 24 }} />
                <Typography variant="h6" fontWeight={600}>
                  Assessment Methods
                </Typography>
              </Stack>
              <Stack spacing={2}>
                {assessmentMethods.map((method, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {method.type}
                      </Typography>
                      <Chip label={method.weight} size="small" color="primary" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                    {index < assessmentMethods.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Course Progress */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Course Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Completion Rate</Typography>
                    <Typography variant="body2" fontWeight={600}>0%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={0} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {courseModules.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Modules
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {totalActivities}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activities
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseSyllabus;
