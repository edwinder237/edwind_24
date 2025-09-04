import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Stack,
  Typography,
  TextField,
  IconButton,
  Box,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Chip
} from '@mui/material';
import { EditOutlined, CheckOutlined, CloseOutlined, LocationOnOutlined } from '@mui/icons-material';
import { formatDisplayDate } from '../utils/timeHelpers';
import GoogleMapAutocomplete from '../../../projects-list/google-map-autocomplete';

const ProjectInfoCard = React.memo(({ project, projectSettings, onUpdateTitle, onUpdateStatus, onUpdateLocation, onUpdateBackgroundImage }) => {
  // State for editing project title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project?.title || '');
  const [titleError, setTitleError] = useState('');
  
  // State for editing project status
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState(project?.projectStatus || 'started');
  
  // State for editing project location
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  
  // Available project statuses
  const projectStatuses = [
    { value: 'started', label: 'Started', color: 'info' },
    { value: 'ongoing', label: 'Ongoing', color: 'success' },
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ];

  // Memoized formatted dates
  const formattedDates = useMemo(() => ({
    created: formatDisplayDate(project?.createdAt),
    lastUpdated: formatDisplayDate(projectSettings?.updatedAt)
  }), [project?.createdAt, projectSettings?.updatedAt]);

  // Update titleValue when project changes
  React.useEffect(() => {
    setTitleValue(project?.title || '');
  }, [project?.title]);
  
  // Update statusValue when project changes
  React.useEffect(() => {
    setStatusValue(project?.projectStatus || 'started');
  }, [project?.projectStatus]);

  // Handle title editing
  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setTitleValue(project?.title || '');
    setTitleError('');
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setTitleValue(project?.title || '');
    setTitleError('');
  };

  const handleSaveTitle = async () => {
    const trimmedTitle = titleValue.trim();
    
    if (!trimmedTitle) {
      setTitleError('Project title cannot be empty');
      return;
    }
    
    if (trimmedTitle.length > 255) {
      setTitleError('Project title must be less than 255 characters');
      return;
    }

    if (trimmedTitle === project?.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      if (onUpdateTitle) {
        await onUpdateTitle(trimmedTitle);
      }
      setIsEditingTitle(false);
      setTitleError('');
    } catch (error) {
      setTitleError(error.message || 'Failed to update title');
    }
  };

  const handleTitleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSaveTitle();
    } else if (event.key === 'Escape') {
      handleCancelEditTitle();
    }
  };
  
  // Handle status editing
  const handleStartEditStatus = () => {
    setIsEditingStatus(true);
    setStatusValue(project?.projectStatus || 'started');
  };
  
  const handleCancelEditStatus = () => {
    setIsEditingStatus(false);
    setStatusValue(project?.projectStatus || 'started');
  };
  
  const handleSaveStatus = async () => {
    if (statusValue === project?.projectStatus) {
      setIsEditingStatus(false);
      return;
    }
    
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(statusValue);
      }
      setIsEditingStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert to original value on error
      setStatusValue(project?.projectStatus || 'started');
    }
  };
  
  const getStatusConfig = (status) => {
    return projectStatuses.find(s => s.value === status) || projectStatuses[0];
  };
  
  // Handle location editing
  const handleStartEditLocation = () => {
    setIsEditingLocation(true);
    setLocationData(null);
  };
  
  const handleCancelEditLocation = () => {
    setIsEditingLocation(false);
    setLocationData(null);
  };
  
  const handleSaveLocation = async () => {
    if (!locationData) {
      setIsEditingLocation(false);
      return;
    }
    
    setIsSavingLocation(true);
    try {
      if (onUpdateLocation) {
        // Pass the location data which includes the R2 image URL
        await onUpdateLocation(JSON.stringify(locationData));
      }
      setIsEditingLocation(false);
      setLocationData(null);
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsSavingLocation(false);
    }
  };
  
  const handleLocationChange = (location) => {
    setLocationData(location);
    // Auto-save when location is selected
    if (location && onUpdateLocation) {
      setIsSavingLocation(true);
      onUpdateLocation(JSON.stringify(location))
        .then(() => {
          setIsEditingLocation(false);
          setLocationData(null);
        })
        .catch((error) => {
          console.error('Failed to update location:', error);
        })
        .finally(() => {
          setIsSavingLocation(false);
        });
    }
  };
  
  // Memoized location display to prevent unnecessary recalculations
  const locationDisplay = useMemo(() => {
    if (!project?.location) return 'No location set';
    
    // Handle placeholder strings
    if (typeof project.location === 'string' && 
        (project.location === 'location' || project.location.trim() === '')) {
      return 'No location set';
    }
    
    try {
      let location = project.location;
      
      // Parse JSON string if needed
      if (typeof project.location === 'string') {
        const trimmed = project.location.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          location = JSON.parse(project.location);
        } else {
          return 'No location set';
        }
      }
      
      // Extract location description from various formats
      if (location?.description) {
        return location.description;
      }
      
      if (location?.address1) {
        return [location.address1, location.city, location.country]
          .filter(Boolean)
          .join(', ');
      }
      
      if (location?.structured_formatting) {
        const { main_text, secondary_text } = location.structured_formatting;
        return secondary_text ? `${main_text}, ${secondary_text}` : main_text;
      }
      
      return 'No location set';
    } catch (error) {
      console.error('Error parsing location:', error);
      return 'No location set';
    }
  }, [project?.location]);

  const projectInfo = useMemo(() => [
    {
      label: 'Project ID',
      value: project?.id || 'N/A'
    },
    {
      label: 'Created',
      value: formattedDates.created
    },
    {
      label: 'Last Updated',
      value: formattedDates.lastUpdated
    }
  ], [project?.id, formattedDates]);

  return (
    <Stack spacing={3}>
      {/* Editable Project Title */}
      <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project Title
          </Typography>
          {isEditingTitle ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                fullWidth
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyPress}
                error={!!titleError}
                helperText={titleError}
                size="small"
                placeholder="Enter project title"
                autoFocus
                sx={{ flex: 1 }}
              />
              <Tooltip title="Save changes">
                <IconButton 
                  size="small" 
                  onClick={handleSaveTitle}
                  color="primary"
                  sx={{ mt: titleError ? 0 : 0.5 }}
                >
                  <CheckOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel changes">
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditTitle}
                  color="secondary"
                  sx={{ mt: titleError ? 0 : 0.5 }}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ flex: 1 }}>
                {project?.title || 'Untitled Project'}
              </Typography>
              <Tooltip title="Edit project title">
                <IconButton 
                  size="small" 
                  onClick={handleStartEditTitle}
                  color="primary"
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Editable Project Status */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project Status
          </Typography>
          {isEditingStatus ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  displayEmpty
                >
                  {projectStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Chip 
                        label={status.label} 
                        color={status.color} 
                        size="small" 
                        variant="filled"
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Save changes">
                <IconButton 
                  size="small" 
                  onClick={handleSaveStatus}
                  color="primary"
                >
                  <CheckOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel changes">
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditStatus}
                  color="secondary"
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={getStatusConfig(project?.projectStatus).label} 
                color={getStatusConfig(project?.projectStatus).color} 
                size="small" 
                variant="filled"
              />
              <Tooltip title="Edit project status">
                <IconButton 
                  size="small" 
                  onClick={handleStartEditStatus}
                  color="primary"
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Background Image URL */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Background Image URL
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter image URL for project card (e.g., https://example.com/image.jpg)"
            value={project?.backgroundImg || ''}
            InputProps={{
              readOnly: true,
              sx: { 
                fontSize: '0.875rem',
                '& input': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }
            }}
            helperText="This URL is automatically set when you select a location with an image"
          />
          
          {/* Image Preview */}
          {project?.backgroundImg && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Preview
              </Typography>
              <Box
                sx={{
                  height: 200,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundImage: `url(${project.backgroundImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover'
                }}
              >
                {!project.backgroundImg && (
                  <Typography variant="body2" color="text.secondary">
                    No image URL provided
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </Box>

        {/* Project Location */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project Location
          </Typography>
          {isEditingLocation ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <GoogleMapAutocomplete
                  handleLocationChange={handleLocationChange}
                />
                {locationData?.imageUrl && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                    ✅ Location image ready for upload
                  </Typography>
                )}
              </Box>
              <Tooltip title="Cancel editing">
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditLocation}
                  color="secondary"
                  disabled={isSavingLocation}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <LocationOnOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body1">
                  {locationDisplay}
                </Typography>
              </Box>
              <Tooltip title="Edit project location">
                <IconButton 
                  size="small" 
                  onClick={handleStartEditLocation}
                  color="primary"
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Other Project Information */}
        <Grid container spacing={2}>
          {projectInfo.map((info, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Typography variant="body2" color="text.secondary">
                {info.label}
              </Typography>
              <Typography variant="body1">
                {info.value}
              </Typography>
            </Grid>
          ))}
        </Grid>

    </Stack>
  );
});

ProjectInfoCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    projectStatus: PropTypes.string,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  projectSettings: PropTypes.shape({
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onUpdateTitle: PropTypes.func,
  onUpdateStatus: PropTypes.func,
  onUpdateLocation: PropTypes.func,
  onUpdateBackgroundImage: PropTypes.func
};

ProjectInfoCard.displayName = 'ProjectInfoCard';

export default ProjectInfoCard;