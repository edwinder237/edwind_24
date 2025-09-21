import { 
  Typography, 
  Button, 
  Stack, 
  Dialog, 
  TextField, 
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Badge,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

// constants
import { PARTICIPANT_ROLE_CHOICES } from 'constants';
import { 
  UserOutlined, 
  EditTwoTone, 
  DeleteTwoTone, 
  MailOutlined, 
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined,
  ProjectOutlined,
  DownOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  EyeOutlined
} from '@ant-design/icons';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'store';
import { useRouter } from 'next/router';
import axios from 'utils/axios';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import AppTable, { SelectionCell, SelectionHeader } from 'components/AppTable';
import LocationAutocomplete from 'components/LocationAutocomplete';
import {
  getTrainingRecipients,
  updateTrainingRecipient,
  deleteTrainingRecipient,
  clearError,
  clearSuccess
} from 'store/reducers/trainingRecipients';
import { openSnackbar } from 'store/reducers/snackbar';
import { getProjects } from 'store/reducers/projects';

// ==============================|| PROJECT MANAGER TRAINING RECIPIENTS ||============================== //

const TrainingRecipients = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectParticipants, setProjectParticipants] = useState({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [participantFormData, setParticipantFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Participant',
    trainingRecipientId: ''
  });
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
    location: null,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentRecipient, setCurrentRecipient] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [editParticipantOpen, setEditParticipantOpen] = useState(false);

  // Redux state
  const {
    trainingRecipients,
    loading,
    submitting,
    error,
    success,
    response
  } = useSelector((state) => state.trainingRecipients);
  
  const { projects } = useSelector((state) => state.projects);

  // Load data on component mount
  useEffect(() => {
    dispatch(getTrainingRecipients());
    dispatch(getProjects());
  }, [dispatch]);

  // Fetch participants for a specific project
  const fetchProjectParticipants = async (projectId) => {
    if (projectParticipants[projectId]) return;
    
    setLoadingParticipants(true);
    try {
      const response = await axios.post('/api/projects/fetchParticipants', {
        projectId: projectId
      });
      setProjectParticipants(prev => ({
        ...prev,
        [projectId]: response.data || []
      }));
    } catch (error) {
      console.error('Error fetching participants:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch participants',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Handle project expansion
  const handleProjectExpand = useCallback(async (projectId) => {
    const isExpanded = expandedProjects[projectId];
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !isExpanded
    }));
    
    if (!isExpanded && !projectParticipants[projectId]) {
      await fetchProjectParticipants(projectId);
    }
  }, [expandedProjects, projectParticipants]);

  // Open participant dialog for a specific project
  const handleAddParticipantToProject = (project) => {
    setSelectedProject(project);
    setParticipantFormData(prev => ({ ...prev, trainingRecipientId: '' }));
    setParticipantDialogOpen(true);
    fetchProjectParticipants(project.id);
  };

  // Handle adding participant to project
  const handleAddParticipant = async () => {
    if (!participantFormData.firstName || !participantFormData.lastName || !participantFormData.email) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    try {
      const response = await axios.post('/api/projects/addParticipant', {
        projectId: selectedProject.id,
        participantData: {
          ...participantFormData,
          name: `${participantFormData.firstName} ${participantFormData.lastName}`,
        }
      });

      if (response.data.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Participant added successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
        }));
        setProjectParticipants(prev => {
          const updated = { ...prev };
          delete updated[selectedProject.id];
          return updated;
        });
        await fetchProjectParticipants(selectedProject.id);
        handleCloseParticipantDialog();
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add participant',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  };

  // Handle updating participant
  const handleUpdateParticipant = async () => {
    if (!currentParticipant) return;

    try {
      const response = await axios.post('/api/projects/updateParticipant', {
        participantId: currentParticipant.participant.id,
        updates: participantFormData
      });

      if (response.data.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Participant updated successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
        }));
        setProjectParticipants(prev => {
          const updated = { ...prev };
          delete updated[selectedProject.id];
          return updated;
        });
        await fetchProjectParticipants(selectedProject.id);
        handleCloseEditParticipant();
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update participant',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  };

  // Handle removing participant from project
  const handleRemoveParticipant = async (participantId, projectId) => {
    if (!window.confirm('Are you sure you want to remove this participant from the project?')) {
      return;
    }

    try {
      const response = await axios.post('/api/projects/removeParticipant', {
        participantId,
        projectId
      });

      if (response.data.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Participant removed successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
        }));
        setProjectParticipants(prev => {
          const updated = { ...prev };
          delete updated[projectId];
          return updated;
        });
        await fetchProjectParticipants(projectId);
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to remove participant',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  };

  const handleCloseParticipantDialog = () => {
    setParticipantDialogOpen(false);
    setSelectedProject(null);
    setParticipantFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Participant',
      trainingRecipientId: ''
    });
  };

  const handleEditParticipant = (participant, project) => {
    setCurrentParticipant(participant);
    setSelectedProject(project);
    setParticipantFormData({
      firstName: participant.participant?.firstName || '',
      lastName: participant.participant?.lastName || '',
      email: participant.participant?.email || '',
      phone: participant.participant?.phone || '',
      role: participant.participant?.role?.name || 'Participant',
      trainingRecipientId: participant.participant?.trainingRecipientId || ''
    });
    setEditParticipantOpen(true);
  };

  const handleCloseEditParticipant = () => {
    setEditParticipantOpen(false);
    setCurrentParticipant(null);
    setParticipantFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Participant',
      trainingRecipientId: ''
    });
  };

  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
  }, []);

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


  const handleEditClickOpen = (recipient) => {
    setCurrentRecipient(recipient);
    setFormData({...recipient, location: recipient.location || null});
    // Initialize location if exists
    if (recipient.location) {
      setSelectedLocation({
        description: recipient.address || '',
        place_id: recipient.location.place_id || null
      });
    } else {
      setSelectedLocation(null);
    }
    setEditOpen(true);
  };

  const handleEditClose = () => {
    if (submitting) return; // Prevent closing during submission
    setEditOpen(false);
    setCurrentRecipient(null);
    setSelectedLocation(null);
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
      location: null,
    });
  };

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      address: locationData?.formatted_address || '',
      location: locationData || null
    }));
  };


  const handleUpdate = async () => {
    if (!currentRecipient || !formData.name) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in required field: Organization Name',
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

  // Get projects linked to each training recipient
  const getProjectsForRecipient = useCallback((recipientId) => {
    if (!projects) return [];
    return projects.filter(project => 
      project.trainingRecipientId === recipientId || 
      project.training_recipient_id === recipientId
    );
  }, [projects]);

  // Get participant count for a project
  const getParticipantCount = useCallback((projectId) => {
    return projectParticipants[projectId]?.length || 0;
  }, [projectParticipants]);

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
        const linkedProjects = getProjectsForRecipient(row.original.id);
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Badge badgeContent={linkedProjects.length} color="primary">
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <BankOutlined />
              </Avatar>
            </Badge>
            <Stack spacing={0}>
              <Typography variant="subtitle2" fontWeight={600}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {contactPerson} • {industry}
              </Typography>
              <Typography variant="caption" color="primary">
                {linkedProjects.length} training project{linkedProjects.length !== 1 ? 's' : ''}
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
      Header: "Projects & Participants",
      accessor: "projects",
      Cell: ({ row }) => {
        const linkedProjects = getProjectsForRecipient(row.original.id);
        const totalParticipants = useMemo(() => 
          linkedProjects.reduce((sum, project) => 
            sum + getParticipantCount(project.id), 0
          ), [linkedProjects, getParticipantCount]
        );
        return (
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ProjectOutlined style={{ fontSize: '14px', color: '#666' }} />
              <Typography variant="body2">
                {linkedProjects.length} Project{linkedProjects.length !== 1 ? 's' : ''}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TeamOutlined style={{ fontSize: '14px', color: '#666' }} />
              <Typography variant="body2">
                {totalParticipants} Total Participant{totalParticipants !== 1 ? 's' : ''}
              </Typography>
            </Stack>
          </Stack>
        );
      },
    },
    {
      Header: "Actions",
      className: "cell-center",
      disableSortBy: true,
      Cell: ({ row }) => (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/project-manager/training-recipients/${row.original.id}`);
              }}
            >
              <EyeOutlined />
            </IconButton>
          </Tooltip>
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
  ], [projects, projectParticipants, getProjectsForRecipient, getParticipantCount, router]);

  return (
    <Page title="Training Recipients & Participants">
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">
          Training Recipients & Participants Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage training recipient organizations, view their linked projects, and manage participant enrollments.
        </Typography>
      </Stack>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="training management tabs">
          <Tab 
            icon={<BankOutlined />} 
            label="Organizations" 
            iconPosition="start"
          />
          <Tab 
            icon={<TeamOutlined />} 
            label="Projects & Participants" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Organizations Tab */}
      {tabValue === 0 && (
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
                initialSortBy={{ id: "name", desc: false }}
                initialHiddenColumns={["id"]}
                responsiveHiddenColumns={["industry"]}
                csvFilename="training-recipients-list.csv"
                emptyMessage="No training recipients found"
                showRowSelection={true}
                showPagination={true}
                showGlobalFilter={true}
                showCSVExport={true}
                showSorting={true}
                onRowClick={(row) => router.push(`/project-manager/training-recipients/${row.original.id}`)}
              />
            )}
          </ScrollX>
        </MainCard>
      )}

      {/* Projects & Participants Tab */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={3}>
            {projects?.length > 0 ? (
              projects.map((project) => {
                const isExpanded = expandedProjects[project.id];
                const participants = projectParticipants[project.id] || [];
                return (
                  <Grid item xs={12} key={project.id}>
                    <Accordion 
                      expanded={isExpanded} 
                      onChange={() => handleProjectExpand(project.id)}
                      sx={{ 
                        boxShadow: 2,
                        '&:before': { display: 'none' },
                        borderRadius: 1
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<DownOutlined />}
                        sx={{ 
                          backgroundColor: 'action.hover',
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" width="100%">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <ProjectOutlined />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">{project.title}</Typography>
                            <Stack direction="row" spacing={2}>
                              <Typography variant="caption" color="text.secondary">
                                Status: <Chip label={project.status || 'Active'} size="small" color="primary" variant="outlined" />
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 2 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PlusOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddParticipantToProject(project);
                              }}
                            >
                              Add Participant
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EyeOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${project.id}`);
                              }}
                            >
                              View Project
                            </Button>
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Divider sx={{ mb: 2 }} />
                        {loadingParticipants && !participants?.length ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <Typography>Loading participants...</Typography>
                          </Box>
                        ) : participants?.length > 0 ? (
                          <List>
                            {participants?.map((participant) => (
                              <ListItem key={participant.id} divider>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    <UserOutlined />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="subtitle1">
                                      {participant.participant?.firstName} {participant.participant?.lastName}
                                    </Typography>
                                  }
                                  secondary={
                                    <Stack direction="row" spacing={2}>
                                      {participant.participant?.email && (
                                        <Typography variant="caption" color="text.secondary">
                                          <MailOutlined style={{ fontSize: 12, marginRight: 4 }} />
                                          {participant.participant.email}
                                        </Typography>
                                      )}
                                      {participant.participant?.phone && (
                                        <Typography variant="caption" color="text.secondary">
                                          <PhoneOutlined style={{ fontSize: 12, marginRight: 4 }} />
                                          {participant.participant.phone}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary">
                                        Role: {participant.participant?.role?.name || 'Participant'}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Stack direction="row" spacing={1}>
                                    <Tooltip title="Edit Participant">
                                      <IconButton 
                                        edge="end" 
                                        size="small"
                                        onClick={() => handleEditParticipant(participant, project)}
                                      >
                                        <EditTwoTone />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove from Project">
                                      <IconButton 
                                        edge="end" 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleRemoveParticipant(participant.participant.id, project.id)}
                                      >
                                        <DeleteTwoTone />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                            <UsergroupAddOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                              No participants enrolled yet
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<PlusOutlined />}
                              onClick={() => handleAddParticipantToProject(project)}
                              sx={{ mt: 2 }}
                            >
                              Add First Participant
                            </Button>
                          </Paper>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <ProjectOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
                  <Typography variant="h6" gutterBottom>
                    No Training Projects Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create training projects to start enrolling participants
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => router.push('/project-manager/projects/overview')}
                  >
                    Go to Projects
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}


      {/* Edit Training Recipient Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={handleEditClose} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <MainCard 
            title="Edit Training Recipient"
            sx={{ 
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              '& .MuiCardContent-root': {
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                paddingBottom: 0
              }
            }}
          >
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
              <LocationAutocomplete
                value={selectedLocation}
                onChange={setSelectedLocation}
                onLocationChange={handleLocationChange}
                label="Address"
                placeholder="Search for your company address"
                fullWidth
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
          </MainCard>
          <Box 
            sx={{ 
              p: 3, 
              borderTop: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleEditClose} disabled={submitting}>Cancel</Button>
              <Button 
                onClick={handleUpdate} 
                variant="contained" 
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog 
        open={participantDialogOpen} 
        onClose={handleCloseParticipantDialog} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <MainCard 
            title={`Add Participant to ${selectedProject?.title}`}
            sx={{ 
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              '& .MuiCardContent-root': {
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                paddingBottom: 0
              }
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  required
                  value={participantFormData.firstName}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  required
                  value={participantFormData.lastName}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={participantFormData.email}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={participantFormData.phone}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={participantFormData.role}
                    label="Role"
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    {PARTICIPANT_ROLE_CHOICES.map((choice) => (
                      <MenuItem key={choice.value} value={choice.value}>
                        {choice.text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Training Recipient</InputLabel>
                  <Select
                    value={participantFormData.trainingRecipientId}
                    label="Training Recipient"
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, trainingRecipientId: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {trainingRecipients.map((recipient) => (
                      <MenuItem key={recipient.id} value={recipient.id}>
                        {recipient.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </MainCard>
          <Box 
            sx={{ 
              p: 3, 
              borderTop: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleCloseParticipantDialog}>Cancel</Button>
              <Button 
                onClick={handleAddParticipant} 
                variant="contained"
              >
                Add Participant
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>

      {/* Edit Participant Dialog */}
      <Dialog 
        open={editParticipantOpen} 
        onClose={handleCloseEditParticipant} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <MainCard 
            title={`Edit Participant - ${selectedProject?.title}`}
            sx={{ 
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              '& .MuiCardContent-root': {
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                paddingBottom: 0
              }
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  required
                  value={participantFormData.firstName}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  required
                  value={participantFormData.lastName}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={participantFormData.email}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={participantFormData.phone}
                  onChange={(e) => setParticipantFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={participantFormData.role}
                    label="Role"
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    {PARTICIPANT_ROLE_CHOICES.map((choice) => (
                      <MenuItem key={choice.value} value={choice.value}>
                        {choice.text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Training Recipient</InputLabel>
                  <Select
                    value={participantFormData.trainingRecipientId}
                    label="Training Recipient"
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, trainingRecipientId: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {trainingRecipients.map((recipient) => (
                      <MenuItem key={recipient.id} value={recipient.id}>
                        {recipient.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </MainCard>
          <Box 
            sx={{ 
              p: 3, 
              borderTop: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleCloseEditParticipant}>Cancel</Button>
              <Button 
                onClick={handleUpdateParticipant} 
                variant="contained"
              >
                Update Participant
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>
    </Page>
  );
};

TrainingRecipients.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TrainingRecipients;