import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useGetCurriculumChecklistItemsQuery, useDeleteCurriculumChecklistItemMutation } from 'store/api/projectApi';
import AddChecklistItemDialog from './AddChecklistItemDialog';

const CurriculumChecklistManager = ({ curriculumId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch checklist items
  const { data: checklistItems = [], isLoading, refetch } = useGetCurriculumChecklistItemsQuery(curriculumId, {
    skip: !curriculumId
  });

  const [deleteItem] = useDeleteCurriculumChecklistItemMutation();

  const handleAddClick = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await deleteItem({ id: item.id, curriculumId }).unwrap();
      } catch (error) {
        console.error('Error deleting checklist item:', error);
        alert('Failed to delete checklist item');
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
    refetch();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      trainer_prep: 'Trainer Prep',
      logistics: 'Logistics',
      admin: 'Admin',
      client_contact: 'Client Contact'
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Trainer Checklist Templates ({checklistItems.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Checklist Item
        </Button>
      </Box>

      {/* Empty State */}
      {checklistItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Checklist Items
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create checklist items that trainers need to complete for projects using this curriculum.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ mt: 2 }}
          >
            Add First Item
          </Button>
        </Paper>
      ) : (
        /* Table */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checklistItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Tooltip title="Drag to reorder (coming soon)">
                      <DragIcon sx={{ color: 'text.secondary', cursor: 'move' }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                      {item.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryLabel(item.category)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.priority.toUpperCase()}
                      size="small"
                      color={getPriorityColor(item.priority)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <AddChecklistItemDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        curriculumId={curriculumId}
        editingItem={editingItem}
      />
    </Box>
  );
};

CurriculumChecklistManager.propTypes = {
  curriculumId: PropTypes.number.isRequired
};

export default CurriculumChecklistManager;
