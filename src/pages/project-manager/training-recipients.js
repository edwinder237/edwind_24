import { 
  Typography, 
  Button, 
  Stack, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Box
} from '@mui/material';
import { 
  UserOutlined, 
  EditTwoTone, 
  DeleteTwoTone, 
  MailOutlined, 
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  BankOutlined
} from '@ant-design/icons';
import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'store';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import AppTable, { SelectionCell, SelectionHeader } from 'components/AppTable';
import {
  getTrainingRecipients,
  createTrainingRecipient,
  updateTrainingRecipient,
  deleteTrainingRecipient,
  clearError,
  clearSuccess
} from 'store/reducers/trainingRecipients';
import { openSnackbar } from 'store/reducers/snackbar';

// ==============================|| PROJECT MANAGER TRAINING RECIPIENTS ||============================== //

const TrainingRecipients = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    taxId: '',
    notes: '',
  });
  const [currentRecipient, setCurrentRecipient] = useState(null);

  // Redux state
  const {
    trainingRecipients,
    loading,
    submitting,
    error,
    success,
    response
  } = useSelector((state) => state.trainingRecipients);

  // Load data on component mount
  useEffect(() => {
    dispatch(getTrainingRecipients());
  }, [dispatch]);

  // Handle success/error notifications
  useEffect(() => {
    if (success && response) {
      dispatch(openSnackbar({
        open: true,
        message: response.message || 'Operation completed successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false,
      }));
      dispatch(clearSuccess());
    }
  }, [success, response, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(openSnackbar({
        open: true,
        message: error,
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (submitting) return; // Prevent closing during submission
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
      taxId: '',
      notes: '',
    });
  };

  const handleEditClickOpen = (recipient) => {
    setCurrentRecipient(recipient);
    setFormData(recipient);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    if (submitting) return; // Prevent closing during submission
    setEditOpen(false);
    setCurrentRecipient(null);
    setFormData({
      name: '',
      description: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
      taxId: '',
      notes: '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactPerson) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in required fields: Organization Name and Contact Person',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    try {
      await dispatch(createTrainingRecipient(formData));
      handleClose();
    } catch (error) {
      // Error is handled by Redux and useEffect
      console.error('Error creating training recipient:', error);
    }
  };

  const handleUpdate = async () => {
    if (!currentRecipient || !formData.name || !formData.contactPerson) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in required fields: Organization Name and Contact Person',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    try {
      await dispatch(updateTrainingRecipient({
        id: currentRecipient.id,
        ...formData
      }));
      handleEditClose();
    } catch (error) {
      // Error is handled by Redux and useEffect
      console.error('Error updating training recipient:', error);
    }
  };

  const handleDelete = async (recipientId) => {
    if (!window.confirm('Are you sure you want to delete this training recipient? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(deleteTrainingRecipient(recipientId));
    } catch (error) {
      // Error is handled by Redux and useEffect
      console.error('Error deleting training recipient:', error);
    }
  };

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
      Header: "Organization",
      accessor: "name",
      Cell: ({ row }) => {
        const { name, industry, contactPerson } = row.original;
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <BankOutlined />
            </Avatar>
            <Stack spacing={0}>
              <Typography variant="subtitle2" fontWeight={600}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {contactPerson} • {industry}
              </Typography>
            </Stack>
          </Stack>
        );
      },
    },
    {
      Header: "Contact Info",
      accessor: "email",
      Cell: ({ row }) => {
        const { email, phone } = row.original;
        return (
          <Stack spacing={0.5}>
            {email && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <MailOutlined style={{ fontSize: '14px', color: '#666' }} />
                <Typography variant="body2">{email}</Typography>
              </Stack>
            )}
            {phone && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PhoneOutlined style={{ fontSize: '14px', color: '#666' }} />
                <Typography variant="body2">{phone}</Typography>
              </Stack>
            )}
          </Stack>
        );
      },
    },
    {
      Header: "Industry",
      accessor: "industry",
      Cell: ({ value }) => (
        <Chip 
          label={value || 'N/A'} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      Header: "Website",
      accessor: "website",
      Cell: ({ value }) => value ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <GlobalOutlined style={{ fontSize: '14px', color: '#666' }} />
          <Typography 
            variant="body2" 
            component="a" 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Visit Site
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.disabled">-</Typography>
      ),
    },
    {
      Header: "Address",
      accessor: "address",
      Cell: ({ value }) => value ? (
        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
          <HomeOutlined style={{ fontSize: '14px', color: '#666', marginTop: '2px' }} />
          <Typography variant="body2" sx={{ maxWidth: 200 }}>
            {value}
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.disabled">-</Typography>
      ),
    },
    {
      Header: "Tax ID",
      accessor: "taxId",
      className: "cell-center",
      Cell: ({ value }) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
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
                handleDelete(row.original.id);
              }}
            >
              <DeleteTwoTone />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], []);

  return (
    <Page title="Training Recipients">
      <Typography variant="body1" sx={{ mb: 3 }}>
        Manage training recipient organizations and their contact information.
      </Typography>
      
      <MainCard content={false}>
        <ScrollX>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Typography>Loading training recipients...</Typography>
            </Box>
          ) : (
            <AppTable
              columns={columns}
              data={trainingRecipients}
              handleAdd={handleClickOpen}
              addButtonText="Add Training Recipient"
              addButtonVariant="emphasized"
              addButtonDescription="Register a new organization as a training recipient to enroll their participants in projects"
              showFloatingActionButton={true}
              initialSortBy={{ id: "name", desc: false }}
              initialHiddenColumns={["id"]}
              responsiveHiddenColumns={["address", "taxId", "website"]}
              csvFilename="training-recipients-list.csv"
              emptyMessage="No training recipients found"
              showRowSelection={true}
              showPagination={true}
              showGlobalFilter={true}
              showCSVExport={true}
              showSorting={true}
            />
          )}
        </ScrollX>
      </MainCard>

      {/* Add Training Recipient Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Training Recipient</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Stack spacing={3}>
              <TextField
                name="name"
                label="Organization Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
              />
              <TextField
                name="contactPerson"
                label="Contact Person"
                fullWidth
                required
                value={formData.contactPerson}
                onChange={handleChange}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Stack>
              <TextField
                name="industry"
                label="Industry"
                fullWidth
                value={formData.industry}
                onChange={handleChange}
              />
              <TextField
                name="address"
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  name="website"
                  label="Website"
                  fullWidth
                  value={formData.website}
                  onChange={handleChange}
                />
                <TextField
                  name="taxId"
                  label="Tax ID"
                  fullWidth
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </Stack>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
              />
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Training Recipient Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Training Recipient</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Stack spacing={3}>
              <TextField
                name="name"
                label="Organization Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
              />
              <TextField
                name="contactPerson"
                label="Contact Person"
                fullWidth
                required
                value={formData.contactPerson}
                onChange={handleChange}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Stack>
              <TextField
                name="industry"
                label="Industry"
                fullWidth
                value={formData.industry}
                onChange={handleChange}
              />
              <TextField
                name="address"
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  name="website"
                  label="Website"
                  fullWidth
                  value={formData.website}
                  onChange={handleChange}
                />
                <TextField
                  name="taxId"
                  label="Tax ID"
                  fullWidth
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </Stack>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
              />
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={submitting}>Cancel</Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
};

TrainingRecipients.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TrainingRecipients;