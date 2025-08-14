import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import { 
  Box, 
  Typography, 
  Button, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, 
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Stack,
  InputAdornment,
  Fade,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { EditOutlined, DeleteOutlined, SearchOutlined, FilterListOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import AppTable, { SelectionCell, SelectionHeader } from 'components/AppTable';
import MainCard from 'components/MainCard';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { PlusOutlined } from '@ant-design/icons';

// ==============================|| PARTICIPANT ROLES MANAGEMENT ||============================== //

function ParticipantRolesPage() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, role: null });
  
  // Optimistic updates cache
  const [optimisticRoles, setOptimisticRoles] = useState([]);

  // Load roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Update optimistic cache when roles change
  useEffect(() => {
    setOptimisticRoles(roles);
  }, [roles]);

  const fetchRoles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/participant-roles', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        setErrorMessage('');
      } else {
        const errorData = await response.json();
        const message = errorData.error || 'Failed to load participant roles';
        setErrorMessage(message);
        dispatch(
          openSnackbar({
            open: true,
            message,
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch participant roles:', error);
      const message = 'Network error. Please check your connection.';
      setErrorMessage(message);
      dispatch(
        openSnackbar({
          open: true,
          message,
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [dispatch]);

  const handleAdd = useCallback(() => {
    setEditingRole(null);
    setFormData({ title: '', description: '' });
    setFormErrors({});
    setErrorMessage('');
    setOpen(true);
  }, []);

  const handleEdit = useCallback((role) => {
    setEditingRole(role);
    setFormData({ 
      title: role.title || '', 
      description: role.description || ''
    });
    setFormErrors({});
    setErrorMessage('');
    setOpen(true);
  }, []);

  const handleDelete = useCallback((role) => {
    setDeleteConfirm({ open: true, role });
  }, []);

  const handleDeleteConfirm = useCallback(async (confirmed) => {
    if (confirmed && deleteConfirm.role) {
      const roleToDelete = deleteConfirm.role;
      
      // Optimistic update - remove from UI immediately
      setOptimisticRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
      
      try {
        const response = await fetch(`/api/participant-roles/${roleToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Update actual data
          setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
          setErrorMessage('');
          dispatch(
            openSnackbar({
              open: true,
              message: `Role "${roleToDelete.title}" deleted successfully`,
              variant: 'alert',
              alert: { color: 'success' }
            })
          );
        } else {
          // Revert optimistic update on error
          setOptimisticRoles(roles);
          const errorData = await response.json();
          const message = errorData.error || 'Failed to delete role';
          setErrorMessage(message);
          dispatch(
            openSnackbar({
              open: true,
              message,
              variant: 'alert',
              alert: { color: 'error' }
            })
          );
        }
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticRoles(roles);
        console.error('Failed to delete role:', error);
        const message = 'Network error. Please try again.';
        setErrorMessage(message);
        dispatch(
          openSnackbar({
            open: true,
            message,
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    }
    
    setDeleteConfirm({ open: false, role: null });
  }, [deleteConfirm.role, roles, dispatch]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Role title is required';
    } else if (formData.title.trim().length < 2) {
      errors.title = 'Role title must be at least 2 characters';
    } else if (formData.title.trim().length > 50) {
      errors.title = 'Role title must be less than 50 characters';
    }
    
    if (formData.description && formData.description.length > 255) {
      errors.description = 'Description must be less than 255 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const url = editingRole ? `/api/participant-roles/${editingRole.id}` : '/api/participant-roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description?.trim() || null
        }),
      });

      if (response.ok) {
        const savedRole = await response.json();
        
        // Optimistic update
        if (editingRole) {
          setOptimisticRoles(prev => prev.map(r => r.id === editingRole.id ? savedRole : r));
          setRoles(prev => prev.map(r => r.id === editingRole.id ? savedRole : r));
        } else {
          setOptimisticRoles(prev => [...prev, savedRole]);
          setRoles(prev => [...prev, savedRole]);
        }
        
        setOpen(false);
        setFormData({ title: '', description: '' });
        setFormErrors({});
        setEditingRole(null);
        
        dispatch(
          openSnackbar({
            open: true,
            message: editingRole 
              ? `Role "${formData.title}" updated successfully`
              : `Role "${formData.title}" created successfully`,
            variant: 'alert',
            alert: { color: 'success' }
          })
        );
      } else {
        const errorData = await response.json();
        const message = errorData.error || 'Failed to save role';
        setErrorMessage(message);
        dispatch(
          openSnackbar({
            open: true,
            message,
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Failed to save role:', error);
      const message = 'Network error. Please check your connection.';
      setErrorMessage(message);
      dispatch(
        openSnackbar({
          open: true,
          message,
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingRole, validateForm, dispatch]);

  const handleClose = useCallback(() => {
    if (submitting) return; // Prevent closing while submitting
    
    setOpen(false);
    setFormData({ title: '', description: '' });
    setFormErrors({});
    setEditingRole(null);
    setErrorMessage('');
  }, [submitting]);

  // Filtered and searched roles
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return optimisticRoles;
    
    const term = searchTerm.toLowerCase();
    return optimisticRoles.filter(role => 
      role.title.toLowerCase().includes(term) ||
      (role.description && role.description.toLowerCase().includes(term)) ||
      role.organization.toLowerCase().includes(term)
    );
  }, [optimisticRoles, searchTerm]);

  // Debounced search
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        Header: SelectionHeader,
        accessor: 'selection',
        Cell: SelectionCell,
        disableSortBy: true,
        disableFilters: true,
      },
      {
        Header: 'ID',
        accessor: 'id',
        className: 'cell-center',
        Cell: ({ value }) => (
          <Typography variant="body2" color="text.secondary">
            #{value}
          </Typography>
        ),
      },
      {
        Header: 'Role Title',
        accessor: 'title',
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={row.original.title}
              variant="outlined"
              size="small"
              color="primary"
            />
          </Box>
        ),
      },
      {
        Header: 'Description',
        accessor: 'description',
        Cell: ({ value }) => (
          <Typography variant="body2" color="text.secondary">
            {value || 'No description'}
          </Typography>
        ),
      },
      {
        Header: 'Organization',
        accessor: 'organization',
        Cell: ({ value }) => (
          <Typography variant="body2">
            {value}
          </Typography>
        ),
      },
      {
        Header: 'Status',
        accessor: 'isActive',
        className: 'cell-center',
        Cell: ({ value }) => (
          <Chip
            label={value ? 'Active' : 'Inactive'}
            size="small"
            color={value ? 'success' : 'default'}
            variant="filled"
          />
        ),
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        disableSortBy: true,
        disableFilters: true,
        className: 'cell-center',
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit role">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row.original);
                }}
              >
                <EditOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete role">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.original);
                }}
              >
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  return (
    <Page title="Participant Roles Management">
      <MainCard
        title="Participant Roles Management"
        content={false}
        secondary={
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Role
          </Button>
        }
      >
        {errorMessage && !open && (
          <Alert severity="error" sx={{ m: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        <AppTable
          columns={columns}
          data={roles || []}
          handleAdd={handleAdd}
          addButtonText="Add Role"
          showAddButton={false}
          csvFilename="participant-roles-export.csv"
          emptyMessage={loading ? "Loading participant roles..." : "No participant roles available. Click 'Add Role' to create your first role."}
          initialPageSize={25}
          initialSortBy={{ id: 'title', desc: false }}
        />
      </MainCard>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={submitting}
      >
        <DialogTitle>
          <Typography variant="h6">
            {editingRole ? 'Edit Participant Role' : 'Add New Participant Role'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {errorMessage && (
            <Fade in={!!errorMessage}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            </Fade>
          )}
          
          <TextField
            autoFocus
            label="Role Title"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (formErrors.title) {
                setFormErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            placeholder="Enter role name (e.g., Sales Manager, Sales Rep, Team Lead, etc.)"
            error={!!formErrors.title}
            helperText={formErrors.title}
            disabled={submitting}
            sx={{ mb: 3, mt: 1 }}
            inputProps={{ maxLength: 50 }}
          />
          
          <TextField
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, description: e.target.value }));
              if (formErrors.description) {
                setFormErrors(prev => ({ ...prev, description: '' }));
              }
            }}
            placeholder="Brief description of the role and its responsibilities (optional)"
            error={!!formErrors.description}
            helperText={formErrors.description || `${formData.description?.length || 0}/255 characters`}
            disabled={submitting}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 255 }}
          />

          {/* Preview */}
          {formData.title && (
            <Fade in={!!formData.title}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={formData.title || 'Role Title'}
                    variant="outlined"
                    size="small"
                    color="primary"
                  />
                </Box>
                {formData.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.description}
                  </Typography>
                )}
              </Box>
            </Fade>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose} 
            color="secondary" 
            variant="outlined"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title?.trim() || submitting || Object.keys(formErrors).length > 0}
            startIcon={submitting ? <CircularProgress size={16} /> : <PlusOutlined />}
          >
            {submitting ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => handleDeleteConfirm(false)}
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role <strong>"{deleteConfirm.role?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The role will be deactivated and no longer available for selection.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDeleteConfirm(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleDeleteConfirm(true)} color="error" variant="contained">
            Delete Role
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}

ParticipantRolesPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ParticipantRolesPage;