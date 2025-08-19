import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import MainCard from 'components/MainCard';

const ProjectCustomizationCard = React.memo(({ 
  project,
  onUpdateBackgroundImage
}) => {
  const [backgroundImgUrl, setBackgroundImgUrl] = useState(project?.backgroundImg || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUrlChange = (event) => {
    const newUrl = event.target.value;
    setBackgroundImgUrl(newUrl);
    setHasChanges(newUrl !== (project?.backgroundImg || ''));
    setError('');
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    setError('');
    
    try {
      await onUpdateBackgroundImage(backgroundImgUrl);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to update background image. Please try again.');
      console.error('Error updating background image:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBackgroundImgUrl(project?.backgroundImg || '');
    setHasChanges(false);
    setError('');
  };

  return (
    <MainCard title="Project Customization">
      <Stack spacing={3}>
        <Typography variant="subtitle1">Card Appearance</Typography>
        
        {/* Background Image URL Field */}
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Background Image URL
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter image URL for project card (e.g., https://example.com/image.jpg)"
            value={backgroundImgUrl}
            onChange={handleUrlChange}
            helperText="Optional: Add a custom image URL for your project card. Leave empty to use the default image."
            error={!!error}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Stack>

        {/* Preview */}
        {backgroundImgUrl && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Preview
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 120,
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                backgroundImage: `url(${backgroundImgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {!backgroundImgUrl && (
                <Typography variant="body2" color="text.secondary">
                  No image URL provided
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </Button>
          </Stack>
        )}
      </Stack>
    </MainCard>
  );
});

ProjectCustomizationCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    backgroundImg: PropTypes.string
  }),
  onUpdateBackgroundImage: PropTypes.func.isRequired
};

ProjectCustomizationCard.displayName = 'ProjectCustomizationCard';

export default ProjectCustomizationCard;