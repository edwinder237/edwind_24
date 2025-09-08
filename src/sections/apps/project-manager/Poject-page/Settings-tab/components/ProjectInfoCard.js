import React, { useMemo, useState, useEffect } from 'react';
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
  Chip,
  CircularProgress
} from '@mui/material';
import { EditOutlined, CheckOutlined, CloseOutlined, LocationOnOutlined } from '@mui/icons-material';
import { formatDisplayDate } from '../utils/timeHelpers';
import GoogleMapAutocomplete from '../../../projects-list/google-map-autocomplete';
import axios from 'utils/axios';

const ProjectInfoCard = React.memo(({ project, projectSettings, onUpdateTitle, onUpdateLocation, onUpdateBackgroundImage, onUpdateTrainingRecipient }) => {
  // State for editing project title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project?.title || '');
  const [titleError, setTitleError] = useState('');
  
  // State for editing project location
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  
  // State for editing training recipient
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [recipientValue, setRecipientValue] = useState(project?.trainingRecipientId || '');
  const [trainingRecipients, setTrainingRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  

  // Memoized formatted dates
  const formattedDates = useMemo(() => ({
    created: formatDisplayDate(project?.createdAt),
    lastUpdated: formatDisplayDate(projectSettings?.updatedAt)
  }), [project?.createdAt, projectSettings?.updatedAt]);

  // Update titleValue when project changes
  React.useEffect(() => {
    setTitleValue(project?.title || '');
  }, [project?.title]);
  
  
  // Update recipientValue when project changes
  React.useEffect(() => {
    setRecipientValue(project?.trainingRecipientId || '');
  }, [project?.trainingRecipientId]);
  
  // Fetch training recipients when component mounts
  React.useEffect(() => {
    const fetchTrainingRecipients = async () => {
      if (!project?.sub_organizationId) return;
      
      setLoadingRecipients(true);
      try {
        const response = await axios.get(`/api/training-recipients/fetchTrainingRecipients?sub_organizationId=${project.sub_organizationId}`);
        setTrainingRecipients(response.data || []);
      } catch (error) {
        console.error('Failed to fetch training recipients:', error);
        setTrainingRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    };
    
    fetchTrainingRecipients();
  }, [project?.sub_organizationId]);

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
  
  // Handle training recipient editing
  const handleStartEditRecipient = () => {
    setIsEditingRecipient(true);
    setRecipientValue(project?.trainingRecipientId || '');
  };
  
  const handleCancelEditRecipient = () => {
    setIsEditingRecipient(false);
    setRecipientValue(project?.trainingRecipientId || '');
  };
  
  const handleSaveRecipient = async () => {
    if (recipientValue === project?.trainingRecipientId) {
      setIsEditingRecipient(false);
      return;
    }
    
    try {
      if (onUpdateTrainingRecipient) {
        await onUpdateTrainingRecipient(recipientValue || null);
      }
      setIsEditingRecipient(false);
    } catch (error) {
      console.error('Failed to update training recipient:', error);
      // Revert to original value on error
      setRecipientValue(project?.trainingRecipientId || '');
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
    <Stack spacing={3} sx={{ width: '100%' }}>
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


        {/* Editable Training Recipient */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Training Recipient
          </Typography>
          {isEditingRecipient ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                <Select
                  value={recipientValue}
                  onChange={(e) => setRecipientValue(e.target.value)}
                  displayEmpty
                  disabled={loadingRecipients}
                  startAdornment={loadingRecipients ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                >
                  <MenuItem value="">
                    <em>No recipient selected</em>
                  </MenuItem>
                  {trainingRecipients.map((recipient) => (
                    <MenuItem key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Save changes">
                <IconButton 
                  size="small" 
                  onClick={handleSaveRecipient}
                  color="primary"
                  disabled={loadingRecipients}
                >
                  <CheckOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel changes">
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditRecipient}
                  color="secondary"
                  disabled={loadingRecipients}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ flex: 1 }}>
                {(() => {
                  const selectedRecipient = trainingRecipients.find(r => r.id === project?.trainingRecipientId);
                  return selectedRecipient ? selectedRecipient.name : 'No recipient selected';
                })()}
              </Typography>
              <Tooltip title="Edit training recipient">
                <IconButton 
                  size="small" 
                  onClick={handleStartEditRecipient}
                  color="primary"
                  disabled={loadingRecipients}
                >
                  {loadingRecipients ? <CircularProgress size={20} /> : <EditOutlined fontSize="small" />}
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
        <Box sx={{ width: '100%' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project Location
          </Typography>
          {isEditingLocation ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Box sx={{ flex: 1, width: '100%' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
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
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    trainingRecipientId: PropTypes.number,
    sub_organizationId: PropTypes.number
  }),
  projectSettings: PropTypes.shape({
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onUpdateTitle: PropTypes.func,
  onUpdateLocation: PropTypes.func,
  onUpdateBackgroundImage: PropTypes.func,
  onUpdateTrainingRecipient: PropTypes.func
};

ProjectInfoCard.displayName = 'ProjectInfoCard';

export default ProjectInfoCard;