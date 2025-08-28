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

  // Fetch project topics
  const fetchTopics = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data || []);
      } else {
        console.error('Failed to fetch topics');
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
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
  }, [projectId, singleProject?.sub_organizationId]);

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

  const handleSubmit = async () => {
    if (!selectedTopic) {
      setFormError('Please select a topic');
      return;
    }

    try {
      setFormError('');
      const response = await fetch(`/api/projects/${projectId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic.id
        })
      });

      if (response.ok) {
        await fetchTopics();
        handleCloseDialog();
        
        dispatch(openSnackbar({
          open: true,
          message: 'Topic added to project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to add topic');
      }
    } catch (error) {
      console.error('Error adding topic:', error);
      setFormError('Failed to add topic');
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/topics/${topicId}`, {
        method: 'DELETE'
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
      <MainCard
        title="Project Topics"
        secondary={
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Topic
          </Button>
        }
      >
        <Box sx={{ minHeight: 120 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Loading topics...
            </Typography>
          ) : topics.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No topics added yet. Click "Add Topic" to get started.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {topics.map((topic) => (
                <Box key={topic.id} sx={{ position: 'relative', display: 'inline-block' }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {topic.icon && <span style={{ fontSize: '14px' }}>{topic.icon}</span>}
                        {topic.title}
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
      </MainCard>

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