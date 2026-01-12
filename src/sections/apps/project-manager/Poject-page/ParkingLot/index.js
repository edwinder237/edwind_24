import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlusOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  SaveOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'utils/axios';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

const ParkingLot = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const projectId = router.query.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    type: 'issue',
    title: '',
    description: '',
    priority: 'medium',
    reportedBy: '',
    notes: ''
  });

  // New items for quick add (multiple at once)
  const [newItems, setNewItems] = useState([
    { id: 'new-1', type: 'issue', title: '', description: '' }
  ]);

  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all'
  });

  // Fetch items on mount
  useEffect(() => {
    if (projectId) {
      fetchItems();
    }
  }, [projectId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/parking-lot?projectId=${projectId}`);
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching parking lot items:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to load parking lot items',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (reportedDate, solvedDate) => {
    const start = new Date(reportedDate);
    const end = solvedDate ? new Date(solvedDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleOpenDialog = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description || '',
      priority: item.priority,
      reportedBy: item.reportedBy || '',
      notes: item.notes || ''
    });
    setDialogOpen(true);
  };

  // Quick add handlers
  const handleNewItemChange = (id, field, value) => {
    setNewItems(newItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleAddNewRow = () => {
    setNewItems([...newItems, {
      id: `new-${Date.now()}`,
      type: 'issue',
      title: '',
      description: ''
    }]);
  };

  const handleRemoveNewRow = (id) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter(item => item.id !== id));
    }
  };

  const handleSaveAllNewItems = async () => {
    const validItems = newItems.filter(item => item.title.trim());
    if (validItems.length === 0) return;

    setSaving(true);
    try {
      const response = await axios.post(`/api/projects/parking-lot?projectId=${projectId}`, {
        items: validItems.map(item => ({
          type: item.type,
          title: item.title.trim(),
          description: item.description?.trim() || null
        }))
      });

      setItems(response.data.items || []);
      setNewItems([{ id: 'new-1', type: 'issue', title: '', description: '' }]);

      dispatch(openSnackbar({
        open: true,
        message: `${validItems.length} item(s) added successfully`,
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      console.error('Error creating items:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to add items',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      type: 'issue',
      title: '',
      description: '',
      priority: 'medium',
      reportedBy: '',
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const response = await axios.put(
        `/api/projects/parking-lot?projectId=${projectId}&id=${editingItem.id}`,
        formData
      );

      setItems(items.map(item =>
        item.id === editingItem.id ? response.data : item
      ));

      dispatch(openSnackbar({
        open: true,
        message: 'Item updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      handleCloseDialog();
    } catch (error) {
      console.error('Error updating item:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update item',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      const response = await axios.put(
        `/api/projects/parking-lot?projectId=${projectId}&id=${id}`,
        { status: 'resolved' }
      );

      setItems(items.map(item =>
        item.id === id ? response.data : item
      ));

      dispatch(openSnackbar({
        open: true,
        message: 'Item marked as resolved',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      console.error('Error marking complete:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update item',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/projects/parking-lot?projectId=${projectId}&id=${id}`);

      setItems(items.filter(item => item.id !== id));

      dispatch(openSnackbar({
        open: true,
        message: 'Item deleted successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      console.error('Error deleting item:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete item',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.put(
        `/api/projects/parking-lot?projectId=${projectId}&id=${id}`,
        { status: newStatus }
      );

      setItems(items.map(item =>
        item.id === id ? response.data : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const openCount = items.filter(i => i.status === 'open').length;
  const inProgressCount = items.filter(i => i.status === 'in_progress').length;
  const resolvedCount = items.filter(i => i.status === 'resolved').length;

  // Apply filters
  const filteredItems = items.filter(item => {
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
    return true;
  });

  const hasValidNewItems = newItems.some(item => item.title.trim());
  const hasActiveFilters = filters.type !== 'all' || filters.status !== 'all' || filters.priority !== 'all';

  const handleClearFilters = () => {
    setFilters({ type: 'all', status: 'all', priority: 'all' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Parking Lot
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip label={`${openCount} Open`} color="error" size="small" variant="outlined" />
            <Chip label={`${inProgressCount} In Progress`} color="warning" size="small" variant="outlined" />
            <Chip label={`${resolvedCount} Resolved`} color="success" size="small" variant="outlined" />
          </Stack>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchItems} disabled={loading}>
            <ReloadOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Quick Add Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Quick Add Items
        </Typography>
        <Stack spacing={1.5}>
          {newItems.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select
                  value={item.type}
                  onChange={(e) => handleNewItemChange(item.id, 'type', e.target.value)}
                  size="small"
                >
                  <MenuItem value="issue">Issue</MenuItem>
                  <MenuItem value="question">Question</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Title *"
                value={item.title}
                onChange={(e) => handleNewItemChange(item.id, 'title', e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                placeholder="Description (optional)"
                value={item.description}
                onChange={(e) => handleNewItemChange(item.id, 'description', e.target.value)}
                sx={{ flex: 1.5 }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemoveNewRow(item.id)}
                disabled={newItems.length === 1}
                sx={{ color: 'text.secondary' }}
              >
                <CloseOutlined />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            size="small"
            startIcon={<PlusOutlined />}
            onClick={handleAddNewRow}
          >
            Add Row
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            onClick={handleSaveAllNewItems}
            disabled={!hasValidNewItems || saving}
          >
            Save {newItems.filter(i => i.title.trim()).length > 0 ? `(${newItems.filter(i => i.title.trim()).length})` : ''}
          </Button>
        </Stack>
      </Paper>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <FilterOutlined style={{ color: '#999' }} />
            <Typography variant="body2" color="text.secondary">
              Filters:
            </Typography>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="issue">Issue</MenuItem>
              <MenuItem value="question">Question</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={handleClearFilters}
              startIcon={<CloseOutlined />}
            >
              Clear
            </Button>
          )}
          {hasActiveFilters && (
            <Typography variant="body2" color="text.secondary">
              Showing {filteredItems.length} of {items.length} items
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reported</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Solved</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reported By</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {hasActiveFilters ? 'No items match the current filters' : 'No items in parking lot'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    opacity: item.status === 'resolved' ? 0.7 : 1
                  }}
                >
                  <TableCell>
                    <Chip
                      icon={item.type === 'issue' ? <ExclamationCircleOutlined /> : <QuestionCircleOutlined />}
                      label={item.type === 'issue' ? 'Issue' : 'Question'}
                      size="small"
                      color={item.type === 'issue' ? 'error' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        textDecoration: item.status === 'resolved' ? 'line-through' : 'none'
                      }}
                    >
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {item.description.length > 60 ? `${item.description.substring(0, 60)}...` : item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.priority}
                      size="small"
                      color={getPriorityColor(item.priority)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        size="small"
                        sx={{
                          '& .MuiSelect-select': { py: 0.5 },
                          fontSize: '0.75rem'
                        }}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(item.reportedDate)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={item.solvedDate ? 'success.main' : 'text.secondary'}>
                      {formatDate(item.solvedDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${calculateDuration(item.reportedDate, item.solvedDate)} days`}
                      size="small"
                      variant="outlined"
                      color={
                        item.status === 'resolved' ? 'success' :
                        calculateDuration(item.reportedDate, null) > 7 ? 'error' :
                        calculateDuration(item.reportedDate, null) > 3 ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.reportedBy || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 150 }}>
                      {item.notes ? (item.notes.length > 40 ? `${item.notes.substring(0, 40)}...` : item.notes) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {item.status !== 'resolved' && (
                        <Tooltip title="Mark Complete">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleMarkComplete(item.id)}
                          >
                            <CheckOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="issue">Issue</MenuItem>
                <MenuItem value="question">Question</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Reported By"
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
            />
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
              placeholder="Add any additional notes or updates..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.title || saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingLot;
