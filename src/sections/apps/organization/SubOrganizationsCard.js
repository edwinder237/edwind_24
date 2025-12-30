import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';

// project import
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';

// assets
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ProjectOutlined,
  BookOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons';

// ==============================|| SUB-ORGANIZATIONS CARD ||============================== //

const SubOrganizationsCard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [subOrganizations, setSubOrganizations] = useState([]);
  const [limits, setLimits] = useState({ current: 0, max: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubOrg, setSelectedSubOrg] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubOrganizations();
  }, []);

  const fetchSubOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organization/sub-organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch sub-organizations');
      }
      const data = await response.json();
      setSubOrganizations(data.subOrganizations || []);
      setLimits(data.limits || { current: 0, max: 1 });
      setError(null);
    } catch (err) {
      console.error('Error fetching sub-organizations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormTitle('');
    setFormDescription('');
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Title is required',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/organization/sub-organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create sub-organization');
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Sub-organization "${formTitle}" created successfully`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      handleCloseCreateDialog();
      fetchSubOrganizations();
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: err.message,
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (subOrg) => {
    setSelectedSubOrg(subOrg);
    setFormTitle(subOrg.title);
    setFormDescription(subOrg.description || '');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSubOrg(null);
    setFormTitle('');
    setFormDescription('');
  };

  const handleUpdate = async () => {
    if (!formTitle.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Title is required',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/organization/sub-organizations/${selectedSubOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to update sub-organization');
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Sub-organization "${formTitle}" updated successfully`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      handleCloseEditDialog();
      fetchSubOrganizations();
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: err.message,
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (subOrg) => {
    setSelectedSubOrg(subOrg);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedSubOrg(null);
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/organization/sub-organizations/${selectedSubOrg.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete sub-organization');
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Sub-organization "${selectedSubOrg.title}" deleted successfully`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      handleCloseDeleteDialog();
      fetchSubOrganizations();
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: err.message,
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canAddMore = limits.max === -1 || limits.current < limits.max;

  if (loading) {
    return (
      <MainCard title="Sub-Organizations">
        <LinearProgress />
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Sub-Organizations">
        <Alert severity="error">{error}</Alert>
      </MainCard>
    );
  }

  return (
    <>
      <MainCard
        title="Sub-Organizations"
        secondary={
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              {limits.max === -1
                ? `${limits.current} sub-organization(s)`
                : `${limits.current} of ${limits.max} sub-organizations`}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlusOutlined />}
              onClick={handleOpenCreateDialog}
              disabled={!canAddMore}
            >
              Add
            </Button>
          </Stack>
        }
      >
        {!canAddMore && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have reached the maximum number of sub-organizations for your plan.
            Upgrade to add more.
          </Alert>
        )}

        {subOrganizations.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No sub-organizations found. Create your first one to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Projects</TableCell>
                  <TableCell align="center">Instructors</TableCell>
                  <TableCell align="center">Users</TableCell>
                  <TableCell align="center">Courses</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subOrganizations.map((subOrg) => (
                  <TableRow key={subOrg.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {subOrg.title}
                        </Typography>
                        {subOrg.description && (
                          <Typography variant="caption" color="textSecondary">
                            {subOrg.description.length > 60
                              ? `${subOrg.description.substring(0, 60)}...`
                              : subOrg.description}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                        <ProjectOutlined style={{ color: theme.palette.primary.main }} />
                        <Typography variant="body2">{subOrg._count?.projects || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                        <UserOutlined style={{ color: theme.palette.info.main }} />
                        <Typography variant="body2">{subOrg._count?.instructors || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                        <TeamOutlined style={{ color: theme.palette.success.main }} />
                        <Typography variant="body2">{subOrg._count?.users || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                        <BookOutlined style={{ color: theme.palette.warning.main }} />
                        <Typography variant="body2">{subOrg._count?.courses || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(subOrg)}
                          >
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(subOrg)}
                            disabled={subOrganizations.length <= 1}
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Sub-Organization</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Training Division"
            />
            <TextField
              label="Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional description for this sub-organization"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={submitting || !formTitle.trim()}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Sub-Organization</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={submitting || !formTitle.trim()}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningOutlined style={{ color: theme.palette.error.main }} />
            <span>Delete Sub-Organization</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedSubOrg?.title}</strong>?
          </Typography>
          {selectedSubOrg?._count && (
            (selectedSubOrg._count.projects > 0 ||
             selectedSubOrg._count.instructors > 0 ||
             selectedSubOrg._count.users > 0 ||
             selectedSubOrg._count.courses > 0) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This sub-organization has associated data and cannot be deleted until
                the data is moved or removed.
              </Alert>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubOrganizationsCard;
