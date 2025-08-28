import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton,
  Stack
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import MainCard from 'components/MainCard';

const ChecklistItemForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  item = null, 
  courseId, 
  modules = [] 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    moduleId: '',
    itemOrder: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || 'general',
        priority: item.priority || 'medium',
        moduleId: item.moduleId || '',
        itemOrder: item.itemOrder || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        moduleId: '',
        itemOrder: '',
      });
    }
    setErrors({});
  }, [item, open]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      courseId,
      moduleId: formData.moduleId || null,
      itemOrder: formData.itemOrder ? parseInt(formData.itemOrder) : null,
    };

    if (item) {
      submitData.id = item.id;
    }

    onSubmit(submitData);
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'content', label: 'Content' },
    { value: 'technical', label: 'Technical' },
    { value: 'review', label: 'Review' },
    { value: 'instructor', label: 'Instructor' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '600px',
          width: '100%'
        }
      }}
    >
      <MainCard
        title={item ? 'Edit Checklist Item' : 'Add New Checklist Item'}
        secondary={
          <IconButton onClick={onClose} size="small">
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
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleChange('category')}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Priority"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Module (Optional)</InputLabel>
                <Select
                  value={formData.moduleId}
                  onChange={handleChange('moduleId')}
                  label="Module (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module.id} value={module.id}>
                      {module.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order (Optional)"
                type="number"
                value={formData.itemOrder}
                onChange={handleChange('itemOrder')}
                helperText="Display order within category"
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button 
                  onClick={onClose}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  variant="contained"
                >
                  {item ? 'Update' : 'Create'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </MainCard>
    </Dialog>
  );
};

export default ChecklistItemForm;