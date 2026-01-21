import React, { useState, useEffect, useMemo } from 'react';
import NextLink from 'next/link';
import {
  Container,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  MenuItem,
  Chip,
  ListItemText as MuiListItemText,
  Menu,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  MenuBook as MenuBookIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';
import Layout from 'layout';
import DataTable, { DataTableSkeleton } from 'components/DataTable';

// ==============================|| CELL RENDERERS ||============================== //

const TitleCell = ({ value, row }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1rem'
      }}
    >
      {value?.charAt(0)?.toUpperCase() || 'C'}
    </Box>
    <Stack spacing={0}>
      <Typography variant="subtitle1" fontWeight={600}>
        {value}
      </Typography>
      {row.original.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {row.original.description}
        </Typography>
      )}
    </Stack>
  </Stack>
);

const ChipCell = ({ value, label, color = 'primary' }) => (
  <Chip
    label={`${value || 0} ${label}`}
    size="small"
    color={color}
    variant="outlined"
  />
);

const DateCell = ({ value }) => (
  <Typography variant="body2" color="text.secondary">
    {value ? new Date(value).toLocaleDateString() : '-'}
  </Typography>
);

// ==============================|| ACTION CELL ||============================== //

const ActionCell = ({ row, onEdit, onDelete, onDuplicate, duplicatingId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const item = row.original;

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
      <Tooltip title="Edit & Manage">
        <IconButton
          component={NextLink}
          href={`/curriculums/edit/${item.id}`}
          color="primary"
          size="small"
          onClick={(e) => e.stopPropagation()}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Duplicate">
        <IconButton
          color="secondary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(item);
          }}
          disabled={duplicatingId === item.id}
        >
          {duplicatingId === item.id ? (
            <CircularProgress size={16} />
          ) : (
            <CopyIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <IconButton
        color="secondary"
        size="small"
        onClick={handleClick}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem
          component={NextLink}
          href={`/curriculums/edit/${item.id}`}
          onClick={handleClose}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <MuiListItemText>View & Manage</MuiListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); onEdit(item); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <MuiListItemText>Edit Details</MuiListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { handleClose(); onDuplicate(item); }}
          disabled={duplicatingId === item.id}
        >
          <ListItemIcon>
            {duplicatingId === item.id ? (
              <CircularProgress size={16} />
            ) : (
              <CopyIcon fontSize="small" />
            )}
          </ListItemIcon>
          <MuiListItemText>Duplicate</MuiListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleClose(); onDelete(item); }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <MuiListItemText>Delete</MuiListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
};

// ==============================|| CURRICULUMS PAGE ||============================== //

const CurriculumsPage = () => {
  const dispatch = useDispatch();
  const [curriculums, setCurriculums] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedCourses: []
  });

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        Header: 'Title',
        accessor: 'title',
        Cell: TitleCell
      },
      {
        Header: 'Courses',
        accessor: 'courseCount',
        Cell: ({ value }) => <ChipCell value={value} label="Courses" color="primary" />,
        className: 'cell-center'
      },
      {
        Header: 'Support',
        accessor: 'supportActivitiesCount',
        Cell: ({ value }) => <ChipCell value={value} label="Support" color="secondary" />,
        className: 'cell-center'
      },
      {
        Header: 'Projects',
        accessor: 'projectCount',
        Cell: ({ value }) => <ChipCell value={value} label="Projects" color={value > 0 ? 'success' : 'default'} />,
        className: 'cell-center'
      },
      {
        Header: 'Created',
        accessor: 'createdAt',
        Cell: DateCell,
        disableFilters: true
      },
      {
        Header: 'Updated',
        accessor: 'updatedAt',
        Cell: DateCell,
        disableFilters: true
      },
      {
        Header: 'ID',
        accessor: 'id',
        disableFilters: true
      },
      {
        Header: 'Description',
        accessor: 'description',
        disableFilters: true
      }
    ],
    []
  );

  // Fetch all curriculums
  const fetchCurriculums = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculums/fetchCurriculums');
      const data = await response.json();
      setCurriculums(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      setCurriculums([]);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch curriculums',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/fetchCourses');
      const data = await response.json();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Create curriculum
  const handleCreateCurriculum = async () => {
    if (!formData.title.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a curriculum title',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch('/api/curriculums/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      });

      const result = await response.json();

      if (result.success) {
        if (formData.selectedCourses.length > 0) {
          await Promise.all(
            formData.selectedCourses.map(courseId =>
              fetch('/api/curriculums/add-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  curriculumId: result.curriculum.id,
                  courseId
                })
              })
            )
          );
        }

        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum created successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));

        setCreateDialogOpen(false);
        setFormData({ title: '', description: '', selectedCourses: [] });
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to create curriculum');
      }
    } catch (error) {
      console.error('Error creating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to create curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Update curriculum
  const handleUpdateCurriculum = async () => {
    if (!formData.title.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a curriculum title',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch('/api/curriculums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCurriculum.id,
          title: formData.title,
          description: formData.description
        })
      });

      const result = await response.json();

      if (result.success) {
        const currentCourseIds = selectedCurriculum.curriculum_courses?.map(cc => cc.courseId) || [];
        const newCourseIds = formData.selectedCourses;

        const coursesToRemove = currentCourseIds.filter(id => !newCourseIds.includes(id));
        const coursesToAdd = newCourseIds.filter(id => !currentCourseIds.includes(id));

        await Promise.all(
          coursesToRemove.map(courseId =>
            fetch('/api/curriculums/remove-course', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                curriculumId: selectedCurriculum.id,
                courseId
              })
            })
          )
        );

        await Promise.all(
          coursesToAdd.map(courseId =>
            fetch('/api/curriculums/add-course', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                curriculumId: selectedCurriculum.id,
                courseId
              })
            })
          )
        );

        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));

        setEditDialogOpen(false);
        setSelectedCurriculum(null);
        setFormData({ title: '', description: '', selectedCourses: [] });
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to update curriculum');
      }
    } catch (error) {
      console.error('Error updating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Duplicate curriculum
  const handleDuplicateCurriculum = async (curriculum) => {
    try {
      setDuplicatingId(curriculum.id);
      const response = await fetch('/api/curriculums/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: curriculum.id })
      });

      const result = await response.json();

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum duplicated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to duplicate curriculum');
      }
    } catch (error) {
      console.error('Error duplicating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to duplicate curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDuplicatingId(null);
    }
  };

  // Delete curriculum
  const handleDeleteCurriculum = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/curriculums/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCurriculum.id })
      });

      const result = await response.json();

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum deleted successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));

        setDeleteDialogOpen(false);
        setSelectedCurriculum(null);
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to delete curriculum');
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to delete curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Open create dialog
  const handleOpenCreateDialog = () => {
    setFormData({ title: '', description: '', selectedCourses: [] });
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (curriculum) => {
    setSelectedCurriculum(curriculum);
    setFormData({
      title: curriculum.title,
      description: curriculum.description || '',
      selectedCourses: curriculum.curriculum_courses?.map(cc => cc.courseId) || []
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (curriculum) => {
    setSelectedCurriculum(curriculum);
    setDeleteDialogOpen(true);
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Render actions for each row
  const renderActions = (row) => (
    <ActionCell
      row={row}
      onEdit={handleOpenEditDialog}
      onDelete={handleOpenDeleteDialog}
      onDuplicate={handleDuplicateCurriculum}
      duplicatingId={duplicatingId}
    />
  );

  useEffect(() => {
    fetchCurriculums();
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <DataTableSkeleton rows={10} columns={7} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Page Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Organize courses into structured learning paths. Create and manage curriculums to define training programs for your projects.
        </Typography>

        {/* Empty State */}
        {curriculums.length === 0 ? (
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <MenuBookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Curriculums Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first curriculum to get started with organized learning paths.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                size="large"
              >
                Create First Curriculum
              </Button>
            </Box>
          </MainCard>
        ) : (
          <DataTable
            columns={columns}
            data={curriculums}
            hiddenColumns={['id', 'description']}
            emptyMessage="No Curriculums Found"
            csvFilename="curriculums.csv"
            createButtonLabel="Create Curriculum"
            onCreate={handleOpenCreateDialog}
            renderActions={renderActions}
          />
        )}

        {/* Create Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
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
            title="Create New Curriculum"
            secondary={
              <IconButton onClick={() => setCreateDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Curriculum Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="e.g., Full Stack Web Development"
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the curriculum objectives and learning outcomes..."
                />

                <FormControl fullWidth>
                  <InputLabel>Select Courses</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedCourses}
                    onChange={(e) => handleInputChange('selectedCourses', e.target.value)}
                    input={<OutlinedInput label="Select Courses" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const course = courses.find(c => c.id === value);
                          return (
                            <Chip
                              key={value}
                              label={course?.title || `Course ${value}`}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Checkbox checked={formData.selectedCourses.indexOf(course.id) > -1} />
                        <MuiListItemText
                          primary={course.title}
                          secondary={`${course.level} • ${course.courseCategory}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    onClick={() => setCreateDialogOpen(false)}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCurriculum}
                    variant="contained"
                    startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={actionLoading || !formData.title.trim()}
                  >
                    Create Curriculum
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </MainCard>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
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
            title="Edit Curriculum"
            secondary={
              <IconButton onClick={() => setEditDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Curriculum Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the curriculum objectives and learning outcomes..."
                />

                <FormControl fullWidth>
                  <InputLabel>Select Courses</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedCourses}
                    onChange={(e) => handleInputChange('selectedCourses', e.target.value)}
                    input={<OutlinedInput label="Select Courses" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const course = courses.find(c => c.id === value);
                          return (
                            <Chip
                              key={value}
                              label={course?.title || `Course ${value}`}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Checkbox checked={formData.selectedCourses.indexOf(course.id) > -1} />
                        <MuiListItemText
                          primary={course.title}
                          secondary={`${course.level} • ${course.courseCategory}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    onClick={() => setEditDialogOpen(false)}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCurriculum}
                    variant="contained"
                    startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={actionLoading || !formData.title.trim()}
                  >
                    Update Curriculum
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </MainCard>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" color="error">
              Delete Curriculum
            </Typography>
          </DialogTitle>

          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete "{selectedCurriculum?.title}"?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. All associated support activities will also be deleted.
              {selectedCurriculum?.projectCount > 0 && (
                <span style={{ color: 'orange', fontWeight: 'bold' }}>
                  <br />Warning: This curriculum is currently used in {selectedCurriculum.projectCount} project(s).
                </span>
              )}
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCurriculum}
              variant="contained"
              color="error"
              startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              disabled={actionLoading}
            >
              Delete Curriculum
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

CurriculumsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CurriculumsPage;
