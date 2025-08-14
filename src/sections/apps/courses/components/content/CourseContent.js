import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Typography, Grid, Button, Card, CardContent, CardHeader, Avatar, IconButton, Collapse, TextField, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';
import { Add, VideocamOutlined, DescriptionOutlined, GroupOutlined, SlideshowOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined, PlaylistAddOutlined, CheckCircleOutline, ExpandMore, ExpandLess, Circle, NotesOutlined, AccessTimeOutlined, Save, Cancel, BookOutlined } from '@mui/icons-material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineDot, TimelineContent } from '@mui/lab';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import ActivityCard from 'components/ActivityCard';
import ModuleCard from 'components/ModuleCard';
import dynamic from 'next/dynamic';

const ModuleLevelDialog = dynamic(() => import('components/ModuleLevelDialog'), {
  ssr: false,
  loading: () => null
});
import { updateModulesOrder, updateActivitiesOrder, addModule, editModule, createActivity, deleteItem, deleteActivity, duplicateModule, updateModuleLevel, updateActivity } from 'store/reducers/courses';
import { openSnackbar } from 'store/reducers/snackbar';

// Helper function to format duration (moved outside components)
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const EmptyDropZone = ({ type, index, onDrop, isLast = false }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: type,
    canDrop: (draggedItem) => {
      let dropIndex;
      if (index === -1) {
        // Dropping at the beginning
        dropIndex = 0;
      } else if (isLast) {
        // Dropping at the end
        dropIndex = index + 1;
      } else {
        // Dropping between items
        dropIndex = index + 1;
      }
      
      // Prevent dropping at current position or adjacent positions
      const currentIndex = draggedItem.index;
      return dropIndex !== currentIndex && dropIndex !== currentIndex + 1;
    },
    drop: (draggedItem) => {
      let dropIndex;
      if (index === -1) {
        // Dropping at the beginning
        dropIndex = 0;
      } else if (isLast) {
        // Dropping at the end
        dropIndex = index + 1;
      } else {
        // Dropping between items
        dropIndex = index + 1;
      }
      
      // Only move if the drop index is different from the current index
      if (draggedItem.index !== dropIndex) {
        onDrop(draggedItem.index, dropIndex);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const showDropZone = isOver && canDrop;

  return (
    <Box
      ref={drop}
      sx={{
        height: showDropZone ? 50 : 8,
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: showDropZone ? '2px dashed' : '1px dashed transparent',
        borderColor: showDropZone ? (type === 'module' ? 'primary.main' : 'success.main') : 'transparent',
        borderRadius: 2,
        backgroundColor: showDropZone ? (type === 'module' ? 'primary.light' : 'success.light') : 'transparent',
        mx: 1,
        my: showDropZone ? 0.5 : 0.25,
        opacity: showDropZone ? 1 : 0.3,
        '&:hover': {
          opacity: canDrop ? 0.7 : 0.3,
          backgroundColor: canDrop ? (type === 'module' ? 'primary.lighter' : 'success.lighter') : 'transparent',
        }
      }}
    >
      {showDropZone && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: type === 'module' ? 'primary.main' : 'success.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {type === 'module' ? '📚' : '📝'} Drop {type} here
        </Typography>
      )}
    </Box>
  );
};

const DraggableModuleCard = ({ module, index, onUpdateTitle, onCancelEdit, onDelete, onDuplicate, onSetLevel, onClearDurationOverride, isSelected, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'module',
    item: () => ({ id: module.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg) scale(1.05)' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease-in-out',
        zIndex: isDragging ? 1000 : 'auto',
        boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.2)' : 'none',
        '&:hover': {
          transform: isDragging ? 'rotate(5deg) scale(1.05)' : 'translateY(-2px)',
          boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.1)',
        }
      }}
    >
      <ModuleCard 
        module={module} 
        index={index}
        onUpdateTitle={onUpdateTitle}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onSetLevel={onSetLevel}
        onClearDurationOverride={onClearDurationOverride}
        isSelected={isSelected}
        onClick={onClick}
      />
    </Box>
  );
};

// Edit Activity Dialog Component
const EditActivityDialog = ({ open, onClose, onSave, activity }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    type: 'presentation',
    contentUrl: ''
  });

  // Update form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || activity.summary || '',
        duration: activity.duration || 0,
        type: activity.type || activity.activityType || 'presentation',
        contentUrl: activity.contentUrl || ''
      });
    }
  }, [activity]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave({
      title: formData.title,
      summary: formData.description, // Use summary field for API compatibility
      duration: parseInt(formData.duration) || 0,
      activityType: formData.type,
      contentUrl: formData.contentUrl
    });
  };

  const activityTypes = [
    { value: 'video', label: 'Video', icon: VideocamOutlined },
    { value: 'lecture', label: 'Lecture', icon: DescriptionOutlined },
    { value: 'presentation', label: 'Presentation', icon: SlideshowOutlined },
    { value: 'group_activity', label: 'Group Activity', icon: GroupOutlined }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MainCard
        title="Edit Activity"
        content={false}
        sx={{ m: 0 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title */}
            <TextField
              label="Activity Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              variant="outlined"
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />

            {/* Content URL */}
            <TextField
              label="Content URL"
              value={formData.contentUrl}
              onChange={(e) => handleInputChange('contentUrl', e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="https://example.com/content"
            />

            {/* Duration */}
            <TextField
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              fullWidth
              variant="outlined"
              inputProps={{
                min: 0,
                max: 9999
              }}
            />

            {/* Activity Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Activity Type"
              >
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon style={{ fontSize: 18 }} />
                        {type.label}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.title.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </MainCard>
    </Dialog>
  );
};

// Add Activity Dialog Component
const AddActivityDialog = ({ open, onClose, onAddActivity, moduleId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    type: 'presentation',
    contentUrl: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdd = () => {
    if (formData.title.trim()) {
      onAddActivity({
        title: formData.title,
        summary: formData.description,
        duration: parseInt(formData.duration) || 30,
        activityType: formData.type,
        contentUrl: formData.contentUrl,
        moduleId: moduleId
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: 30,
        type: 'presentation',
        contentUrl: ''
      });
    }
  };

  const activityTypes = [
    { value: 'video', label: 'Video', icon: VideocamOutlined },
    { value: 'lecture', label: 'Lecture', icon: DescriptionOutlined },
    { value: 'presentation', label: 'Presentation', icon: SlideshowOutlined },
    { value: 'group_activity', label: 'Group Activity', icon: GroupOutlined }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MainCard
        title="Add New Activity"
        content={false}
        sx={{ m: 0 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Activity Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              variant="outlined"
              autoFocus
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              label="Content URL"
              value={formData.contentUrl}
              onChange={(e) => handleInputChange('contentUrl', e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="https://example.com/content"
            />

            <TextField
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              fullWidth
              variant="outlined"
              inputProps={{
                min: 0,
                max: 9999
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Activity Type"
              >
                {activityTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon style={{ fontSize: 20 }} />
                        {type.label}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            variant="contained"
            startIcon={<Add />}
            disabled={!formData.title.trim()}
          >
            Add Activity
          </Button>
        </DialogActions>
      </MainCard>
    </Dialog>
  );
};

// Alert Item Delete Component
const AlertItemDelete = ({ title, open, handleClose }) => {
  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{title}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={() => handleClose(true)} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Alert Module Delete Component
const AlertModuleDelete = ({ title, open, handleClose }) => {
  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'error.main' }}>
            <DeleteOutlined style={{ fontSize: '2rem' }} />
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Are you sure you want to delete?
            </Typography>
            <Typography>
              By deleting
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                {' "'}{title}{'" '}
              </Typography>
              module, Its details will also be deleted.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button fullWidth onClick={() => handleClose(false)} variant="outlined">
              Cancel
            </Button>
            <Button fullWidth color="error" variant="contained" onClick={() => handleClose(true)}>
              Delete
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const DraggableActivityCard = ({ activity, index, moduleIndex, getActivityIcon, getActivityColor, toggleActivityExpansion, expandedActivities, activityNotes, handleNotesChange, onDelete, onEdit }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'activity',
    item: () => ({ id: activity.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Box
      ref={drag}
      sx={{ 
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease-in-out',
        zIndex: isDragging ? 1000 : 'auto',
        boxShadow: isDragging ? '0 6px 20px rgba(0,0,0,0.15)' : 'none',
        '&:hover': {
          transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'translateY(-1px)',
          boxShadow: isDragging ? '0 6px 20px rgba(0,0,0,0.15)' : '0 3px 12px rgba(0,0,0,0.08)',
        }
      }}
    >
      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)',
            borderColor: 'primary.light'
          }
        }}
      >
        {/* Main Activity Content */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          {/* Activity Number Chip */}
          <Chip 
            label={`${moduleIndex + 1}.${index + 1}`}
            size="small"
            sx={{
              bgcolor: `${getActivityColor(activity.type)}.main`,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              mt: 0.5,
              flexShrink: 0,
              minWidth: 28,
              height: 24
            }}
          />
          
          {/* Activity Icon */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${getActivityColor(activity.type)}.main`,
              flexShrink: 0
            }}
          >
            {getActivityIcon(activity.type)}
          </Box>
          
          {/* Activity Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {activity.title || 'Untitled Activity'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
              {activity.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    px: 1, 
                    py: 0.25, 
                    bgcolor: `${getActivityColor(activity.type)}.light`, 
                    color: `${getActivityColor(activity.type)}.dark`,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                >
                  {activity.type.replace('_', ' ')}
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.25,
                    px: 0.75, 
                    py: 0.25, 
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'text.secondary'
                  }}
                >
                  <AccessTimeOutlined sx={{ fontSize: 12 }} />
                  {formatDuration(activity.duration)}
                </Box>
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(activity);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActivityExpansion(activity.id);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <NotesOutlined fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(activity.id);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main' }
                  }}
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Expandable Notes Section */}
        <Collapse in={expandedActivities[activity.id]}>
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add your notes for this activity..."
              value={activityNotes[activity.id] || ''}
              onChange={(e) => handleNotesChange(activity.id, e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.default'
                }
              }}
            />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const CourseContent = ({ courseId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Redux state with safe defaults
  const { modules: reduxModules = [] } = useSelector((state) => state.courses || {});
  
  const [openAddActivityDialog, setOpenAddActivityDialog] = useState(false);
  const [openEditActivityDialog, setOpenEditActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const notesTimeoutRef = useRef(null);
  
  // Extract all activities from modules - memoized for performance
  const activities = useMemo(() => {
    return reduxModules.flatMap(module => 
      (module.activities || []).map(activity => ({
        ...activity,
        moduleId: module.id,
        // Ensure we have the right field mappings for the UI
        type: activity.type || activity.activityType || 'presentation',
        description: activity.description || activity.summary || 'No description available'
      }))
    );
  }, [reduxModules]);
  
  // Use Redux modules directly
  const modules = useMemo(() => {
    return reduxModules.map(module => ({
      ...module,
      numActivities: (activities || []).filter(activity => activity.moduleId === module.id).length
    }));
  }, [reduxModules, activities]);


  const [selectedModuleId, setSelectedModuleId] = useState(null); // State for selected module
  const [objectivesExpanded, setObjectivesExpanded] = useState(false); // State for collapsible objectives
  const [expandedActivities, setExpandedActivities] = useState({}); // State for expanded activity notes
  const [activityNotes, setActivityNotes] = useState({}); // State for activity notes

  // Delete dialog states
  const [moduleDeleteDialog, setModuleDeleteDialog] = useState({ open: false, moduleId: null, moduleTitle: '' });
  const [activityDeleteDialog, setActivityDeleteDialog] = useState({ open: false, activityId: null, activityTitle: '' });

  // Level dialog state
  const [levelDialog, setLevelDialog] = useState({ open: false, moduleId: null, moduleTitle: '', currentLevel: '' });

  // Ensure activity data reflects latest Redux state changes
  useEffect(() => {
    if (editingActivity && reduxModules.length > 0) {
      // Find the updated activity from Redux state
      const updatedActivity = reduxModules
        .flatMap(module => module.activities || [])
        .find(activity => activity.id === editingActivity.id);
      
      if (updatedActivity && JSON.stringify(updatedActivity) !== JSON.stringify(editingActivity)) {
        setEditingActivity(updatedActivity);
      }
    }
  }, [reduxModules, editingActivity]);


  // Helper function to get level color (same as in ModuleCard)
  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return theme.palette.success.main;
      case 'Intermediate': return theme.palette.warning.main;
      case 'Advanced': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const handleModuleClick = (moduleId) => {
    setSelectedModuleId(moduleId);
  };

  const handleAddModule = () => {
    const newOrder = modules.length > 0 ? Math.max(...modules.map(m => m.moduleOrder || 0)) + 1 : 1;
    
    const newModule = {
      title: 'New Module',
      summary: "Click to edit this module",
      content: "Sample Content",
      JSONContent: {
        entityMap: {},
        blocks: [{
          key: "637gr",
          text: "Write content here",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {},
        }],
      },
      customDuration: 60,
      published: true,
      moduleStatus: "active",
      backgroundImg: null,
      courseId: parseInt(courseId),
      moduleOrder: newOrder
    };

    if (courseId) {
      dispatch(addModule(modules, newModule));
    }
  };

  const handleUpdateModuleTitle = async (id, newTitle) => {
    // Find the module to update
    const moduleToUpdate = modules.find(module => module.id === id);
    if (!moduleToUpdate) {
      console.error('Module not found for editing:', id);
      return;
    }


    // Create updated module data
    const updatedModule = {
      ...moduleToUpdate,
      title: newTitle,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Save to database using Redux action
      if (courseId) {
        await dispatch(editModule(updatedModule, id, modules));
      }
    } catch (error) {
      console.error('Error updating module title:', error);
    }
  };

  const handleCancelModuleEdit = (id) => {
    // Since modules are now computed from Redux, cancel edit operations
    // should be handled by the Redux state. For now, this is a no-op.
    console.log('Cancel edit for module:', id);
  };

  const handleOpenAddActivityDialog = () => {
    setOpenAddActivityDialog(true);
  };

  const handleCloseAddActivityDialog = () => {
    setOpenAddActivityDialog(false);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setOpenEditActivityDialog(true);
  };

  const handleCloseEditActivityDialog = () => {
    setOpenEditActivityDialog(false);
    setEditingActivity(null);
  };

  const handleSaveActivity = async (updatedData) => {
    try {
      // Update via Redux action (which handles API call, state update, and snackbar)
      await dispatch(updateActivity(editingActivity.id, updatedData));

      // Close dialog
      handleCloseEditActivityDialog();
    } catch (error) {
      console.error('Error updating activity:', error);
      // Error handling is already done in the Redux action
    }
  };

  const handleAddActivity = async (formData) => {
    try {
      // Get activities for this specific module to calculate order
      const moduleActivities = activities.filter(activity => activity.moduleId === selectedModuleId);
      
      // Create activity data for the database
      const activityData = {
        title: formData.title || `New Activity`,
        summary: formData.summary || formData.description || `Click to edit this activity`,
        content: formData.content || null,
        contentUrl: formData.contentUrl || '',
        duration: parseInt(formData.duration) || 10,
        activityType: formData.activityType || 'presentation',
        activityCategory: formData.category || 'practice',
        moduleId: selectedModuleId,
        ActivityOrder: moduleActivities.length // Use count of activities in this module
      };

      // Save to database using Redux action
      if (selectedModuleId) {
        await dispatch(createActivity(activityData));
      }

      // Close dialog
      handleCloseAddActivityDialog();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const handleNotesChange = async (activityId, notes) => {
    // Update local state immediately for responsiveness
    setActivityNotes(prev => ({
      ...prev,
      [activityId]: notes
    }));

    // Debounce the database save to avoid too many API calls
    clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/courses/updateActivity', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: activityId,
            content: notes
          })
        });
      } catch (error) {
        console.error('Error saving activity notes:', error);
      }
    }, 1000); // Save after 1 second of no typing
  };

  const handleDeleteModule = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    setModuleDeleteDialog({
      open: true,
      moduleId: moduleId,
      moduleTitle: module?.title || 'Unknown Module'
    });
  };

  const handleDuplicateModule = async (moduleId) => {
    try {
      await dispatch(duplicateModule(moduleId, modules));
    } catch (error) {
      console.error('Error duplicating module:', error);
    }
  };

  const handleSetModuleLevel = useCallback((moduleId, currentLevel) => {
    const module = modules.find(m => m.id === moduleId);
    setLevelDialog({
      open: true,
      moduleId: moduleId,
      moduleTitle: module?.title || 'Unknown Module',
      currentLevel: currentLevel || 'Beginner'
    });
  }, [modules]);

  const handleSaveModuleLevel = useCallback(async (newLevel) => {
    try {
      await dispatch(updateModuleLevel(levelDialog.moduleId, newLevel));
      setLevelDialog({ open: false, moduleId: null, moduleTitle: '', currentLevel: '' });
    } catch (error) {
      console.error('Error updating module level:', error);
    }
  }, [dispatch, levelDialog.moduleId]);

  const handleCloseLevelDialog = useCallback(() => {
    setLevelDialog({ open: false, moduleId: null, moduleTitle: '', currentLevel: '' });
  }, []);

  const handleClearDurationOverride = async (moduleId) => {
    try {
      // Call dedicated API endpoint for clearing duration override
      const response = await fetch('/api/courses/clear-duration-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleId })
      });

      const result = await response.json();

      if (result.success) {
        // Find the module to update
        const moduleToUpdate = modules.find(module => module.id === moduleId);
        if (!moduleToUpdate) return;

        // Create updated module data with duration cleared
        const updatedModule = {
          ...moduleToUpdate,
          duration: null,
          customDuration: null,
          lastUpdated: new Date().toISOString()
        };

        // Update Redux state
        await dispatch(editModule(updatedModule, moduleId, modules));
      } else {
        console.error('Failed to clear duration override:', result.error);
      }
    } catch (error) {
      console.error('Error clearing duration override:', error);
    }
  };

  const handleDeleteActivity = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    setActivityDeleteDialog({
      open: true,
      activityId: activityId,
      activityTitle: activity?.title || 'Unknown Activity'
    });
  };

  const confirmDeleteModule = async (confirmed) => {
    if (confirmed && moduleDeleteDialog.moduleId) {
      try {
        await dispatch(deleteItem(moduleDeleteDialog.moduleId, modules));
        // Clear selection if the deleted module was selected
        if (selectedModuleId === moduleDeleteDialog.moduleId) {
          setSelectedModuleId(null);
        }
        // Only close dialog after successful deletion
        setModuleDeleteDialog({ open: false, moduleId: null, moduleTitle: '' });
      } catch (error) {
        console.error('Error deleting module:', error);
        // Don't close dialog on error so user can see the error and try again
        return;
      }
    } else {
      // Close dialog if user cancelled
      setModuleDeleteDialog({ open: false, moduleId: null, moduleTitle: '' });
    }
  };

  const confirmDeleteActivity = async (confirmed) => {
    if (confirmed && activityDeleteDialog.activityId) {
      try {
        await dispatch(deleteActivity(activityDeleteDialog.activityId));
        // Only close dialog after successful deletion
        setActivityDeleteDialog({ open: false, activityId: null, activityTitle: '' });
      } catch (error) {
        console.error('Error deleting activity:', error);
        // Don't close dialog on error so user can see the error and try again
        return;
      }
    } else {
      // Close dialog if user cancelled
      setActivityDeleteDialog({ open: false, activityId: null, activityTitle: '' });
    }
  };

  const moveModule = (dragIndex, dropIndex) => {
    if (dragIndex === dropIndex || modules.length === 0) return;
    
    const reorderedModules = [...modules];
    const [removed] = reorderedModules.splice(dragIndex, 1);
    
    // Adjust drop index if moving from earlier position
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    reorderedModules.splice(adjustedDropIndex, 0, removed);
    
    // Dispatch Redux action to update state and sync with database
    if (courseId) {
      dispatch(updateModulesOrder(reorderedModules, courseId));
    }
  };

  const moveActivity = (dragIndex, dropIndex) => {
    if (dragIndex === dropIndex || !selectedModuleId || activities.length === 0) return;
    
    const selectedModuleActivities = activities.filter(activity => activity.moduleId === selectedModuleId);
    const reorderedActivities = [...selectedModuleActivities];
    const [removed] = reorderedActivities.splice(dragIndex, 1);
    
    // Adjust drop index if moving from earlier position
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    reorderedActivities.splice(adjustedDropIndex, 0, removed);
    
    // Update all activities with the new order for this module
    const updatedAllActivities = activities.map(activity => {
      if (activity.moduleId === selectedModuleId) {
        const index = reorderedActivities.findIndex(reordered => reordered.id === activity.id);
        return index !== -1 ? reorderedActivities[index] : activity;
      }
      return activity;
    });
    
    // Find module index for Redux action
    const moduleIndex = modules.findIndex(module => module.id === selectedModuleId);
    
    // Dispatch Redux action to update state and sync with database
    if (moduleIndex !== -1) {
      dispatch(updateActivitiesOrder(reorderedActivities, moduleIndex, selectedModuleId));
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideocamOutlined />;
      case 'lecture':
        return <DescriptionOutlined />;
      case 'presentation':
        return <SlideshowOutlined />;
      case 'group_activity':
        return <GroupOutlined />;
      default:
        return <SlideshowOutlined />; // Default to presentation icon
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'video':
        return 'error';
      case 'lecture':
        return 'primary';
      case 'presentation':
        return 'success';
      case 'group_activity':
        return 'warning';
      default:
        return 'success'; // Default to presentation color (green)
    }
  };


  // Early return with loading state if data is not ready
  if (!modules || !activities) {
    return (
      <Box sx={{ 
        flexGrow: 1, 
        p: { xs: 1, sm: 2, md: 3, lg: 3, xl: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Typography variant="h6" color="text.secondary">
          Loading course content...
        </Typography>
      </Box>
    );
  }


  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ 
        flexGrow: 1, 
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        

        {modules.length === 0 ? (
          /* No modules state */
          <MainCard>
            <Box 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                border: '2px dashed',
                borderColor: 'primary.light',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                color: 'text.secondary',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%)',
                  animation: 'pulse 4s ease-in-out infinite',
                },
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.3 },
                  '50%': { opacity: 0.1 }
                }
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  borderRadius: '50%',
                  p: 3,
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <BookOutlined sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                No Modules Found
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, maxWidth: 400, lineHeight: 1.6, color: 'text.secondary' }}>
                This course doesn't have any modules yet. Create your first module to start building your course content.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleAddModule}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.5)'
                  }
                }}
              >
                Create Your First Module
              </Button>
            </Box>
          </MainCard>
        ) : (
          /* Modules and Activities Grid */
          <Grid container spacing={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Left Column (fixed width) */}
          <Grid item sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: { xs: '100%', md: 350 }, 
            minWidth: { xs: 'auto', md: 320 }, 
            flexShrink: 0 
          }}>
            <MainCard 
              title="Course Modules" 
              subheader="Drag to reorder modules."
              sx={{ 
                flex: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                }
              }}
              secondary={
                <Tooltip title="Add Module">
                  <IconButton 
                    onClick={handleAddModule} 
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              }
            >
              {/* Color Legend */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, pl: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem', mr: 1 }}>
                  Level:
                </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle sx={{ fontSize: 10, color: getLevelColor('Beginner') }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Beginner</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle sx={{ fontSize: 10, color: getLevelColor('Intermediate') }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Intermediate</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle sx={{ fontSize: 10, color: getLevelColor('Advanced') }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Advanced</Typography>
                  </Box>
              </Box>
              
              <Box sx={{ 
                px: 0.5, 
                py: 2,
                maxWidth: '100%',
                overflow: 'hidden',
                minHeight: 200
              }}>
                <EmptyDropZone 
                  type="module" 
                  index={-1} 
                  onDrop={moveModule}
                />
                {modules.map((module, index) => (
                  <React.Fragment key={module.id}>
                    <DraggableModuleCard
                      module={module}
                      index={index}
                      onUpdateTitle={handleUpdateModuleTitle}
                      onCancelEdit={handleCancelModuleEdit}
                      onDelete={handleDeleteModule}
                      onDuplicate={handleDuplicateModule}
                      onSetLevel={handleSetModuleLevel}
                      onClearDurationOverride={handleClearDurationOverride}
                      isSelected={module.id === selectedModuleId}
                      onClick={handleModuleClick}
                    />
                    <EmptyDropZone 
                      type="module" 
                      index={index} 
                      onDrop={moveModule}
                      isLast={index === modules.length - 1}
                    />
                  </React.Fragment>
                ))}
              </Box>
            </MainCard>
          </Grid>

          {/* Right Column (flexible width) */}
          <Grid item sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0, 
            flex: 1, 
            width: { xs: '100%', md: 0 } 
          }}>
            <MainCard 
              title="Module Activities Editor" 
              subheader="Drag and drop activities to reorder them, or use the buttons to add, edit, or delete activities." 
              sx={{ 
                flex: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease-in-out',
                minWidth: 0, // Allow shrinking
                width: '100%', // Ensure full width usage
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                }
              }}
              secondary={
                (activities || []).length > 0 && (
                  <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={handleOpenAddActivityDialog}
                    disabled={selectedModuleId === null}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                      },
                      '&:disabled': {
                        opacity: 0.6
                      }
                    }}
                  >
                    Add Activity
                  </Button>
                )
              }
            >
              {activities.length === 0 ? (
                <Box 
                  sx={{ 
                    p: 6, 
                    textAlign: 'center', 
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    color: 'text.secondary',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%)',
                      animation: 'pulse 4s ease-in-out infinite',
                    },
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.3 },
                      '50%': { opacity: 0.1 }
                    }
                  }}
                >
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      borderRadius: '50%',
                      p: 3,
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <PlaylistAddOutlined sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                    Ready to create?
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, maxWidth: 400, lineHeight: 1.6, color: 'text.secondary' }}>
                    Transform your ideas into engaging learning experiences. Add your first activity to get started.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={handleOpenAddActivityDialog}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.5)'
                      }
                    }}
                  >
                    Create Your First Activity
                  </Button>
                </Box>
              ) : (
                <Box>
                  {selectedModuleId === null ? (
                    <Box 
                      sx={{ 
                        p: 6, 
                        textAlign: 'center', 
                        color: 'text.secondary',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '2px dashed',
                        borderColor: 'divider',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                          borderRadius: '50%',
                          p: 3,
                          mb: 3,
                          boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        <FolderOpenOutlined sx={{ fontSize: 48, color: 'white' }} />
                      </Box>
                      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                        Choose a module
                      </Typography>
                      <Typography variant="body1" sx={{ maxWidth: 400, lineHeight: 1.6, color: 'text.secondary' }}>
                        Select a module from the left panel to start adding activities and building your course content.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Module Learning Objectives */}
                      <MainCard 
                        title={
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: 'hsla(223, 95%, 15%, 1)',
                              background: 'linear-gradient(90deg, hsla(217, 100%, 42%, 1) 0%, hsla(223, 95%, 15%, 1) 100%)',
                              mx: -2,
                              mt: -2,
                              px: 2,
                              py: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              minHeight: 56
                            }} 
                            onClick={() => setObjectivesExpanded(!objectivesExpanded)}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                              {modules.find(m => m.id === selectedModuleId)?.title || 'Module'} | Learning Objectives
                            </Typography>
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}
                            >
                              {objectivesExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        }
                        sx={{ 
                          mb: 3,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                          },
                          '& .MuiCardHeader-root': {
                            p: 0
                          }
                        }}
                        secondary={null}
                      >
                        <Collapse in={objectivesExpanded}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 1, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Define the specific learning outcomes for this module.
                            </Typography>
                            <IconButton 
                              aria-label="edit-objectives" 
                              size="small"
                              sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'primary.main',
                                  backgroundColor: 'action.hover'
                                }
                              }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ px: 2, pb: 2 }}>
                            {(modules.find(m => m.id === selectedModuleId)?.learningObjectives || []).map((objective, objIndex) => (
                              <Box key={objIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircleOutline sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                                <Typography variant="body2" color="text.secondary">{objective}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </MainCard>

                      {/* Activities List */}
                      {(() => {
                        const moduleActivities = activities.filter(activity => activity.moduleId === selectedModuleId);
                        const moduleIndex = modules.findIndex(module => module.id === selectedModuleId);

                        if (moduleActivities.length === 0) {
                          return (
                            <Box 
                              sx={{ 
                                p: 5, 
                                textAlign: 'center', 
                                border: '2px dashed',
                                borderColor: 'primary.light',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '280px',
                                mt: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  width: '100px',
                                  height: '100px',
                                  background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                                  transform: 'translate(-50%, -50%)',
                                  animation: 'ripple 3s ease-in-out infinite',
                                },
                                '@keyframes ripple': {
                                  '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.8 },
                                  '100%': { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                                  borderRadius: '50%',
                                  p: 2.5,
                                  mb: 3,
                                  boxShadow: '0 6px 24px rgba(76, 175, 80, 0.3)',
                                  position: 'relative',
                                  zIndex: 1
                                }}
                              >
                                <PlaylistAddOutlined sx={{ fontSize: 40, color: 'white' }} />
                              </Box>
                              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                No activities yet
                              </Typography>
                              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 300, lineHeight: 1.5 }}>
                                This module is ready for content. Add activities to bring it to life!
                              </Typography>
                            </Box>
                          );
                        }

                        return (
                          <Box sx={{ p: 2, minHeight: 100 }}>
                            <EmptyDropZone 
                              type="activity" 
                              index={-1} 
                              onDrop={moveActivity}
                            />
                            {moduleActivities.map((activity, index) => (
                              <React.Fragment key={activity.id}>
                                <DraggableActivityCard
                                  activity={activity}
                                  index={index}
                                  moduleIndex={moduleIndex}
                                  getActivityIcon={getActivityIcon}
                                  getActivityColor={getActivityColor}
                                  toggleActivityExpansion={toggleActivityExpansion}
                                  expandedActivities={expandedActivities}
                                  activityNotes={activityNotes}
                                  handleNotesChange={handleNotesChange}
                                  onDelete={handleDeleteActivity}
                                  onEdit={handleEditActivity}
                                />
                                <EmptyDropZone 
                                  type="activity" 
                                  index={index} 
                                  onDrop={moveActivity}
                                  isLast={index === moduleActivities.length - 1}
                                />
                              </React.Fragment>
                            ))}
                          </Box>
                        );
                      })()}
                    </>
                  )}
                </Box>
              )}
            </MainCard>
          </Grid>
        </Grid>
        )}
        <AddActivityDialog 
          open={openAddActivityDialog} 
          onClose={handleCloseAddActivityDialog} 
          onAddActivity={handleAddActivity} 
          moduleId={selectedModuleId}
        />

        {/* Edit Activity Dialog */}
        <EditActivityDialog
          open={openEditActivityDialog}
          onClose={handleCloseEditActivityDialog}
          onSave={handleSaveActivity}
          activity={editingActivity}
        />

      {/* Delete Confirmation Dialogs */}
      <AlertModuleDelete
        title={moduleDeleteDialog.moduleTitle}
        open={moduleDeleteDialog.open}
        handleClose={confirmDeleteModule}
      />

      <AlertItemDelete
        title={activityDeleteDialog.activityTitle}
        open={activityDeleteDialog.open}
        handleClose={confirmDeleteActivity}
      />

      {/* Module Level Dialog */}
      <ModuleLevelDialog
        open={levelDialog.open}
        onClose={handleCloseLevelDialog}
        onSave={handleSaveModuleLevel}
        currentLevel={levelDialog.currentLevel}
        moduleTitle={levelDialog.moduleTitle}
      />
      </Box>
    </DndProvider>
  );
};

export default CourseContent;
