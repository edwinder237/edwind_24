import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
  TextField,
  IconButton,
  ListItemSecondaryAction,
  Popover,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
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
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { calculateCourseDurationFromModules, getModuleDisplayDuration } from 'utils/durationCalculations';
import { 
  getCourseObjectives, 
  addCourseObjective, 
  updateCourseObjective, 
  deleteCourseObjective 
} from 'store/reducers/courses';


const CourseSyllabus = ({ course, modules }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { courseObjectives } = useSelector((state) => state.courses);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [editText, setEditText] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, index: -1, anchorEl: null });
  const [courseDescription, setCourseDescription] = useState(
    "This comprehensive course provides an in-depth study of Customer Relationship Management (CRM) principles and practices. Students will explore advanced CRM strategies, data analytics, customer segmentation, and technology implementation across various industries. Through practical exercises and real-world case studies, participants will develop the skills needed to design, implement, and optimize CRM systems that drive business growth and customer satisfaction."
  );
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  
  // Assessment methods management states
  const [assessmentMethods, setAssessmentMethods] = useState([
    { type: "Quizzes", weight: "30%", description: "Module-based knowledge checks" },
    { type: "Practical Exercises", weight: "40%", description: "Hands-on CRM implementations" },
    { type: "Final Project", weight: "30%", description: "Comprehensive CRM strategy development" }
  ]);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [editAssessment, setEditAssessment] = useState({ type: '', weight: '', description: '' });
  const [newAssessment, setNewAssessment] = useState({ type: '', weight: '', description: '' });
  const [showAddAssessmentField, setShowAddAssessmentField] = useState(false);
  const [deleteAssessmentConfirm, setDeleteAssessmentConfirm] = useState({ open: false, index: -1, anchorEl: null });
  
  // Prerequisites management states
  const [prerequisites, setPrerequisites] = useState([
    "Basic understanding of business concepts",
    "Computer literacy and internet access",
    "Willingness to engage in practical exercises",
    "No prior CRM experience required"
  ]);
  const [editingPrerequisite, setEditingPrerequisite] = useState(null);
  const [editPrerequisiteText, setEditPrerequisiteText] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [showAddPrerequisiteField, setShowAddPrerequisiteField] = useState(false);
  const [deletePrerequisiteConfirm, setDeletePrerequisiteConfirm] = useState({ open: false, index: -1, anchorEl: null });
  
  // Role assignments management states
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showAddRoleField, setShowAddRoleField] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState({ open: false, assignmentId: null, anchorEl: null });
  
  // Curriculum management states
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [courseCurriculums, setCourseCurriculums] = useState([]);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);
  const [savingCurriculums, setSavingCurriculums] = useState(false);
  
  const courseModules = modules || [];
  
  // Memoize filtered available roles to avoid recalculating on every render
  const filteredAvailableRoles = useMemo(() => {
    return availableRoles.filter(role => 
      !roleAssignments.some(assignment => assignment.roleId === role.id)
    );
  }, [availableRoles, roleAssignments]);

  // Define functions before memoizing them
  const fetchRoleAssignments = useCallback(async () => {
    if (!course?.id) return;
    
    setLoadingRoles(true);
    try {
      const response = await fetch(`/api/courses/manage-role-assignments?courseId=${course.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setRoleAssignments(data.assignments || []);
      } else {
        console.error('Error fetching role assignments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching role assignments:', error);
    } finally {
      setLoadingRoles(false);
    }
  }, [course?.id]);

  const fetchAvailableRoles = useCallback(async () => {
    if (!course?.id) return;
    
    try {
      const response = await fetch(`/api/courses/manage-role-assignments?courseId=${course.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableRoles(data.availableRoles || []);
      }
    } catch (error) {
      console.error('Error fetching available roles:', error);
    }
  }, [course?.id]);

  // Fetch course objectives on component mount
  useEffect(() => {
    if (course?.id) {
      dispatch(getCourseObjectives(course.id));
      fetchRoleAssignments();
    }
  }, [course?.id, dispatch, fetchRoleAssignments]);

  // Cache available roles to avoid repeated fetching
  useEffect(() => {
    if (availableRoles.length === 0 && course?.id) {
      fetchAvailableRoles();
    }
  }, [course?.id, availableRoles.length, fetchAvailableRoles]);


  // Calculate totals using dynamic calculation
  const totalDuration = calculateCourseDurationFromModules(courseModules);
  const totalActivities = courseModules.reduce((acc, module) => 
    acc + (module.activities?.length || 0), 0);



  // Learning objectives management functions
  const handleAddObjective = () => {
    if (newObjective.trim() && course?.id) {
      dispatch(addCourseObjective(course.id, newObjective.trim()));
      setNewObjective('');
      setShowAddField(false);
    }
  };

  const handleShowAddField = () => {
    setShowAddField(true);
  };

  const handleCancelAdd = () => {
    setShowAddField(false);
    setNewObjective('');
  };

  const handleDeleteClick = (event, index) => {
    setDeleteConfirm({
      open: true,
      index: index,
      anchorEl: event.currentTarget
    });
  };

  const handleDeleteConfirm = () => {
    const objectiveToDelete = courseObjectives[deleteConfirm.index];
    if (objectiveToDelete?.id) {
      dispatch(deleteCourseObjective(objectiveToDelete.id));
    }
    setDeleteConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleEditObjective = (index) => {
    setEditingObjective(index);
    setEditText(courseObjectives[index]?.objective || '');
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingObjective !== null) {
      const objectiveToUpdate = courseObjectives[editingObjective];
      if (objectiveToUpdate?.id) {
        dispatch(updateCourseObjective(objectiveToUpdate.id, editText.trim()));
      }
    }
    setEditingObjective(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingObjective(null);
    setEditText('');
  };

  // Course description management functions
  const handleEditDescription = () => {
    setEditingDescription(true);
    setTempDescription(courseDescription);
  };

  const handleSaveDescription = () => {
    if (tempDescription.trim()) {
      setCourseDescription(tempDescription.trim());
    }
    setEditingDescription(false);
    setTempDescription('');
  };

  const handleCancelDescription = () => {
    setEditingDescription(false);
    setTempDescription('');
  };

  // Assessment methods management functions
  const handleAddAssessment = () => {
    if (newAssessment.type.trim() && newAssessment.weight.trim() && newAssessment.description.trim()) {
      setAssessmentMethods([...assessmentMethods, {
        type: newAssessment.type.trim(),
        weight: newAssessment.weight.trim(),
        description: newAssessment.description.trim()
      }]);
      setNewAssessment({ type: '', weight: '', description: '' });
      setShowAddAssessmentField(false);
    }
  };

  const handleShowAddAssessmentField = () => {
    setShowAddAssessmentField(true);
  };

  const handleCancelAddAssessment = () => {
    setShowAddAssessmentField(false);
    setNewAssessment({ type: '', weight: '', description: '' });
  };

  const handleDeleteAssessmentClick = (event, index) => {
    setDeleteAssessmentConfirm({
      open: true,
      index: index,
      anchorEl: event.currentTarget
    });
  };

  const handleDeleteAssessmentConfirm = () => {
    setAssessmentMethods(assessmentMethods.filter((_, i) => i !== deleteAssessmentConfirm.index));
    setDeleteAssessmentConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleDeleteAssessmentCancel = () => {
    setDeleteAssessmentConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleEditAssessment = (index) => {
    setEditingAssessment(index);
    setEditAssessment(assessmentMethods[index]);
  };

  const handleSaveAssessmentEdit = () => {
    if (editAssessment.type.trim() && editAssessment.weight.trim() && editAssessment.description.trim()) {
      const updated = [...assessmentMethods];
      updated[editingAssessment] = {
        type: editAssessment.type.trim(),
        weight: editAssessment.weight.trim(),
        description: editAssessment.description.trim()
      };
      setAssessmentMethods(updated);
    }
    setEditingAssessment(null);
    setEditAssessment({ type: '', weight: '', description: '' });
  };

  const handleCancelAssessmentEdit = () => {
    setEditingAssessment(null);
    setEditAssessment({ type: '', weight: '', description: '' });
  };

  // Prerequisites management functions
  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setPrerequisites([...prerequisites, newPrerequisite.trim()]);
      setNewPrerequisite('');
      setShowAddPrerequisiteField(false);
    }
  };

  const handleShowAddPrerequisiteField = () => {
    setShowAddPrerequisiteField(true);
  };

  const handleCancelAddPrerequisite = () => {
    setShowAddPrerequisiteField(false);
    setNewPrerequisite('');
  };

  const handleDeletePrerequisiteClick = (event, index) => {
    setDeletePrerequisiteConfirm({
      open: true,
      index: index,
      anchorEl: event.currentTarget
    });
  };

  const handleDeletePrerequisiteConfirm = () => {
    setPrerequisites(prerequisites.filter((_, i) => i !== deletePrerequisiteConfirm.index));
    setDeletePrerequisiteConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleDeletePrerequisiteCancel = () => {
    setDeletePrerequisiteConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleEditPrerequisite = (index) => {
    setEditingPrerequisite(index);
    setEditPrerequisiteText(prerequisites[index]);
  };

  const handleSavePrerequisiteEdit = () => {
    if (editPrerequisiteText.trim()) {
      const updated = [...prerequisites];
      updated[editingPrerequisite] = editPrerequisiteText.trim();
      setPrerequisites(updated);
    }
    setEditingPrerequisite(null);
    setEditPrerequisiteText('');
  };

  const handleCancelPrerequisiteEdit = () => {
    setEditingPrerequisite(null);
    setEditPrerequisiteText('');
  };

  // Role assignments management functions
  const handleAddRole = useCallback(async () => {
    if (!selectedRoleId || !course?.id) return;
    
    // Store the current selectedRoleId before clearing it
    const roleIdToAdd = selectedRoleId;
    
    // Optimistic update: Find the role being added
    const roleToAdd = availableRoles.find(role => role.id === parseInt(roleIdToAdd));
    if (!roleToAdd) return;

    // Create optimistic assignment
    const optimisticAssignment = {
      id: Date.now(), // Temporary ID
      roleId: roleToAdd.id,
      isRequired: true,
      role: {
        id: roleToAdd.id,
        title: roleToAdd.title,
        description: roleToAdd.description
      }
    };

    // Update UI immediately
    setRoleAssignments(prev => [...prev, optimisticAssignment]);
    setSelectedRoleId('');
    setShowAddRoleField(false);
    
    try {
      const response = await fetch('/api/courses/manage-role-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          roleId: parseInt(roleIdToAdd),
          isRequired: true
        })
      });
      
      if (response.ok) {
        // Refresh to get the real ID from server
        await fetchRoleAssignments();
      } else {
        // Rollback optimistic update on error
        setRoleAssignments(prev => prev.filter(assignment => assignment.id !== optimisticAssignment.id));
        setSelectedRoleId(roleIdToAdd);
        setShowAddRoleField(true);
        
        const data = await response.json();
        console.error('Error adding role:', data.error);
      }
    } catch (error) {
      // Rollback optimistic update on error
      setRoleAssignments(prev => prev.filter(assignment => assignment.id !== optimisticAssignment.id));
      setSelectedRoleId(roleIdToAdd);
      setShowAddRoleField(true);
      console.error('Error adding role:', error);
    }
  }, [selectedRoleId, course?.id, availableRoles, fetchRoleAssignments]);

  const handleDeleteRole = useCallback(async () => {
    const { assignmentId } = deleteRoleConfirm;
    if (!assignmentId) return;
    
    // Optimistic update: Remove from UI immediately
    const assignmentToDelete = roleAssignments.find(assignment => assignment.id === assignmentId);
    setRoleAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    setDeleteRoleConfirm({ open: false, assignmentId: null, anchorEl: null });
    
    try {
      const response = await fetch(`/api/courses/manage-role-assignments?id=${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        // Rollback optimistic update on error
        if (assignmentToDelete) {
          setRoleAssignments(prev => [...prev, assignmentToDelete]);
        }
        
        const data = await response.json();
        console.error('Error deleting role:', data.error);
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (assignmentToDelete) {
        setRoleAssignments(prev => [...prev, assignmentToDelete]);
      }
      console.error('Error deleting role:', error);
    }
  }, [deleteRoleConfirm, roleAssignments]);

  const handleDeleteRoleClick = (event, assignmentId) => {
    setDeleteRoleConfirm({
      open: true,
      assignmentId,
      anchorEl: event.currentTarget
    });
  };

  const handleDeleteRoleCancel = () => {
    setDeleteRoleConfirm({ open: false, assignmentId: null, anchorEl: null });
  };

  const handleShowAddRoleField = () => {
    setShowAddRoleField(true);
  };

  const handleCancelAddRole = () => {
    setShowAddRoleField(false);
    setSelectedRoleId('');
  };

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

  // Curriculum management functions
  const handleOpenCurriculumDialog = async () => {
    if (!course?.id) return;
    
    setCurriculumDialogOpen(true);
    setLoadingCurriculums(true);
    
    try {
      const response = await fetch(`/api/courses/curriculum-assignments?courseId=${course.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableCurriculums(data.availableCurriculums || []);
        setCourseCurriculums(data.courseCurriculums || []);
      } else {
        console.error('Error fetching curriculums:', data.error);
      }
    } catch (error) {
      console.error('Error fetching curriculums:', error);
    } finally {
      setLoadingCurriculums(false);
    }
  };

  const handleCloseCurriculumDialog = () => {
    setCurriculumDialogOpen(false);
    setAvailableCurriculums([]);
    setCourseCurriculums([]);
  };

  const handleCurriculumToggle = (curriculumId, isCurrentlyAssigned) => {
    if (isCurrentlyAssigned) {
      // Remove from course curriculums
      setCourseCurriculums(prev => prev.filter(c => c.curriculumId !== curriculumId));
    } else {
      // Add to course curriculums
      const curriculumToAdd = availableCurriculums.find(c => c.id === curriculumId);
      if (curriculumToAdd) {
        setCourseCurriculums(prev => [...prev, {
          curriculumId: curriculumToAdd.id,
          currculum: curriculumToAdd
        }]);
      }
    }
  };

  const handleSaveCurriculumAssignments = async () => {
    if (!course?.id) return;
    
    setSavingCurriculums(true);
    
    try {
      const response = await fetch('/api/courses/curriculum-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          curriculumIds: courseCurriculums.map(c => c.curriculumId)
        })
      });
      
      if (response.ok) {
        alert('Curriculum assignments updated successfully!');
        handleCloseCurriculumDialog();
      } else {
        const data = await response.json();
        console.error('Error saving curriculum assignments:', data.error);
        alert('Failed to update curriculum assignments. Please try again.');
      }
    } catch (error) {
      console.error('Error saving curriculum assignments:', error);
      alert('Failed to update curriculum assignments. Please try again.');
    } finally {
      setSavingCurriculums(false);
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
                startIcon={<AppstoreOutlined />}
                onClick={handleOpenCurriculumDialog}
                color="primary"
                sx={{
                  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  }
                }}
              >
                Manage Curriculums
              </Button>
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
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <FileTextOutlined style={{ color: theme.palette.primary.main, fontSize: 24 }} />
                  <Typography variant="h5" fontWeight={600}>
                    Course Description
                  </Typography>
                </Stack>
                {!editingDescription && (
                  <IconButton
                    size="small"
                    onClick={handleEditDescription}
                    color="primary"
                  >
                    <EditOutlined />
                  </IconButton>
                )}
              </Stack>
              
              {editingDescription ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={tempDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setTempDescription(e.target.value);
                      }
                    }}
                    variant="outlined"
                    placeholder="Enter course description..."
                    helperText={`${tempDescription.length}/500 characters`}
                    autoFocus
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-root': {
                        minHeight: '200px'
                      }
                    }}
                  />
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={handleCancelDescription}
                      startIcon={<CloseOutlined />}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveDescription}
                      startIcon={<SaveOutlined />}
                      disabled={!tempDescription.trim()}
                    >
                      Save
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body1" lineHeight={1.8} color="text.secondary">
                  {courseDescription}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrophyOutlined style={{ color: theme.palette.warning.main, fontSize: 24 }} />
                  <Typography variant="h5" fontWeight={600}>
                    Learning Objectives
                  </Typography>
                </Stack>
                {!showAddField && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowAddField}
                    startIcon={<PlusOutlined />}
                  >
                    Add
                  </Button>
                )}
              </Stack>
              
              <List sx={{ mb: 2 }}>
                {courseObjectives.map((objectiveData, index) => (
                  <ListItem key={objectiveData.id || index} sx={{ pl: 0, pr: 0 }}>
                    <ListItemIcon>
                      <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                    </ListItemIcon>
                    {editingObjective === index ? (
                      <TextField
                        fullWidth
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        variant="outlined"
                        size="small"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                    ) : (
                      <ListItemText primary={objectiveData.objective} />
                    )}
                    <ListItemSecondaryAction>
                      {editingObjective === index ? (
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={handleSaveEdit}
                            color="primary"
                          >
                            <SaveOutlined />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            color="secondary"
                          >
                            <CloseOutlined />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditObjective(index)}
                            color="primary"
                          >
                            <EditOutlined />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteClick(e, index)}
                            color="error"
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Stack>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {/* Add new objective */}
              {showAddField && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Add new learning objective..."
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    variant="outlined"
                    size="small"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                    autoFocus
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddObjective}
                    startIcon={<SaveOutlined />}
                    disabled={!newObjective.trim()}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelAdd}
                    startIcon={<CloseOutlined />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
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
          {/* Prerequisites */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <QuestionCircleOutlined style={{ color: theme.palette.warning.main, fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Prerequisites
                  </Typography>
                </Stack>
                {!showAddPrerequisiteField && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowAddPrerequisiteField}
                    startIcon={<PlusOutlined />}
                  >
                    Add
                  </Button>
                )}
              </Stack>
              
              <Stack spacing={1}>
                {prerequisites.map((req, index) => (
                  <Box key={index} sx={{ position: 'relative', '&:hover .prerequisite-actions': { opacity: 1 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
                      {editingPrerequisite === index ? (
                        <TextField
                          fullWidth
                          value={editPrerequisiteText}
                          onChange={(e) => setEditPrerequisiteText(e.target.value)}
                          variant="outlined"
                          size="small"
                          onKeyPress={(e) => e.key === 'Enter' && handleSavePrerequisiteEdit()}
                          autoFocus
                          sx={{ mr: 2 }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ lineHeight: 1.5, flexGrow: 1 }}>
                          {req}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1}>
                        {editingPrerequisite === index ? (
                          <>
                            <IconButton
                              size="small"
                              onClick={handleSavePrerequisiteEdit}
                              color="primary"
                            >
                              <SaveOutlined />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelPrerequisiteEdit}
                              color="secondary"
                            >
                              <CloseOutlined />
                            </IconButton>
                          </>
                        ) : (
                          <Stack 
                            direction="row" 
                            spacing={1}
                            className="prerequisite-actions"
                            sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleEditPrerequisite(index)}
                              color="primary"
                            >
                              <EditOutlined />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeletePrerequisiteClick(e, index)}
                              color="error"
                            >
                              <DeleteOutlined />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {/* Add new prerequisite */}
              {showAddPrerequisiteField && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Add new prerequisite..."
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    variant="outlined"
                    size="small"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPrerequisite()}
                    autoFocus
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddPrerequisite}
                    startIcon={<SaveOutlined />}
                    disabled={!newPrerequisite.trim()}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelAddPrerequisite}
                    startIcon={<CloseOutlined />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrophyOutlined style={{ color: theme.palette.error.main, fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Assessment Methods
                  </Typography>
                </Stack>
                {!showAddAssessmentField && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowAddAssessmentField}
                    startIcon={<PlusOutlined />}
                  >
                    Add
                  </Button>
                )}
              </Stack>

              <Stack spacing={2}>
                {assessmentMethods.map((method, index) => (
                  <Box key={index}>
                    {editingAssessment === index ? (
                      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              fullWidth
                              label="Assessment Type"
                              value={editAssessment.type}
                              onChange={(e) => setEditAssessment({...editAssessment, type: e.target.value})}
                              size="small"
                            />
                            <TextField
                              label="Weight"
                              value={editAssessment.weight}
                              onChange={(e) => setEditAssessment({...editAssessment, weight: e.target.value})}
                              size="small"
                              sx={{ minWidth: '100px' }}
                            />
                          </Stack>
                          <TextField
                            fullWidth
                            label="Description"
                            value={editAssessment.description}
                            onChange={(e) => setEditAssessment({...editAssessment, description: e.target.value})}
                            multiline
                            rows={2}
                            size="small"
                          />
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              onClick={handleSaveAssessmentEdit}
                              variant="contained"
                              startIcon={<SaveOutlined />}
                              disabled={!editAssessment.type.trim() || !editAssessment.weight.trim() || !editAssessment.description.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={handleCancelAssessmentEdit}
                              variant="outlined"
                              startIcon={<CloseOutlined />}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative', '&:hover .assessment-actions': { opacity: 1 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {method.type}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip label={method.weight} size="small" color="primary" variant="outlined" />
                            <Stack 
                              direction="row" 
                              spacing={0.5} 
                              className="assessment-actions"
                              sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleEditAssessment(index)}
                                color="primary"
                              >
                                <EditOutlined />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteAssessmentClick(e, index)}
                                color="error"
                              >
                                <DeleteOutlined />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </Box>
                    )}
                    {index < assessmentMethods.length - 1 && editingAssessment !== index && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}

                {/* Add new assessment */}
                {showAddAssessmentField && (
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          fullWidth
                          label="Assessment Type"
                          placeholder="e.g., Quizzes, Projects, Assignments"
                          value={newAssessment.type}
                          onChange={(e) => setNewAssessment({...newAssessment, type: e.target.value})}
                          size="small"
                          autoFocus
                        />
                        <TextField
                          label="Weight"
                          placeholder="e.g., 30%"
                          value={newAssessment.weight}
                          onChange={(e) => setNewAssessment({...newAssessment, weight: e.target.value})}
                          size="small"
                          sx={{ minWidth: '100px' }}
                        />
                      </Stack>
                      <TextField
                        fullWidth
                        label="Description"
                        placeholder="Describe the assessment method..."
                        value={newAssessment.description}
                        onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                        multiline
                        rows={2}
                        size="small"
                      />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={handleAddAssessment}
                          variant="contained"
                          startIcon={<SaveOutlined />}
                          disabled={!newAssessment.type.trim() || !newAssessment.weight.trim() || !newAssessment.description.trim()}
                        >
                          Add Assessment
                        </Button>
                        <Button
                          size="small"
                          onClick={handleCancelAddAssessment}
                          variant="outlined"
                          startIcon={<CloseOutlined />}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Roles Required Training */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <UserOutlined style={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Roles Required Training
                  </Typography>
                </Stack>
                {!showAddRoleField && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowAddRoleField}
                    startIcon={<PlusOutlined />}
                    disabled={loadingRoles}
                  >
                    Add
                  </Button>
                )}
              </Stack>
              
              {loadingRoles ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Stack spacing={1}>
                  {roleAssignments.map((assignment) => (
                    <Box key={assignment.id} sx={{ position: 'relative', '&:hover .role-actions': { opacity: 1 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {assignment.role.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.role.description || 'No description available'}
                          </Typography>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {assignment.isRequired && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="error" 
                              variant="outlined" 
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteRoleClick(e, assignment.id)}
                            color="error"
                            className="role-actions"
                            sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}

                  {/* Add new role */}
                  {showAddRoleField && (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2, mt: 2 }}>
                      <Stack spacing={2}>
                        <TextField
                          select
                          fullWidth
                          label="Select Role"
                          value={selectedRoleId}
                          onChange={(e) => setSelectedRoleId(e.target.value)}
                          size="small"
                          autoFocus
                        >
                          {filteredAvailableRoles.map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                <Stack>
                                  <Typography variant="body2" fontWeight={600}>
                                    {role.title}
                                  </Typography>
                                  {role.description && (
                                    <Typography variant="caption" color="text.secondary">
                                      {role.description}
                                    </Typography>
                                  )}
                                </Stack>
                              </MenuItem>
                            ))}
                        </TextField>
                        
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={handleAddRole}
                            variant="contained"
                            startIcon={<SaveOutlined />}
                            disabled={!selectedRoleId}
                          >
                            Add Role
                          </Button>
                          <Button
                            size="small"
                            onClick={handleCancelAddRole}
                            variant="outlined"
                            startIcon={<CloseOutlined />}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  )}

                  {roleAssignments.length === 0 && !showAddRoleField && !loadingRoles && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                      No roles assigned to this course yet.
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>

        </Grid>
      </Grid>

      {/* Delete Learning Objective Confirmation Popover */}
      <Popover
        open={deleteConfirm.open}
        anchorEl={deleteConfirm.anchorEl}
        onClose={handleDeleteCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Delete Learning Objective
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete this learning objective? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={handleDeleteCancel}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Delete Assessment Confirmation Popover */}
      <Popover
        open={deleteAssessmentConfirm.open}
        anchorEl={deleteAssessmentConfirm.anchorEl}
        onClose={handleDeleteAssessmentCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Delete Assessment Method
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete this assessment method? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={handleDeleteAssessmentCancel}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleDeleteAssessmentConfirm}
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Delete Prerequisite Confirmation Popover */}
      <Popover
        open={deletePrerequisiteConfirm.open}
        anchorEl={deletePrerequisiteConfirm.anchorEl}
        onClose={handleDeletePrerequisiteCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Delete Prerequisite
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete this prerequisite? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={handleDeletePrerequisiteCancel}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleDeletePrerequisiteConfirm}
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Delete Role Assignment Confirmation Popover */}
      <Popover
        open={deleteRoleConfirm.open}
        anchorEl={deleteRoleConfirm.anchorEl}
        onClose={handleDeleteRoleCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Remove Role Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to remove this role from the course? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={handleDeleteRoleCancel}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleDeleteRole}
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Remove
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Curriculum Management Dialog */}
      <Dialog
        open={curriculumDialogOpen}
        onClose={handleCloseCurriculumDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AppstoreOutlined style={{ color: theme.palette.primary.main, fontSize: 24 }} />
            <Typography variant="h6" fontWeight={600}>
              Manage Course Curriculums
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select which curriculums this course should be included in. Changes will be saved when you click "Save Changes".
          </Typography>
          
          {loadingCurriculums ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {availableCurriculums.map((curriculum) => {
                const isAssigned = courseCurriculums.some(c => c.curriculumId === curriculum.id);
                return (
                  <Card key={curriculum.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAssigned}
                            onChange={() => handleCurriculumToggle(curriculum.id, isAssigned)}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ margin: 0 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {curriculum.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {curriculum.description || 'No description available'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Chip 
                            label={`${curriculum._count?.curriculum_courses || 0} courses`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Stack>
                      </Box>
                      {isAssigned && (
                        <Chip 
                          label="Assigned" 
                          size="small" 
                          color="success" 
                          variant="filled" 
                        />
                      )}
                    </Stack>
                  </Card>
                );
              })}
              
              {availableCurriculums.length === 0 && !loadingCurriculums && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AppstoreOutlined style={{ fontSize: 48, color: theme.palette.grey[400], marginBottom: 16 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Curriculums Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    There are no curriculums available to assign this course to.
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseCurriculumDialog} 
            variant="outlined"
            disabled={savingCurriculums}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCurriculumAssignments} 
            variant="contained"
            disabled={savingCurriculums || loadingCurriculums}
            startIcon={savingCurriculums ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
          >
            {savingCurriculums ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseSyllabus;
