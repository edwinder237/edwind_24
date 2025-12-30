import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  CircularProgress
} from '@mui/material';
import { useCreateCurriculumChecklistItemMutation, useUpdateCurriculumChecklistItemMutation } from 'store/api/projectApi';

const AddChecklistItemDialog = ({ open, onClose, curriculumId, editingItem }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'trainer_prep',
    priority: 'medium'
  });

  const [createItem, { isLoading: isCreating }] = useCreateCurriculumChecklistItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateCurriculumChecklistItemMutation();

  const isLoading = isCreating || isUpdating;
  const isEditMode = !!editingItem;

  // Load existing item data when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description || '',
        category: editingItem.category || 'trainer_prep',
        priority: editingItem.priority || 'medium'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'trainer_prep',
        priority: 'medium'
      });
    }
  }, [editingItem, open]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      if (isEditMode) {
        await updateItem({
          id: editingItem.id,
          curriculumId,
          ...formData,
          updatedBy: 'current-user' // TODO: Get from auth context
        }).unwrap();
      } else {
        await createItem({
          curriculumId,
          ...formData,
          createdBy: 'current-user' // TODO: Get from auth context
        }).unwrap();
      }
      onClose();
    } catch (error) {
      console.error('Error saving checklist item:', error);
      alert('Failed to save checklist item');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Checklist Item' : 'Add Checklist Item'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title *"
          fullWidth
          value={formData.title}
          onChange={handleChange('title')}
          disabled={isLoading}
          placeholder="e.g., Book flight to client site"
        />

        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange('description')}
          disabled={isLoading}
          placeholder="Optional details about this task"
        />

        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            onChange={handleChange('category')}
            label="Category"
          >
            <MenuItem value="trainer_prep">Trainer Prep</MenuItem>
            <MenuItem value="logistics">Logistics</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="client_contact">Client Contact</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={formData.priority}
            onChange={handleChange('priority')}
            label="Priority"
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !formData.title.trim()}
        >
          {isLoading ? <CircularProgress size={24} /> : isEditMode ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddChecklistItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  curriculumId: PropTypes.number.isRequired,
  editingItem: PropTypes.object
};

export default AddChecklistItemDialog;
