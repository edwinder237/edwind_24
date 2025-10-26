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
import { EditOutlined, CheckOutlined, CloseOutlined } from '@mui/icons-material';
import { useSelector } from 'store';
import { selectAvailableTrainingRecipients, selectProjectInfo } from 'store/reducers/project/settings';
import { formatDisplayDate } from '../utils/timeHelpers';

const ProjectInfoCard = React.memo(({ project, projectSettings, onUpdateTitle, onUpdateTrainingRecipient }) => {
  // Get training recipients and project info from settings store first
  const trainingRecipients = useSelector(selectAvailableTrainingRecipients);
  const projectInfoFromSettings = useSelector(selectProjectInfo);
  
  // Use project info from settings store if available, fallback to prop
  const currentProject = projectInfoFromSettings || project;
  
  // State for editing project title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(currentProject?.title || '');
  const [titleError, setTitleError] = useState('');

  // Location feature removed

  // State for editing training recipient
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [recipientValue, setRecipientValue] = useState(currentProject?.trainingRecipientId || '');
  

  // Memoized formatted dates
  const formattedDates = useMemo(() => ({
    created: formatDisplayDate(currentProject?.createdAt),
    lastUpdated: formatDisplayDate(projectSettings?.updatedAt)
  }), [currentProject?.createdAt, projectSettings?.updatedAt]);

  // Update titleValue when project changes
  React.useEffect(() => {
    setTitleValue(currentProject?.title || '');
  }, [currentProject?.title]);
  
  
  // Update recipientValue when project changes
  React.useEffect(() => {
    setRecipientValue(currentProject?.trainingRecipientId || '');
  }, [currentProject?.trainingRecipientId]);
  
  // Memoized training recipient display
  const trainingRecipientDisplay = useMemo(() => {
    // First try to get from currentProject.training_recipient (populated from API)
    if (currentProject?.training_recipient?.name) {
      return currentProject.training_recipient.name;
    }
    
    // Fallback to finding in available recipients list
    const selectedRecipient = trainingRecipients.find(r => r.id === currentProject?.trainingRecipientId);
    return selectedRecipient ? selectedRecipient.name : 'No recipient selected';
  }, [currentProject?.training_recipient, currentProject?.trainingRecipientId, trainingRecipients]);

  // Handle title editing
  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setTitleValue(currentProject?.title || '');
    setTitleError('');
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setTitleValue(currentProject?.title || '');
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

    if (trimmedTitle === currentProject?.title) {
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
  

  // Location handlers removed - feature no longer needed

  // Handle training recipient editing
  const handleStartEditRecipient = () => {
    setIsEditingRecipient(true);
    setRecipientValue(currentProject?.trainingRecipientId || '');
  };
  
  const handleCancelEditRecipient = () => {
    setIsEditingRecipient(false);
    setRecipientValue(currentProject?.trainingRecipientId || '');
  };
  
  const handleSaveRecipient = async () => {
    if (recipientValue === currentProject?.trainingRecipientId) {
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
      setRecipientValue(currentProject?.trainingRecipientId || '');
    }
  };

  // Location display removed - feature no longer needed

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
                {currentProject?.title || 'Untitled Project'}
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
                >
                  <CheckOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel changes">
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditRecipient}
                  color="secondary"
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ flex: 1 }}>
                {trainingRecipientDisplay}
              </Typography>
              <Tooltip title="Edit training recipient">
                <IconButton 
                  size="small" 
                  onClick={handleStartEditRecipient}
                  color="primary"
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Other Project Information */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project ID
          </Typography>
          <Typography variant="body1">
            {currentProject?.id || 'N/A'}
          </Typography>
        </Box>

        {/* Created and Last Updated - Side by Side */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {formattedDates.created}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {formattedDates.lastUpdated}
            </Typography>
          </Grid>
        </Grid>

    </Stack>
  );
});

ProjectInfoCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    projectStatus: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    trainingRecipientId: PropTypes.number,
    sub_organizationId: PropTypes.number
  }),
  projectSettings: PropTypes.shape({
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onUpdateTitle: PropTypes.func,
  onUpdateTrainingRecipient: PropTypes.func
};

ProjectInfoCard.displayName = 'ProjectInfoCard';

export default ProjectInfoCard;