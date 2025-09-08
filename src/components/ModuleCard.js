import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography, IconButton, Box, Avatar, TextField, Stack, Menu, MenuItem, Badge, Chip } from '@mui/material';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, FormatListBulletedOutlined, CheckCircle, StarRate, PriorityHigh, School, MoreVert, ContentCopyOutlined, TuneOutlined, AccessTimeOutlined, WarningAmberOutlined, CalculateOutlined } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ModuleCard = ({ module, index, onUpdateTitle, onCancelEdit, onDelete, onDuplicate, onSetLevel, onClearDurationOverride, isSelected, onClick }) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(module.isEditing || false);
  const [title, setTitle] = useState(module.title);
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  
  const isMenuOpen = Boolean(anchorEl);

  // Helper function to get importance color
  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'Critical': return theme.palette.error.main;
      case 'High': return theme.palette.warning.main;
      case 'Medium': return theme.palette.info.main;
      case 'Low': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Helper function to get level color
  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return theme.palette.success.main;
      case 'Intermediate': return theme.palette.warning.main;
      case 'Advanced': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Helper function to calculate module duration
  const getModuleDuration = () => {
    if (module.duration) {
      return module.duration;
    }
    
    if (module.activities && Array.isArray(module.activities)) {
      return module.activities.reduce((total, activity) => {
        return total + (activity.duration || 0);
      }, 0);
    }
    
    return 0;
  };

  // Helper function to get calculated duration from activities
  const getCalculatedDuration = () => {
    if (module.activities && Array.isArray(module.activities)) {
      return module.activities.reduce((total, activity) => {
        return total + (activity.duration || 0);
      }, 0);
    }
    return 0;
  };

  // Check if duration is overridden
  const isDurationOverridden = () => {
    return module.duration && getCalculatedDuration() !== module.duration;
  };

  // Helper function to format duration
  const formatDuration = (minutes) => {
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdateTitle(module.id, title);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(module.title); // Revert to original title
    setIsEditing(false);
    onCancelEdit(module.id); // Notify parent to potentially remove if new and empty
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(module.id);
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(module.id);
    }
    handleMenuClose();
  };

  const handleSetLevel = () => {
    if (onSetLevel) {
      onSetLevel(module.id, module.level);
    }
    handleMenuClose();
  };

  const handleClearDurationOverride = () => {
    if (onClearDurationOverride) {
      onClearDurationOverride(module.id);
    }
    handleMenuClose();
  };

  return (
    <Card 
      elevation={isSelected ? 4 : 1} // Higher elevation when selected
      onClick={() => onClick(module.id)} // Handle click for selection
      sx={{
        mb: 1.5,
        border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`, // Primary border when selected
        bgcolor: isSelected ? theme.palette.primary.light : theme.palette.background.paper, // Primary background when selected
        transition: theme.transitions.create(['box-shadow', 'border-color', 'transform', 'background-color'], { duration: theme.transitions.duration.shortest }),
        position: 'relative',
        borderLeft: `4px solid ${getLevelColor(module.level)}`, // Color indicator on left edge
        width: '100%',
        '&:hover': {
          elevation: 4, // Increased shadow on hover
          transform: 'translateY(-2px)', // Slight lift effect
          borderColor: theme.palette.primary.main, // Highlight border on hover
          borderLeft: `4px solid ${getLevelColor(module.level)}`, // Preserve level color on hover
          bgcolor: isSelected ? theme.palette.primary.light : theme.palette.action.hover, // Subtle hover for unselected
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', p: 2, pt: 3, position: 'relative' }}>
        <Avatar sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: theme.palette.common.white,
          mr: 2,
          width: 40,
          height: 40
        }}>
          <Typography variant="h6" fontWeight={600}>
            {index}
          </Typography>
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {isEditing ? (
            <TextField
              inputRef={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              variant="standard"
              fullWidth
              size="small"
              sx={{ mb: 0.5 }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="subtitle1" 
                noWrap
                onDoubleClick={handleEdit}
                sx={{ cursor: 'text' }}
              >
                {module.title}
              </Typography>
            </Box>
          )}
          <Stack direction="column" spacing={0.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Version: {module.version}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <FormatListBulletedOutlined sx={{ fontSize: 16, mr: 0.5 }} /> {module.numActivities} Activities
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeOutlined sx={{ fontSize: 16, mr: 0.5 }} /> 
              {formatDuration(getModuleDuration())}
              {isDurationOverridden() && (
                <WarningAmberOutlined 
                  sx={{ 
                    fontSize: 14, 
                    ml: 0.5, 
                    color: 'warning.main',
                    cursor: 'help'
                  }} 
                  title={`Duration overridden (calculated: ${formatDuration(getCalculatedDuration())})`}
                />
              )}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ ml: 2, flexShrink: 0 }}>
          {isEditing ? (
            <Stack direction="row" spacing={0.5}>
              <IconButton aria-label="save" size="small" onClick={handleSave} disabled={!title.trim()}>
                <CheckOutlined fontSize="small" />
              </IconButton>
              <IconButton aria-label="cancel" size="small" onClick={handleCancel}>
                <CloseOutlined fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <IconButton 
              aria-label="more actions" 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ 
                opacity: 0.7,
                '&:hover': { 
                  opacity: 1,
                  bgcolor: 'action.hover'
                }
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleEdit} sx={{ fontSize: '0.875rem' }}>
            <EditOutlined sx={{ fontSize: 16, mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDuplicate} sx={{ fontSize: '0.875rem' }}>
            <ContentCopyOutlined sx={{ fontSize: 16, mr: 1 }} />
            Duplicate
          </MenuItem>
          <MenuItem onClick={handleSetLevel} sx={{ fontSize: '0.875rem' }}>
            <TuneOutlined sx={{ fontSize: 16, mr: 1 }} />
            Set Module Level
          </MenuItem>
          {isDurationOverridden() && (
            <MenuItem onClick={handleClearDurationOverride} sx={{ fontSize: '0.875rem' }}>
              <CalculateOutlined sx={{ fontSize: 16, mr: 1 }} />
              Use Calculated Duration
            </MenuItem>
          )}
          <MenuItem 
            onClick={handleDelete} 
            sx={{ 
              fontSize: '0.875rem',
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.dark'
              }
            }}
          >
            <DeleteOutlined sx={{ fontSize: 16, mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
        
        {/* Bottom right info */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 6, 
          right: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {/* Importance - only show for High */}
          {module.importance === 'High' && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              boxShadow: 1
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.625rem', color: theme.palette.error.main, fontWeight: 'bold' }}>
                !
              </Typography>
            </Box>
          )}
          
          {/* Rating */}
          {module.rating > 0 && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              boxShadow: 1
            }}>
              <StarRate sx={{ fontSize: 10, mr: 0.25, color: theme.palette.warning.main }} />
              <Typography variant="caption" sx={{ fontSize: '0.625rem' }} color="text.secondary">
                {module.rating}/5
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;