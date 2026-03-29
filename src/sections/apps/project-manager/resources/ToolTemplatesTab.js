import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// project import
import DataTable, { DataTableSkeleton } from 'components/DataTable';
import MainCard from 'components/MainCard';
import DeleteCard from 'components/cards/DeleteCard';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';

// ==============================|| TOOL TEMPLATES TAB ||============================== //

function ToolTemplatesTab() {
  const dispatch = useDispatch();

  // Tools data state
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    toolType: '',
    toolUrl: '',
    toolDescription: ''
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);

  // Fetch tools from API
  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organization-tools');
      if (response.ok) {
        const data = await response.json();
        setTools(data);
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load tool templates',
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Error fetching tool templates:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load tool templates',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Load data on mount
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const columns = useMemo(
    () => [
      {
        Header: 'Tool Name',
        accessor: 'name'
      },
      {
        Header: 'Type',
        accessor: 'toolType',
        Cell: ({ value }) =>
          value ? (
            <Chip label={value} size="small" color="primary" variant="outlined" />
          ) : (
            '-'
          )
      },
      {
        Header: 'URL',
        accessor: 'toolUrl',
        Cell: ({ value }) =>
          value ? (
            <Tooltip title={value}>
              <Typography
                variant="body2"
                color="primary"
                component="a"
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  maxWidth: 250,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <LinkOutlined style={{ fontSize: 14 }} />
                {value}
              </Typography>
            </Tooltip>
          ) : (
            '-'
          )
      },
      {
        Header: 'Description',
        accessor: 'toolDescription',
        Cell: ({ value }) => (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {value || '-'}
          </Typography>
        )
      }
    ],
    []
  );

  // Handle opening the edit dialog
  const handleEditTool = (tool) => {
    setEditingTool(tool);
    setEditFormData({
      name: tool.name || '',
      toolType: tool.toolType || '',
      toolUrl: tool.toolUrl || '',
      toolDescription: tool.toolDescription || ''
    });
    setEditDialogOpen(true);
  };

  // Handle creating a new tool
  const handleCreate = () => {
    setEditingTool(null);
    setEditFormData({
      name: '',
      toolType: '',
      toolUrl: '',
      toolDescription: ''
    });
    setEditDialogOpen(true);
  };

  // Handle closing the edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTool(null);
  };

  // Handle form field changes
  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle saving the tool
  const handleSaveTool = async () => {
    if (!editFormData.name.trim()) return;

    try {
      if (editingTool) {
        // Update existing tool
        const response = await fetch(`/api/organization-tools/${editingTool.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (response.ok) {
          const updated = await response.json();
          setTools((prevTools) => prevTools.map((t) => (t.id === editingTool.id ? updated : t)));
          dispatch(
            openSnackbar({
              open: true,
              message: `Tool "${editFormData.name}" updated successfully`,
              variant: 'alert',
              alert: { color: 'success' }
            })
          );
        } else {
          const errorData = await response.json();
          dispatch(
            openSnackbar({
              open: true,
              message: errorData.error || 'Failed to update tool',
              variant: 'alert',
              alert: { color: 'error' }
            })
          );
          return;
        }
      } else {
        // Create new tool
        const response = await fetch('/api/organization-tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (response.ok) {
          const newTool = await response.json();
          setTools((prevTools) => [...prevTools, newTool]);
          dispatch(
            openSnackbar({
              open: true,
              message: `Tool "${editFormData.name}" created successfully`,
              variant: 'alert',
              alert: { color: 'success' }
            })
          );
        } else {
          const errorData = await response.json();
          dispatch(
            openSnackbar({
              open: true,
              message: errorData.error || 'Failed to create tool',
              variant: 'alert',
              alert: { color: 'error' }
            })
          );
          return;
        }
      }
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error saving tool:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save tool',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    }
  };

  // Handle opening delete dialog
  const handleDeleteTool = (tool) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setToolToDelete(null);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;

    try {
      const response = await fetch(`/api/organization-tools/${toolToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTools((prevTools) => prevTools.filter((t) => t.id !== toolToDelete.id));
        dispatch(
          openSnackbar({
            open: true,
            message: `Tool "${toolToDelete.name}" deleted successfully`,
            variant: 'alert',
            alert: { color: 'success' }
          })
        );
      } else {
        const errorData = await response.json();
        dispatch(
          openSnackbar({
            open: true,
            message: errorData.error || 'Failed to delete tool',
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete tool',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const renderActions = (row) => (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEditTool(row.original);
          }}
        >
          <EditOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTool(row.original);
          }}
        >
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  if (loading) {
    return (
      <>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={600} height={24} />
        </Box>
        <DataTableSkeleton rows={10} columns={4} />
      </>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Manage your organization&apos;s tool templates. Define tools once (name, URL, description) and reuse them when assigning access to participants — only a username and password will be needed.
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={tools}
        createButtonLabel="Add Tool"
        onCreate={handleCreate}
        renderActions={renderActions}
        csvFilename="tool-templates-export.csv"
        emptyMessage="No tool templates found. Add your first tool to get started."
        initialPageSize={10}
      />

      {/* Edit/Create Tool Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <MainCard title={editingTool ? 'Edit Tool Template' : 'Add New Tool Template'} content={false} sx={{ m: 0 }}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tool Name"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  required
                  placeholder="e.g., Salesforce CRM"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tool Type"
                  value={editFormData.toolType}
                  onChange={(e) => handleEditFormChange('toolType', e.target.value)}
                  placeholder="e.g., crm, lms, dashboard"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tool URL"
                  value={editFormData.toolUrl}
                  onChange={(e) => handleEditFormChange('toolUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.toolDescription}
                  onChange={(e) => handleEditFormChange('toolDescription', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Brief description of this tool and how participants should use it"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEditDialog} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveTool} variant="contained" disabled={!editFormData.name.trim()}>
              {editingTool ? 'Save Changes' : 'Create Tool'}
            </Button>
          </DialogActions>
        </MainCard>
      </Dialog>

      {/* Delete Tool Confirmation Dialog */}
      <DeleteCard
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onDelete={handleConfirmDelete}
        title="Delete Tool Template"
        itemName={toolToDelete?.name}
        message={`Are you sure you want to delete "${toolToDelete?.name}"? Existing participant tool accesses will not be affected.`}
      />
    </>
  );
}

export default ToolTemplatesTab;
