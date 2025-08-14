import React from 'react';
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Publish as PublishIcon,
} from '@mui/icons-material';

const PublishingSettings = ({ formData, onInputChange }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'approved': return 'info';
      case 'review': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  const courseStatusOptions = [
    { value: 'draft', label: 'Draft', description: 'Work in progress, not visible to learners' },
    { value: 'review', label: 'Under Review', description: 'Pending approval from administrators' },
    { value: 'approved', label: 'Approved', description: 'Ready for publishing' },
    { value: 'published', label: 'Published', description: 'Live and available to learners' },
    { value: 'archived', label: 'Archived', description: 'No longer active' },
  ];

  const currentStatus = courseStatusOptions.find(opt => opt.value === formData.courseStatus);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PublishIcon color="primary" />
        Publishing & Status
      </Typography>
      <Stack spacing={3}>
          {/* Current Status Display */}
          {currentStatus && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Chip 
                label={currentStatus.label}
                color={getStatusColor(formData.courseStatus)}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                {currentStatus.description}
              </Typography>
            </Box>
          )}

          {/* Status Selection */}
          <FormControl fullWidth>
            <InputLabel>Change Status</InputLabel>
            <Select
              value={formData.courseStatus}
              label="Change Status"
              onChange={(e) => onInputChange('courseStatus', e.target.value)}
            >
              {courseStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Chip 
                      label={option.label} 
                      size="small" 
                      color={getStatusColor(option.value)}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Publishing Options */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.published}
                  onChange={(e) => onInputChange('published', e.target.checked)}
                  color="primary"
                />
              }
              label="Published"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              Make this course visible and accessible to learners
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isMandatoryToAllRole}
                  onChange={(e) => onInputChange('isMandatoryToAllRole', e.target.checked)}
                  color="warning"
                />
              }
              label="Mandatory for All Roles"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              Require all users to complete this course
            </Typography>
          </Box>

          {/* Publishing Guidelines */}
          {formData.courseStatus === 'published' && formData.published && (
            <Alert severity="success" variant="outlined">
              <Typography variant="body2">
                This course is live and accessible to learners.
              </Typography>
            </Alert>
          )}

          {formData.courseStatus === 'draft' && (
            <Alert severity="info" variant="outlined">
              <Typography variant="body2">
                Course is in development. Change status to "Published" and enable "Published" toggle to make it available.
              </Typography>
            </Alert>
          )}
        </Stack>
    </Box>
  );
};

export default PublishingSettings;