import {
  Typography,
  Button,
  Stack,
  Dialog,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import { EditTwoTone, DeleteTwoTone, MailOutlined, CloseOutlined } from '@ant-design/icons';
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'utils/axios';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import AppTable, { SelectionCell, SelectionHeader } from 'components/AppTable';
import InstructorDeleteAlert from 'sections/apps/project-manager/resources/InstructorDeleteAlert';

// ==============================|| INSTRUCTORS ||============================== //

const Instructors = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    expertise: '',
    instructorType: 'main',
    status: 'active',
  });
  const [currentInstructor, setCurrentInstructor] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  const [hideInactive, setHideInactive] = useState(true);

  // Fetch instructors on component mount
  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/instructors/fetchInstructors', {
        params: { sub_organizationId: 1 } // TODO: Get from user context
      });
      setInstructors(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      expertise: '',
      instructorType: 'main',
      status: 'active',
    });
  };

  const handleEditClickOpen = (instructor) => {
    setCurrentInstructor(instructor);
    setFormData({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
      phone: instructor.phone || '',
      expertise: Array.isArray(instructor.expertise) ? instructor.expertise.join(', ') : '',
      instructorType: instructor.instructorType,
      status: instructor.status,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setCurrentInstructor(null);
    resetForm();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (formData.firstName && formData.lastName && formData.email) {
      try {
        setSubmitting(true);
        
        // Convert expertise string to array
        const expertiseArray = formData.expertise
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);

        const response = await axios.post('/api/instructors/createInstructor', {
          ...formData,
          expertise: expertiseArray,
          sub_organizationId: 1, // TODO: Get from user context
          createdBy: 'current-user' // TODO: Get from auth context
        });

        if (response.data.success) {
          // Refresh instructors list
          await fetchInstructors();
          handleClose();
        } else {
          setError(response.data.message || 'Failed to create instructor');
        }
      } catch (err) {
        console.error('Error creating instructor:', err);
        setError(err.response?.data?.message || 'Failed to create instructor');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (currentInstructor && formData.firstName && formData.lastName && formData.email) {
      try {
        setSubmitting(true);
        
        // Convert expertise string to array
        const expertiseArray = formData.expertise
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);

        const response = await axios.put('/api/instructors/updateInstructor', {
          id: currentInstructor.id,
          ...formData,
          expertise: expertiseArray,
          updatedBy: 'current-user' // TODO: Get from auth context
        });

        if (response.data.success) {
          // Refresh instructors list
          await fetchInstructors();
          handleEditClose();
        } else {
          setError(response.data.message || 'Failed to update instructor');
        }
      } catch (err) {
        console.error('Error updating instructor:', err);
        setError(err.response?.data?.message || 'Failed to update instructor');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteClick = (instructor) => {
    setInstructorToDelete(instructor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = (instructorId) => {
    setInstructors(instructors.filter(instructor => instructor.id !== instructorId));
  };

  const handleDeactivateSuccess = (instructorId) => {
    setInstructors(instructors.map(instructor =>
      instructor.id === instructorId
        ? { ...instructor, status: 'inactive' }
        : instructor
    ));
  };

  // Filter instructors based on hideInactive toggle
  const filteredInstructors = useMemo(() => {
    if (hideInactive) {
      return instructors.filter(instructor => instructor.status !== 'inactive');
    }
    return instructors;
  }, [instructors, hideInactive]);

  // Define columns for AppTable
  const columns = useMemo(() => [
    {
      title: "Row Selection",
      Header: SelectionHeader,
      accessor: "selection",
      Cell: SelectionCell,
      disableSortBy: true,
    },
    {
      Header: "ID",
      accessor: "id",
      className: "cell-center",
      disableFilters: true,
    },
    {
      Header: "Instructor",
      accessor: "fullName",
      Cell: ({ row }) => {
        const { firstName, lastName } = row.original;
        return (
          <Typography variant="subtitle2">{firstName} {lastName}</Typography>
        );
      },
    },
    {
      Header: "Email",
      accessor: "email",
      Cell: ({ value }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <MailOutlined style={{ fontSize: '14px', color: '#666' }} />
          <Typography variant="body2">{value}</Typography>
        </Stack>
      ),
    },
    {
      Header: "Expertise",
      accessor: "expertise",
      Cell: ({ value }) => {
        const skills = Array.isArray(value) ? value : [];
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Stack>
        );
      },
    },
    {
      Header: "Sub-Organization",
      accessor: "sub_organization.title",
      Cell: ({ row }) => {
        const subOrg = row.original.sub_organization;
        return subOrg ? (
          <Chip
            label={subOrg.title}
            size="small"
            variant="outlined"
            color="default"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
      },
    },
    {
      Header: "Projects",
      accessor: "projectCount",
      className: "cell-center",
      Cell: ({ value }) => (
        <Typography variant="body2">{value || 0}</Typography>
      ),
    },
    {
      Header: "Courses",
      accessor: "courseCount",
      className: "cell-center",
      Cell: ({ value }) => (
        <Typography variant="body2">{value || 0}</Typography>
      ),
    },
    {
      Header: "Type",
      accessor: "instructorType",
      className: "cell-center",
      Cell: ({ value }) => (
        <Chip 
          label={value} 
          color={value === 'main' ? 'primary' : value === 'assistant' ? 'secondary' : 'default'}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      Header: "Status",
      accessor: "status",
      className: "cell-center",
      Cell: ({ value }) => (
        <Chip 
          label={value} 
          color={value === 'active' ? 'success' : value === 'inactive' ? 'error' : 'warning'}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      Header: "Actions",
      className: "cell-center",
      disableSortBy: true,
      Cell: ({ row }) => (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClickOpen(row.original);
              }}
            >
              <EditTwoTone />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.original);
              }}
            >
              <DeleteTwoTone />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [instructors]);

  return (
    <Page title="Instructors">
      <Typography variant="body1" sx={{ mb: 3 }}>
        Manage instructors, including their details, expertise, and roles.
      </Typography>
      
      <MainCard content={false}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading instructors...</Typography>
          </Stack>
        ) : (
          <ScrollX>
            <AppTable
              columns={columns}
              data={filteredInstructors}
              handleAdd={handleClickOpen}
              addButtonText="Add Instructor"
              initialSortBy={{ id: "fullName", desc: false }}
              initialHiddenColumns={["id", "expertise", "sub_organization.title"]}
              responsiveHiddenColumns={["email", "expertise"]}
              csvFilename="instructors-list.csv"
              emptyMessage="No instructors found"
              showRowSelection={true}
              showPagination={true}
              showGlobalFilter={true}
              showCSVExport={true}
              showSorting={true}
              showColumnToggle={true}
              customActions={
                <FormControlLabel
                  control={
                    <Switch
                      checked={hideInactive}
                      onChange={(e) => setHideInactive(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Hide inactive</Typography>}
                  sx={{ mr: 1 }}
                />
              }
            />
          </ScrollX>
        )}
      </MainCard>

      {/* Add Instructor Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <MainCard
          title="Add New Instructor"
          secondary={
            <IconButton size="small" onClick={handleClose}>
              <CloseOutlined />
            </IconButton>
          }
          content={false}
          sx={{ '& .MuiCardContent-root': { p: 0 }, height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Stack spacing={2} sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              name="firstName"
              label="First Name"
              type="text"
              fullWidth
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <TextField
              name="lastName"
              label="Last Name"
              type="text"
              fullWidth
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <TextField
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              name="phone"
              label="Phone Number"
              type="tel"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              name="expertise"
              label="Expertise (comma-separated)"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.expertise}
              onChange={handleChange}
              helperText="Enter skills separated by commas (e.g., React, Node.js, TypeScript)"
            />
            <TextField
              name="instructorType"
              label="Instructor Type"
              select
              fullWidth
              value={formData.instructorType}
              onChange={handleChange}
            >
              <MenuItem value="main">Main Instructor</MenuItem>
              <MenuItem value="assistant">Assistant Instructor</MenuItem>
              <MenuItem value="secondary">Secondary Instructor</MenuItem>
            </TextField>
            <TextField
              name="status"
              label="Status"
              select
              fullWidth
              value={formData.status}
              onChange={handleChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
            </TextField>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
            >
              {submitting ? 'Adding...' : 'Add Instructor'}
            </Button>
          </Stack>
        </MainCard>
      </Dialog>

      {/* Edit Instructor Dialog */}
      <Dialog
        open={editOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <MainCard
          title="Edit Instructor"
          secondary={
            <IconButton size="small" onClick={handleEditClose}>
              <CloseOutlined />
            </IconButton>
          }
          content={false}
          sx={{ '& .MuiCardContent-root': { p: 0 }, height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Stack spacing={2} sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              name="firstName"
              label="First Name"
              type="text"
              fullWidth
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <TextField
              name="lastName"
              label="Last Name"
              type="text"
              fullWidth
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <TextField
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              name="phone"
              label="Phone Number"
              type="tel"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              name="expertise"
              label="Expertise (comma-separated)"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.expertise}
              onChange={handleChange}
              helperText="Enter skills separated by commas (e.g., React, Node.js, TypeScript)"
            />
            <TextField
              name="instructorType"
              label="Instructor Type"
              select
              fullWidth
              value={formData.instructorType}
              onChange={handleChange}
            >
              <MenuItem value="main">Main Instructor</MenuItem>
              <MenuItem value="assistant">Assistant Instructor</MenuItem>
              <MenuItem value="secondary">Secondary Instructor</MenuItem>
            </TextField>
            <TextField
              name="status"
              label="Status"
              select
              fullWidth
              value={formData.status}
              onChange={handleChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
            </TextField>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Button onClick={handleEditClose} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
            >
              {submitting ? 'Updating...' : 'Update Instructor'}
            </Button>
          </Stack>
        </MainCard>
      </Dialog>

      {/* Delete Instructor Dialog */}
      <InstructorDeleteAlert
        instructor={instructorToDelete}
        open={deleteDialogOpen}
        handleClose={() => {
          setDeleteDialogOpen(false);
          setInstructorToDelete(null);
        }}
        onDeleteSuccess={handleDeleteSuccess}
        onDeactivateSuccess={handleDeactivateSuccess}
      />
    </Page>
  );
};

Instructors.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Instructors;