import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Skeleton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Support as SupportIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';

const SupportActivitiesManager = ({ curriculumId, curriculumTitle }) => {
  const dispatch = useDispatch();
  const [supportActivities, setSupportActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activityType: '',
    duration: ''
  });

  const activityTypes = [
    'Floor Support',
    'One-on-one',
    'Workshop',
    'Group Review',
    'Consultation',
    'Group Discussion',
    'Lab Session',
    'Office Hours',
    'Mentoring',
    'Assessment',
    'Demo',
    'Q&A Session'
  ];

  // Fetch support activities for this curriculum
  const fetchSupportActivities = async () => {
    if (!curriculumId) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/supportActivities/getByCurriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSupportActivities(result.supportActivities || []);
      } else {
        throw new Error(result.message || 'Failed to fetch support activities');
      }
    } catch (error) {
      console.error('Error fetching support activities:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch support activities',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Create or update support activity
  const handleSave = async () => {
    try {
      const isEditing = !!editingActivity;
      const url = isEditing ? '/api/supportActivities/update' : '/api/supportActivities/create';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        curriculumId,
        duration: formData.duration ? parseInt(formData.duration) : null,
        ...(isEditing && { id: editingActivity.id })
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: `Support activity ${isEditing ? 'updated' : 'created'} successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setDialogOpen(false);
        resetForm();
        fetchSupportActivities();
      } else {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} support activity`);
      }
    } catch (error) {
      console.error('Error saving support activity:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to save support activity',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Delete support activity
  const handleDelete = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this support activity?')) {
      return;
    }

    try {
      const response = await fetch('/api/supportActivities/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activityId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Support activity deleted successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        fetchSupportActivities();
      } else {
        throw new Error(result.message || 'Failed to delete support activity');
      }
    } catch (error) {
      console.error('Error deleting support activity:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete support activity',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Open dialog for new activity
  const handleAdd = () => {
    resetForm();
    setEditingActivity(null);
    setDialogOpen(true);
  };

  // Open dialog for editing activity
  const handleEdit = (activity) => {
    setFormData({
      title: activity.title,
      description: activity.description || '',
      activityType: activity.activityType,
      duration: activity.duration ? activity.duration.toString() : ''
    });
    setEditingActivity(activity);
    setDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activityType: '',
      duration: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get activity type color
  const getActivityTypeColor = (type) => {
    const colorMap = {
      'Floor Support': 'primary',
      'One-on-one': 'secondary',
      'Workshop': 'success',
      'Group Review': 'info',
      'Consultation': 'warning',
      'Group Discussion': 'default',
      'Lab Session': 'primary',
      'Office Hours': 'secondary',
      'Mentoring': 'success',
      'Assessment': 'error',
      'Demo': 'info',
      'Q&A Session': 'warning'
    };
    return colorMap[type] || 'default';
  };

  useEffect(() => {
    fetchSupportActivities();
  }, [curriculumId]);

  if (!curriculumId) {
    return (
      <Alert severity="info">
        Please select a curriculum to manage support activities.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SupportIcon color="primary" />
              Support Activities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage additional support activities for {curriculumTitle}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            size="small"
          >
            Add Activity
          </Button>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Support Activities List */}
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} variant="rectangular" height={100} />
            ))}
          </Stack>
        ) : supportActivities.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <SupportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Support Activities Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add support activities to provide additional learning assistance for this curriculum.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add First Activity
            </Button>
          </Paper>
        ) : (
          <List sx={{ p: 0 }}>
            {supportActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2,
                    p: 2
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <SupportIcon />
                  </Avatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {activity.title}
                        </Typography>
                        <Chip
                          label={activity.activityType}
                          size="small"
                          color={getActivityTypeColor(activity.activityType)}
                          variant="outlined"
                        />
                        {activity.duration && (
                          <Tooltip title="Duration">
                            <Chip
                              icon={<TimeIcon />}
                              label={`${activity.duration} min`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    }
                    secondary={
                      activity.description && (
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                      )
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(activity)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(activity.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              maxWidth: '600px',
              width: '100%'
            }
          }}
        >
          <MainCard
            title={editingActivity ? 'Edit Support Activity' : 'Add Support Activity'}
            secondary={
              <IconButton onClick={() => setDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Activity Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    placeholder="e.g., One-on-One Code Review"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Activity Type"
                    value={formData.activityType}
                    onChange={(e) => handleInputChange('activityType', e.target.value)}
                    required
                  >
                    {activityTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="e.g., 45"
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">min</Typography>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this support activity involves..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button 
                      onClick={() => setDialogOpen(false)}
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!formData.title || !formData.activityType}
                    >
                      {editingActivity ? 'Update' : 'Create'} Activity
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </MainCard>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SupportActivitiesManager;