import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Typography, Grid, Button, Card, CardContent, CardHeader, Avatar, IconButton, Collapse, TextField, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Stack, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Popover, Paper } from '@mui/material';
import { Add, VideocamOutlined, DescriptionOutlined, GroupOutlined, SlideshowOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined, PlaylistAddOutlined, CheckCircleOutline, ExpandMore, ExpandLess, Circle, NotesOutlined, AccessTimeOutlined, Save, Cancel, BookOutlined, EmojiEvents, Close } from '@mui/icons-material';
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
import { updateModulesOrder, updateActivitiesOrder, addModule, editModule, createActivity, deleteItem, deleteActivity, duplicateModule, updateModuleLevel, updateActivity, getModuleObjectives, addModuleObjective, updateModuleObjective, deleteModuleObjective } from 'store/reducers/courses';
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
    { value: 'group_activity', label: 'Group Activity', icon: GroupOutlined },
    { value: 'assessment', label: 'Assessment', icon: EmojiEvents }
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
  const theme = useTheme();
  const [step, setStep] = useState(1); // Step 1: Choose type, Step 2: Fill details
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    type: '',
    contentUrl: ''
  });

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
        type: '',
        contentUrl: ''
      });
      setStep(1);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      duration: 30,
      type: '',
      contentUrl: ''
    });
    setStep(1);
    onClose();
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const activityTypes = [
    { value: 'video', label: 'Video', icon: VideocamOutlined },
    { value: 'lecture', label: 'Lecture', icon: DescriptionOutlined },
    { value: 'presentation', label: 'Presentation', icon: SlideshowOutlined },
    { value: 'group_activity', label: 'Group Activity', icon: GroupOutlined },
    { value: 'assessment', label: 'Assessment', icon: EmojiEvents }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <MainCard
        title={step === 1 ? "Choose Activity Type" : "Add New Activity"}
        content={false}
        sx={{ m: 0 }}
      >
        <DialogContent sx={{ p: 0 }}>
          {step === 1 ? (
            // Step 1: Choose Activity Type
            <Box sx={{ p: 4 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Select the type of activity you want to create. Each type is optimized for different learning experiences.
              </Typography>
              
              <Grid container spacing={3}>
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Grid item xs={12} sm={6} key={type.value}>
                      <Card 
                        onClick={() => handleTypeSelect(type.value)}
                        sx={{
                          p: 3,
                          cursor: 'pointer',
                          border: '2px solid transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)',
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: theme.palette.primary.lighter || theme.palette.primary.light,
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon sx={{ fontSize: 32 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {type.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {type.value === 'video' && 'Video content, recorded lectures, or multimedia presentations'}
                              {type.value === 'lecture' && 'Text-based content, reading materials, or written instructions'}
                              {type.value === 'presentation' && 'Slides, interactive presentations, or visual content'}
                              {type.value === 'group_activity' && 'Collaborative exercises, discussions, or team-based activities'}
                              {type.value === 'assessment' && 'Quizzes, tests, assignments, or evaluation activities'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ) : (
            // Step 2: Fill Activity Details
            <Box sx={{ display: 'flex', height: '70vh', p: 0 }}>
              <Grid container sx={{ height: '100%' }}>
                {/* Left Column - Form Fields */}
                <Grid item xs={12} md={6} sx={{ p: 4, overflow: 'auto' }}>
                  {/* Selected Type Display */}
                  <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    backgroundColor: theme.palette.primary.lighter || theme.palette.primary.light, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {(() => {
                      const selectedType = activityTypes.find(t => t.value === formData.type);
                      const Icon = selectedType?.icon || DescriptionOutlined;
                      return (
                        <>
                          <Icon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} color={theme.palette.primary.main}>
                              Creating {selectedType?.label} Activity
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Click "Back" to change activity type
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>

                  <Stack spacing={3}>
                    <TextField
                      label="Activity Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      fullWidth
                      variant="outlined"
                      autoFocus
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                      helperText="Give your activity a clear, descriptive title"
                    />

                    <TextField
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder="Describe what students will learn or do in this activity..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      helperText={`${formData.description.length}/500 characters`}
                      inputProps={{ maxLength: 500 }}
                    />

                    <TextField
                      label={`Content ${
                        formData.type === 'video' ? 'Video ' : 
                        formData.type === 'presentation' ? 'Presentation ' : 
                        formData.type === 'assessment' ? 'Assessment ' : 
                        ''
                      }URL`}
                      value={formData.contentUrl}
                      onChange={(e) => handleInputChange('contentUrl', e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder={
                        formData.type === 'video' ? 'https://youtube.com/watch?v=...' :
                        formData.type === 'presentation' ? 'https://docs.google.com/presentation/...' :
                        formData.type === 'assessment' ? 'https://forms.google.com/...' :
                        'https://example.com/content'
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      helperText={`Link to your ${
                        formData.type === 'video' ? 'video' : 
                        formData.type === 'presentation' ? 'presentation' : 
                        formData.type === 'assessment' ? 'quiz, test, or assessment form' : 
                        'content'
                      } resource (optional)`}
                    />

                    <Box>
                      <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.primary">
                        Duration (minutes)
                      </Typography>
                      <TextField
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          min: 1,
                          max: 999
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                        helperText="Estimated time to complete this activity"
                      />
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column - Full Height Preview */}
                <Grid item xs={12} md={6} sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.grey[50],
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
                    Preview
                  </Typography>
                  
                  <Box sx={{
                    flex: 1,
                    backgroundColor: 'white',
                    border: `2px dashed ${theme.palette.grey[300]}`,
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {formData.type === 'video' && formData.contentUrl && getYouTubeVideoId(formData.contentUrl) ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.contentUrl)}`}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ borderRadius: 0 }}
                      />
                    ) : formData.contentUrl ? (
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Content URL provided:
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            wordBreak: 'break-all',
                            color: theme.palette.primary.main,
                            textDecoration: 'underline'
                          }}
                        >
                          {formData.contentUrl}
                        </Typography>
                        {formData.type === 'video' && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            (Preview available for YouTube videos)
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formData.type === 'video' ? 
                            'Enter a YouTube URL to see video preview' :
                            'Content preview will appear here when URL is provided'
                          }
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            startIcon={<Cancel />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          
          {step === 2 && (
            <Button 
              onClick={handleBack} 
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Back
            </Button>
          )}
          
          {step === 2 && (
            <Button 
              onClick={handleAdd} 
              variant="contained"
              startIcon={<Add />}
              disabled={!formData.title.trim()}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Add Activity
            </Button>
          )}
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

const DraggableActivityCard = ({ activity, index, moduleIndex, getActivityIcon, getActivityColor, toggleActivityExpansion, expandedActivities, activityNotes, handleNotesChange, onDelete, onEdit, handleSaveNotes, handleDiscardNotes, unsavedNotes }) => {
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Notes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {unsavedNotes[activity.id] && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDiscardNotes(activity.id)}
                    startIcon={<Cancel />}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      py: 0.5,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'error.main',
                        color: 'error.main'
                      }
                    }}
                  >
                    Discard
                  </Button>
                )}
                <Button
                  size="small"
                  variant={unsavedNotes[activity.id] ? "contained" : "outlined"}
                  onClick={() => handleSaveNotes(activity.id)}
                  disabled={!unsavedNotes[activity.id]}
                  startIcon={<Save />}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    ...(unsavedNotes[activity.id] && {
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' }
                      },
                      animation: 'pulse 2s infinite'
                    })
                  }}
                >
                  {unsavedNotes[activity.id] ? 'Save' : 'Saved'}
                </Button>
              </Box>
            </Box>
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
  const { modules: reduxModules = [], moduleObjectives = {} } = useSelector((state) => state.courses || {});
  
  const [openAddActivityDialog, setOpenAddActivityDialog] = useState(false);
  const [openEditActivityDialog, setOpenEditActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const notesTimeoutRef = useRef(null);
  
  // Extract all activities from modules - memoized for performance
  const activities = useMemo(() => {
    // Filter out any null/undefined modules first
    const validModules = reduxModules.filter(module => module != null);
    return validModules.flatMap(module => 
      (module?.activities || []).filter(activity => activity != null).map(activity => ({
        ...activity,
        moduleId: module?.id,
        // Ensure we have the right field mappings for the UI
        type: activity?.type || activity?.activityType || 'presentation',
        description: activity?.description || activity?.summary || 'No description available'
      }))
    );
  }, [reduxModules]);
  
  // Use Redux modules directly with null safety
  const modules = useMemo(() => {
    // Filter out any null/undefined modules first
    const validModules = reduxModules.filter(module => module != null);
    return validModules.map(module => ({
      ...module,
      numActivities: (activities || []).filter(activity => activity?.moduleId === module?.id).length
    }));
  }, [reduxModules, activities]);


  const [selectedModuleId, setSelectedModuleId] = useState(null); // State for selected module
  const [objectivesExpanded, setObjectivesExpanded] = useState(false); // State for collapsible objectives
  const [expandedActivities, setExpandedActivities] = useState({}); // State for expanded activity notes
  const [activityNotes, setActivityNotes] = useState({}); // State for activity notes
  const [savedActivityNotes, setSavedActivityNotes] = useState({}); // State for last saved notes (for discard functionality)
  const [unsavedNotes, setUnsavedNotes] = useState({}); // Track which notes have unsaved changes

  // Delete dialog states
  const [moduleDeleteDialog, setModuleDeleteDialog] = useState({ open: false, moduleId: null, moduleTitle: '' });
  const [activityDeleteDialog, setActivityDeleteDialog] = useState({ open: false, activityId: null, activityTitle: '' });

  // Level dialog state
  const [levelDialog, setLevelDialog] = useState({ open: false, moduleId: null, moduleTitle: '', currentLevel: '' });

  // Module learning objectives management states
  const [editingObjective, setEditingObjective] = useState(null);
  const [editObjectiveText, setEditObjectiveText] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [showAddObjectiveField, setShowAddObjectiveField] = useState(false);
  const [deleteObjectiveConfirm, setDeleteObjectiveConfirm] = useState({ open: false, index: -1, anchorEl: null });

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

  const handleNotesChange = (activityId, notes) => {
    // Update local state immediately for responsiveness
    setActivityNotes(prev => ({
      ...prev,
      [activityId]: notes
    }));

    // Mark as having unsaved changes
    setUnsavedNotes(prev => ({
      ...prev,
      [activityId]: true
    }));
  };

  const handleSaveNotes = async (activityId) => {
    try {
      const notes = activityNotes[activityId] || '';
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
      
      // Update saved notes state
      setSavedActivityNotes(prev => ({
        ...prev,
        [activityId]: notes
      }));
      
      // Mark as saved
      setUnsavedNotes(prev => ({
        ...prev,
        [activityId]: false
      }));

      // Show success feedback
      dispatch(openSnackbar({
        open: true,
        message: 'Notes saved successfully',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      console.error('Error saving activity notes:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to save notes',
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    }
  };

  const handleDiscardNotes = (activityId) => {
    // Revert to last saved state
    const savedNotes = savedActivityNotes[activityId] || '';
    setActivityNotes(prev => ({
      ...prev,
      [activityId]: savedNotes
    }));
    
    // Mark as no longer having unsaved changes
    setUnsavedNotes(prev => ({
      ...prev,
      [activityId]: false
    }));

    // Show feedback
    dispatch(openSnackbar({
      open: true,
      message: 'Changes discarded',
      variant: 'alert',
      alert: {
        color: 'info',
        variant: 'filled'
      }
    }));
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

  // Module learning objectives management functions
  const getCurrentModuleObjectives = () => {
    if (!selectedModuleId) return [];
    return moduleObjectives[selectedModuleId] || [];
  };

  // Fetch module objectives when selectedModuleId changes
  useEffect(() => {
    if (selectedModuleId && !moduleObjectives[selectedModuleId]) {
      dispatch(getModuleObjectives(selectedModuleId));
    }
  }, [selectedModuleId, dispatch, moduleObjectives]);

  const handleAddObjective = () => {
    if (newObjective.trim() && selectedModuleId) {
      dispatch(addModuleObjective(selectedModuleId, newObjective.trim()));
      setNewObjective('');
      setShowAddObjectiveField(false);
    }
  };

  const handleShowAddObjectiveField = () => {
    setShowAddObjectiveField(true);
  };

  const handleCancelAddObjective = () => {
    setShowAddObjectiveField(false);
    setNewObjective('');
  };

  const handleDeleteObjectiveClick = (event, index) => {
    setDeleteObjectiveConfirm({
      open: true,
      index: index,
      anchorEl: event.currentTarget
    });
  };

  const handleDeleteObjectiveConfirm = () => {
    if (selectedModuleId) {
      const currentObjectives = getCurrentModuleObjectives();
      const objectiveToDelete = currentObjectives[deleteObjectiveConfirm.index];
      if (objectiveToDelete?.id) {
        dispatch(deleteModuleObjective(selectedModuleId, objectiveToDelete.id));
      }
    }
    setDeleteObjectiveConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleDeleteObjectiveCancel = () => {
    setDeleteObjectiveConfirm({ open: false, index: -1, anchorEl: null });
  };

  const handleEditObjective = (index) => {
    const currentObjectives = getCurrentModuleObjectives();
    setEditingObjective(index);
    setEditObjectiveText(currentObjectives[index]?.objective || '');
  };

  const handleSaveObjectiveEdit = () => {
    if (editObjectiveText.trim() && selectedModuleId && editingObjective !== null) {
      const currentObjectives = getCurrentModuleObjectives();
      const objectiveToUpdate = currentObjectives[editingObjective];
      if (objectiveToUpdate?.id) {
        dispatch(updateModuleObjective(selectedModuleId, objectiveToUpdate.id, editObjectiveText.trim()));
      }
    }
    setEditingObjective(null);
    setEditObjectiveText('');
  };

  const handleCancelObjectiveEdit = () => {
    setEditingObjective(null);
    setEditObjectiveText('');
  };

  const moveModule = (dragIndex, dropIndex) => {
    if (dragIndex === dropIndex || modules.length === 0) return;
    
    // Filter out any undefined/null modules first
    const validModules = modules.filter(m => m != null);
    if (validModules.length === 0) return;
    
    const reorderedModules = [...validModules];
    const [removed] = reorderedModules.splice(dragIndex, 1);
    
    // Adjust drop index if moving from earlier position
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    reorderedModules.splice(adjustedDropIndex, 0, removed);
    
    // Update module order for each module
    const modulesWithUpdatedOrder = reorderedModules.map((module, index) => ({
      ...module,
      moduleOrder: index + 1
    }));
    
    // Dispatch Redux action to update state and sync with database
    if (courseId) {
      dispatch(updateModulesOrder(modulesWithUpdatedOrder, courseId));
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
          {/* Left Column - Modules (50% width) */}
          <Grid item xs={12} md={5} sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0
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
                {modules.filter(module => module != null).map((module, index) => (
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

          {/* Right Column - Activities (50% width) */}
          <Grid item xs={12} md={7} sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0
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
                <Box sx={{ overflow: 'hidden' }}>
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

                      {/* Module Objectives - Minimalist */}
                      <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                              Module Objectives
                            </Typography>
                            <Chip 
                              label={modules.find(m => m.id === selectedModuleId)?.title || 'Module'}
                              size="small"
                              sx={{ 
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                bgcolor: 'primary.lighter',
                                color: 'primary.dark'
                              }}
                            />
                          </Stack>
                          {!showAddObjectiveField && (
                            <IconButton
                              size="small"
                              onClick={handleShowAddObjectiveField}
                              sx={{ p: 0.5 }}
                            >
                              <Add sx={{ fontSize: 18 }} />
                            </IconButton>
                          )}
                        </Stack>
                        
                        {getCurrentModuleObjectives().map((objectiveData, index) => (
                          <Box key={objectiveData.id || index} sx={{ display: 'flex', alignItems: 'center', py: 0.5, gap: 1 }}>
                            <CheckCircleOutline sx={{ color: 'success.main', fontSize: 16 }} />
                            {editingObjective === index ? (
                              <TextField
                                fullWidth
                                value={editObjectiveText}
                                onChange={(e) => setEditObjectiveText(e.target.value)}
                                variant="outlined"
                                size="small"
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveObjectiveEdit()}
                                autoFocus
                                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.85rem' }}>
                                {objectiveData.objective}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {editingObjective === index ? (
                                <>
                                  <IconButton size="small" onClick={handleSaveObjectiveEdit} sx={{ p: 0.25 }}>
                                    <Save sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={handleCancelObjectiveEdit} sx={{ p: 0.25 }}>
                                    <Cancel sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEditObjective(index)}
                                    sx={{ p: 0.25, opacity: 0.7, '&:hover': { opacity: 1 } }}
                                  >
                                    <EditOutlined sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => handleDeleteObjectiveClick(e, index)}
                                    sx={{ p: 0.25, opacity: 0.7, '&:hover': { opacity: 1, color: 'error.main' } }}
                                  >
                                    <DeleteOutlined sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </Box>
                        ))}

                        {showAddObjectiveField && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                            <TextField
                              fullWidth
                              placeholder="Add objective..."
                              value={newObjective}
                              onChange={(e) => setNewObjective(e.target.value)}
                              variant="outlined"
                              size="small"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                              autoFocus
                              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={handleAddObjective}
                              disabled={!newObjective.trim()}
                              sx={{ p: 0.25 }}
                            >
                              <Save sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={handleCancelAddObjective}
                              sx={{ p: 0.25 }}
                            >
                              <Cancel sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

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
                                  handleSaveNotes={handleSaveNotes}
                                  handleDiscardNotes={handleDiscardNotes}
                                  unsavedNotes={unsavedNotes}
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

      {/* Delete Module Objective Confirmation Popover */}
      <Popover
        open={deleteObjectiveConfirm.open}
        anchorEl={deleteObjectiveConfirm.anchorEl}
        onClose={handleDeleteObjectiveCancel}
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
              onClick={handleDeleteObjectiveCancel}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleDeleteObjectiveConfirm}
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Popover>
      </Box>
    </DndProvider>
  );
};

export default CourseContent;
