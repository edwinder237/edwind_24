import React, { useState, useEffect, useRef, forwardRef } from "react";
import Loader from "components/Loader";
import {
  getUserStory,
  getUserStoryOrder,
  getProfiles,
  getComments,
  getModules,
  getCourses,
  getColumnsOrder,
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "store/reducers/courses";
import { useDispatch, useSelector } from "store";


// material-ui
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Paper,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  ListItemSecondaryAction,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Fab,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';

// project import
import Layout from "layout";
import Page from "components/Page";
import MainCard from "components/MainCard";
import AnalyticEcommerce from "components/cards/statistics/AnalyticEcommerce";
import AnalyticActivityType from "components/cards/statistics/AnalyticActivityType";

import TextEditor from "../components/content/TextEditor";
import CourseSyllabus from "../components/content/CourseSyllabus";
import CourseContent from "../components/content/CourseContent";
import CourseSettings from "../components/settings/CourseSettings";
import ChecklistItemForm from "components/ChecklistItemForm";
import UnifiedRoleAssignmentManager from "components/UnifiedRoleAssignmentManager";

import { calculateCourseDurationFromModules } from 'utils/durationCalculations';

// assets
import {
  GiftOutlined,
  MessageOutlined,
  SettingOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlayCircleOutlined,
  UsergroupAddOutlined,
  CheckSquareOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
//import { getModules } from "utils/getModules";


// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: "1rem",
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: "auto",
  right: "auto",
  alignSelf: "flex-start",
  transform: "none",
};

// sales report status
const status = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "year",
    label: "This Year",
  },
];

// Tab Panel Component - MOVED OUTSIDE to prevent recreation on re-renders
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      style={{ display: value === index ? 'block' : 'none' }}
      {...other}
    >
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    </div>
  );
}



// ==============================|| COURSE EDIT PAGE ||============================== //



// Analytics will be implemented with real data from API

function renderAnalytics() {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <BarChartOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
      <Typography variant="h6" gutterBottom>Course Analytics</Typography>
      <Typography variant="body2" color="text.secondary">
        Analytics and insights for course performance will be available here once data is collected.
      </Typography>
    </Box>
  );
}

// ==============================|| COURSE EDIT PAGE ||============================== //

const CourseEditPage = ({ courseId }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(false);
  const [JSON, setJSON] = useState();
  const [currentTab, setCurrentTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const textEditorRef = useRef(null);
  const { courses, modules, checklistItems, checklistLoading } = useSelector((state) => state.courses);

  
  const course = courses.find(
    (course) => course.id.toString() === courseId
  );
  
  useEffect(() => {
    const modules = dispatch(getModules(courseId));
    Promise.all([modules]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Move Editor component outside to prevent recreation on every render
  const Editor = React.memo(forwardRef(({ ...props }, ref) => {
    console.log('Editor component rendering with props:', props);
    console.log('Editor ref:', ref);
    return <TextEditor {...props} ref={ref} />;
  }));
  
  Editor.displayName = 'Editor';

  const getSelectedModuleId = (selectedCardId) => {
    console.log('Setting selected module ID:', selectedCardId);
    setSelectedModuleId(selectedCardId);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Reset module selection when changing tabs
    if (newValue !== 1) {
      setSelectedModuleId(false);
    }
    // Fetch checklist items when checklist tab is selected
    if (newValue === 4 && courseId) {
      dispatch(getChecklistItems(courseId));
    }
  };

  // Checklist CRUD handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingItem) {
        await dispatch(updateChecklistItem(formData));
      } else {
        await dispatch(createChecklistItem(formData));
      }
      setFormOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving checklist item:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await dispatch(deleteChecklistItem(itemToDelete.id));
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Error deleting checklist item:', error);
      }
    }
  };

  // Tab configuration
  const tabs = [
    { 
      label: 'Course Syllabus', 
      icon: <FileTextOutlined />,
      description: 'Overview and course information'
    },
    { 
      label: 'Course Content', 
      icon: <BookOutlined />,
      description: 'Modules and learning materials'
    },
    { 
      label: 'Analytics', 
      icon: <BarChartOutlined />,
      description: 'Course statistics and insights'
    },
    { 
      label: 'Participants', 
      icon: <UsergroupAddOutlined />,
      description: 'Enrolled students and progress'
    },
    { 
      label: 'Role Assignments', 
      icon: <TeamOutlined />,
      description: 'Assign course to participant roles'
    },
    { 
      label: 'Checklist', 
      icon: <CheckSquareOutlined />,
      description: 'Course checklist and tasks'
    },
    { 
      label: 'Settings', 
      icon: <SettingOutlined />,
      description: 'Course configuration and instructors'
    }
  ];

  // Placeholder components for tabs
  const renderParticipants = () => (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <TeamOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
      <Typography variant="h6" gutterBottom>Course Participants</Typography>
      <Typography variant="body2" color="text.secondary">
        Student enrollment, progress tracking, and participant management will be available here.
      </Typography>
    </Paper>
  );


  const renderChecklist = () => {
    if (checklistLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    // Group items by category
    const groupedItems = checklistItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'content': return <BookOutlined />;
        case 'technical': return <SettingOutlined />;
        case 'review': return <FileTextOutlined />;
        case 'instructor': return <UserOutlined />;
        default: return <CheckSquareOutlined />;
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'default';
      }
    };

    return (
      <Box sx={{ position: 'relative' }}>
        {/* Header with Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Course Checklist ({checklistItems.length} items)
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={handleAddItem}
            color="primary"
          >
            Add Item
          </Button>
        </Box>

        {/* Empty State */}
        {checklistItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckSquareOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
            <Typography variant="h6" gutterBottom>No Checklist Items</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first checklist item to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Add First Item
            </Button>
          </Paper>
        ) : (
          /* Checklist Items */
          Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category} sx={{ mb: 2 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {getCategoryIcon(category)}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {category} ({items.length})
                  </Typography>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <List>
                  {items.map((item) => (
                    <ListItem 
                      key={item.id} 
                      sx={{ 
                        pl: 0,
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          '& .item-actions': {
                            opacity: 1
                          }
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox 
                          checked={false}
                          disabled
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {item.title}
                            </Typography>
                            <Chip 
                              label={item.priority} 
                              size="small" 
                              color={getPriorityColor(item.priority)}
                              variant="outlined"
                            />
                            {item.module && (
                              <Chip 
                                label={`Module: ${item.module.title}`} 
                                size="small" 
                                variant="outlined"
                                color="info"
                              />
                            )}
                            {item.itemOrder && (
                              <Chip 
                                label={`Order: ${item.itemOrder}`} 
                                size="small" 
                                variant="outlined"
                                color="default"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {item.description && (
                              <Typography variant="body2" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              Category: {item.category} • Created: {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box 
                          className="item-actions"
                          sx={{ 
                            opacity: 1, // Always visible
                            display: 'flex',
                            gap: 0.5
                          }}
                        >
                          <Tooltip title="Edit checklist item">
                            <IconButton
                              size="small"
                              onClick={() => handleEditItem(item)}
                              color="primary"
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText'
                                }
                              }}
                            >
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete checklist item">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteItem(item)}
                              color="error"
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'error.light',
                                  color: 'error.contrastText'
                                }
                              }}
                            >
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))
        )}

        {/* Floating Action Button for Mobile/Quick Access */}
        <Fab
          color="primary"
          aria-label="add checklist item"
          onClick={handleAddItem}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }, // Only show on mobile
            zIndex: 1000
          }}
        >
          <PlusOutlined />
        </Fab>

        {/* Form Dialog */}
        <ChecklistItemForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          item={editingItem}
          courseId={courseId}
          modules={modules}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
              <DeleteOutlined />
              <Typography variant="h6">Confirm Delete</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to delete this checklist item? This action cannot be undone.
            </DialogContentText>
            {itemToDelete && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {itemToDelete.title}
                </Typography>
                {itemToDelete.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {itemToDelete.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={itemToDelete.category} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={itemToDelete.priority} 
                    size="small" 
                    color={getPriorityColor(itemToDelete.priority)}
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              startIcon={<DeleteOutlined />}
            >
              Delete Item
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const renderSettings = () => (
    <CourseSettings course={course} courseId={courseId} />
  );

  if (loading) return <Loader />;
  
  if (!course) {
    return (
      <Page title="Course Not Found">
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Course Not Found
            </Typography>
            <Typography variant="body1" color="textSecondary">
              The course with ID {courseId} could not be found.
            </Typography>
          </Box>
        </MainCard>
      </Page>
    );
  }

  function getJSON(JSON) {
    setJSON(JSON);
  }
  const handleSave = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('selectedModuleId:', selectedModuleId);
    console.log('textEditorRef.current:', textEditorRef.current);
    console.log('textEditorRef.current?.save:', textEditorRef.current?.save);
    
    if (!selectedModuleId) {
      console.warn('No module selected');
      return;
    }
    
    if (!textEditorRef.current) {
      console.warn('Text editor ref not available');
      return;
    }
    
    if (!textEditorRef.current.save) {
      console.warn('Save method not available on ref');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Calling save function...');
      await textEditorRef.current.save();
      console.log('Save completed successfully');
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStuff = () => {
    setIsDeleting(true);
  };



  const totalDuration = calculateCourseDurationFromModules(modules) || 0;
  
  const totalModules = modules?.length?.toString() || '0';

  const totalPractical = modules
    ?.map(
      (module) =>
        module.activities?.filter(
          (activity) => activity.activityCategory === "Exercise"
        ).length || 0
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    ?.toString() || '0';

  const totalQuiz = modules
    ?.map(
      (module) =>
        module.activities?.filter((activity) => activity.activityCategory === "Quiz")
          .length || 0
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    ?.toString() || '0';
    
  const totalPassive = modules
    ?.map(
      (module) =>
        module.activities?.filter((activity) => activity.activityCategory === "Reading")
          .length || 0
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    ?.toString() || '0';

  const activitiesAnalysis = {
    practical: totalPractical,
    quiz: totalQuiz,
    passive: totalPassive,
  };

  if (modules) {
    return (
      <Page title="Course Details">
        <Box sx={{ width: '100%' }}>
          {/* Course Header */}
          <Card 
            sx={{ 
              mb: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h3" fontWeight={700} gutterBottom>
                    {course?.title || 'Course Details'}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    {course?.summary || 'Comprehensive course overview and learning path'}
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip 
                      icon={<ClockCircleOutlined />}
                      label={`${totalDuration} minutes`}
                      variant="outlined"
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                    <Chip 
                      icon={<BookOutlined />}
                      label={`${modules?.length || 0} modules`}
                      variant="outlined"
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                    <Chip 
                      icon={<PlayCircleOutlined />}
                      label={`${modules?.reduce((acc, module) => acc + (module.activities?.length || 0), 0) || 0} activities`}
                      variant="outlined"
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    textAlign: { xs: 'left', md: 'center' },
                    mt: { xs: 3, md: 0 },
                    pt: { xs: 3, md: 0 },
                    borderTop: { xs: `1px solid ${'rgba(255,255,255,0.2)'}`, md: 'none' }
                  }}>
                    <Stack direction={{ xs: 'row', md: 'column' }} spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          width: { xs: 60, md: 80 },
                          height: { xs: 60, md: 80 },
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }}
                      >
                        <UserOutlined style={{ fontSize: '2rem' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ opacity: 0.7, mb: { xs: 0, md: 1 } }}>
                          Instructor
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {course?.course_instructors?.[0]?.instructor?.firstName} {course?.course_instructors?.[0]?.instructor?.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {course?.course_instructors?.[0]?.instructor?.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <Paper sx={{ mb: 0 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ 
                    minHeight: 64,
                    '& .MuiTab-iconWrapper': { mb: 0, mr: 1 }
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <TabPanel value={currentTab} index={0}>
            <CourseSyllabus course={course} modules={modules} />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <CourseContent courseId={courseId} />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {renderAnalytics()}
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {renderParticipants()}
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <UnifiedRoleAssignmentManager 
              courseId={courseId}
              modules={modules || []}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={5}>
            {renderChecklist()}
          </TabPanel>

          <TabPanel value={currentTab} index={6}>
            {renderSettings()}
          </TabPanel>
        </Box>
      </Page>
    );
  }
};

CourseEditPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CourseEditPage;
