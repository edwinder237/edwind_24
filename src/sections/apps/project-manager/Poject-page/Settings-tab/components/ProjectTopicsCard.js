import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  Autocomplete,
  TextField,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import MainCard from 'components/MainCard';
import { openSnackbar } from 'store/reducers/snackbar';

const ProjectTopicsCard = React.memo(({ projectId }) => {
  const dispatch = useDispatch();
  const { singleProject } = useSelector((state) => state.projects);
  const [topics, setTopics] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [formError, setFormError] = useState('');

  // Fetch project topics from the project's tags field
  const fetchTopics = async () => {
    if (!singleProject) return;
    
    setLoading(true);
    try {
      // Get topics from the project's tags field instead of separate API
      if (singleProject.tags) {
        console.log('ProjectTopicsCard - raw tags:', singleProject.tags);
        let parsedTags;
        try {
          parsedTags = typeof singleProject.tags === 'string' 
            ? JSON.parse(singleProject.tags) 
            : singleProject.tags;
        } catch (error) {
          console.error('ProjectTopicsCard - Error parsing tags JSON:', error);
          parsedTags = [];
        }
        
        console.log('ProjectTopicsCard - parsed tags:', parsedTags);
        
        // Convert tags array to topics format for display
        const topicsFromTags = Array.isArray(parsedTags) 
          ? parsedTags.map((tag, index) => {
              console.log('ProjectTopicsCard - processing tag:', tag, typeof tag);
              // Ensure title is always a string, handle all possible formats
              let title;
              if (typeof tag === 'string') {
                title = tag;
              } else if (tag && typeof tag === 'object') {
                // Handle object tags with various possible properties
                title = tag.title || tag.label || tag.name || tag.text;
                // If still no title found, extract from object structure
                if (!title && typeof title !== 'string') {
                  // Try to extract the first string value from the object
                  const stringValues = Object.values(tag).filter(v => typeof v === 'string' && v.length > 0);
                  title = stringValues[0] || JSON.stringify(tag);
                }
              } else {
                title = String(tag || 'Unknown');
              }
              
              return {
                id: `tag-${index}`,
                title: String(title), // Double ensure it's a string
                color: '#1976d2', // Default blue color
                icon: '📝' // Default icon
              };
            })
          : [];
          
        console.log('ProjectTopicsCard - final topics:', topicsFromTags);
        setTopics(topicsFromTags);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error('Error parsing project tags:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available topics from sub_organization
  const fetchAvailableTopics = async () => {
    if (!singleProject?.sub_organizationId) return;
    
    try {
      const response = await fetch(`/api/topics?sub_organizationId=${singleProject.sub_organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTopics(data || []);
      } else {
        console.error('Failed to fetch available topics');
      }
    } catch (error) {
      console.error('Error fetching available topics:', error);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchAvailableTopics();
  }, [singleProject?.id, singleProject?.tags, singleProject?.sub_organizationId]);

  const handleOpenDialog = () => {
    setSelectedTopic(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTopic(null);
    setFormError('');
  };

  const handleAddTopicDirectly = async (topic) => {
    try {
      // Get current tags from project
      const currentTags = singleProject.tags 
        ? (typeof singleProject.tags === 'string' ? JSON.parse(singleProject.tags) : singleProject.tags)
        : [];
      
      // Add new topic to tags array if it doesn't already exist
      const newTags = Array.isArray(currentTags) ? [...currentTags] : [];
      if (!newTags.includes(topic.title)) {
        newTags.push(topic.title);
      }
      
      // Update project with new tags
      const response = await fetch(`/api/projects/updateProject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: singleProject.id,
          tags: JSON.stringify(newTags)
        })
      });

      if (response.ok) {
        await fetchTopics(); // Refresh topics
        dispatch(openSnackbar({
          open: true,
          message: 'Topic added to project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        const errorData = await response.json();
        dispatch(openSnackbar({
          open: true,
          message: errorData.error || 'Failed to add topic',
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      console.error('Error adding topic:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to add topic',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedTopic) {
      setFormError('Please select a topic');
      return;
    }

    try {
      setFormError('');
      await handleAddTopicDirectly(selectedTopic);
      handleCloseDialog();
    } catch (error) {
      console.error('Error adding topic:', error);
      setFormError('Failed to add topic');
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;

    try {
      // Get current tags from project
      const currentTags = singleProject.tags 
        ? (typeof singleProject.tags === 'string' ? JSON.parse(singleProject.tags) : singleProject.tags)
        : [];
      
      // Find the topic to delete by its ID and get its title
      const topicToDelete = topics.find(topic => topic.id === topicId);
      if (!topicToDelete) return;
      
      // Remove topic from tags array
      const newTags = Array.isArray(currentTags) 
        ? currentTags.filter(tag => tag !== topicToDelete.title)
        : [];
      
      // Update project with new tags
      const response = await fetch(`/api/projects/updateProject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: singleProject.id,
          tags: JSON.stringify(newTags)
        })
      });

      if (response.ok) {
        await fetchTopics();
        dispatch(openSnackbar({
          open: true,
          message: 'Topic deleted successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        const errorData = await response.json();
        dispatch(openSnackbar({
          open: true,
          message: errorData.error || 'Failed to delete topic',
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete topic',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Topics</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Topic
          </Button>
        </Box>
        <Box sx={{ minHeight: 120 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Loading topics...
            </Typography>
          ) : topics.length === 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose from popular topics or create your own:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTopics.slice(0, 8).map((topic) => (
                  <Chip
                    key={topic.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {topic.icon && <span style={{ fontSize: '14px' }}>{String(topic.icon)}</span>}
                        {String(topic.title || '')}
                      </Box>
                    }
                    variant="outlined"
                    clickable
                    onClick={() => handleAddTopicDirectly(topic)}
                    sx={{
                      borderColor: topic.color || 'primary.main',
                      color: topic.color || 'primary.main',
                      backgroundColor: `${topic.color}10` || 'primary.lighter',
                      '& .MuiChip-label': {
                        px: 1.5,
                        py: 0.5
                      },
                      '&:hover': {
                        backgroundColor: topic.color ? `${topic.color}20` : 'primary.light'
                      }
                    }}
                  />
                ))}
              </Box>
              {availableTopics.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No topics available. Click "Add Topic" to create one.
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {topics.map((topic) => (
                <Box key={topic.id} sx={{ position: 'relative', display: 'inline-block' }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {topic.icon && <span style={{ fontSize: '14px' }}>{String(topic.icon)}</span>}
                        {String(topic.title || '')}
                      </Box>
                    }
                    variant="outlined"
                    sx={{
                      borderColor: topic.color || 'primary.main',
                      color: topic.color || 'primary.main',
                      backgroundColor: `${topic.color}10` || 'primary.lighter',
                      '& .MuiChip-label': {
                        px: 1.5,
                        py: 0.5
                      }
                    }}
                  />
                  <Tooltip title="Remove topic">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(topic.id)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 18,
                        height: 18,
                        backgroundColor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { backgroundColor: 'error.lighter' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 10 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: '500px',
            width: '100%'
          }
        }}
      >
        <MainCard
          title="Add Topic to Project"
          secondary={
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          }
          content={false}
        >
          <Box sx={{ p: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Autocomplete
              options={availableTopics.filter(topic => 
                !topics.some(projectTopic => projectTopic.id === topic.id)
              )}
              getOptionLabel={(option) => option.title}
              value={selectedTopic}
              onChange={(event, newValue) => setSelectedTopic(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Topic"
                  placeholder="Choose a topic from your organization"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.icon && <span style={{ fontSize: '16px' }}>{option.icon}</span>}
                  <Chip
                    label={option.title}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: option.color || 'primary.main',
                      color: option.color || 'primary.main',
                    }}
                  />
                  {option.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              )}
              noOptionsText="No available topics"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                startIcon={<AddIcon />}
                disabled={!selectedTopic}
              >
                Add Topic
              </Button>
            </Box>
          </Box>
        </MainCard>
      </Dialog>
    </>
  );
});

ProjectTopicsCard.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

ProjectTopicsCard.displayName = 'ProjectTopicsCard';

export default ProjectTopicsCard;