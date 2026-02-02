import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  IconButton,
  Alert,
  Divider,
  Paper,
  Avatar,
  Collapse
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  FlagOutlined,
  DownOutlined,
  UpOutlined,
  WarningOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { format, parseISO, isPast, isToday, differenceInDays } from 'date-fns';
import { projectionTypes } from 'data/mockData';

// Icon mapping
const iconMap = {
  RocketOutlined: RocketOutlined,
  TeamOutlined: TeamOutlined,
  ThunderboltOutlined: ThunderboltOutlined,
  FileSearchOutlined: FileSearchOutlined,
  PlayCircleOutlined: PlayCircleOutlined,
  SafetyCertificateOutlined: SafetyCertificateOutlined,
  FlagOutlined: FlagOutlined
};

// ==============================|| PROJECT DETAILS DIALOG ||============================== //

const ProjectDetailsDialog = ({ 
  open, 
  project, 
  instructors, 
  getAvailableInstructors,
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    status: '',
    instructorId: '',
    instructor2Id: '',
    recipient: '',
    location: '',
    projections: []
  });
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [errors, setErrors] = useState({});
  const [showProjections, setShowProjections] = useState(true);

  // Projection form state
  const [newProjection, setNewProjection] = useState({
    type: 'production',
    date: null,
    endDate: null,
    label: '',
    notes: ''
  });
  const [editingProjectionId, setEditingProjectionId] = useState(null);

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate ? parseISO(project.startDate) : null,
        endDate: project.endDate ? parseISO(project.endDate) : null,
        status: project.status || 'upcoming',
        instructorId: project.instructorId || '',
        instructor2Id: project.instructor2Id || '',
        recipient: project.recipient || '',
        location: project.location || '',
        projections: project.projections || []
      });
      setNewProjection({
        type: 'production',
        date: null,
        endDate: null,
        label: '',
        notes: ''
      });
      setEditingProjectionId(null);
    }
  }, [project]);

  // Update available instructors when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate && getAvailableInstructors) {
      const available = getAvailableInstructors(
        formData.startDate,
        formData.endDate,
        project?.id
      );
      setAvailableInstructors(available);
    } else {
      setAvailableInstructors(instructors);
    }
  }, [formData.startDate, formData.endDate, instructors, getAvailableInstructors, project]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updatedProject = {
        ...project,
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        projections: formData.projections
      };
      onUpdate(updatedProject);
      setEditMode(false);
    }
  };

  // Projection handlers
  const handleAddProjection = () => {
    if (newProjection.date && newProjection.label.trim()) {
      if (editingProjectionId) {
        // Update existing projection
        setFormData(prev => ({
          ...prev,
          projections: prev.projections.map(p =>
            p.id === editingProjectionId
              ? {
                  ...p,
                  type: newProjection.type,
                  date: newProjection.date.toISOString(),
                  endDate: newProjection.endDate ? newProjection.endDate.toISOString() : null,
                  label: newProjection.label.trim(),
                  notes: newProjection.notes.trim()
                }
              : p
          )
        }));
        setEditingProjectionId(null);
      } else {
        // Add new projection
        const projection = {
          id: `p${Date.now()}`,
          type: newProjection.type,
          date: newProjection.date.toISOString(),
          endDate: newProjection.endDate ? newProjection.endDate.toISOString() : null,
          label: newProjection.label.trim(),
          notes: newProjection.notes.trim()
        };
        setFormData(prev => ({
          ...prev,
          projections: [...prev.projections, projection]
        }));
      }
      setNewProjection({
        type: 'production',
        endDate: null,
        date: null,
        label: '',
        notes: ''
      });
    }
  };

  const handleRemoveProjection = (projectionId) => {
    setFormData(prev => ({
      ...prev,
      projections: prev.projections.filter(p => p.id !== projectionId)
    }));
    // Clear editing state if we're deleting the projection being edited
    if (editingProjectionId === projectionId) {
      setEditingProjectionId(null);
      setNewProjection({
        type: 'production',
        date: null,
        endDate: null,
        label: '',
        notes: ''
      });
    }
  };

  const handleEditProjection = (projection) => {
    setEditingProjectionId(projection.id);
    setNewProjection({
      type: projection.type,
      date: parseISO(projection.date),
      endDate: projection.endDate ? parseISO(projection.endDate) : null,
      label: projection.label,
      notes: projection.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingProjectionId(null);
    setNewProjection({
      type: 'production',
      date: null,
      endDate: null,
      label: '',
      notes: ''
    });
  };

  const handleProjectionTypeChange = (type) => {
    const typeInfo = projectionTypes.find(pt => pt.id === type);
    setNewProjection(prev => ({
      ...prev,
      type,
      label: prev.label || typeInfo?.label || ''
    }));
  };

  // Get icon component for projection type
  const getProjectionIcon = (iconName) => {
    return iconMap[iconName] || FlagOutlined;
  };

  // Get projection status
  const getProjectionStatus = (dateStr) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const daysUntil = differenceInDays(date, today);

    if (isPast(date) && !isToday(date)) {
      return { status: 'overdue', label: 'Overdue', color: 'error' };
    } else if (isToday(date)) {
      return { status: 'today', label: 'Today', color: 'warning' };
    } else if (daysUntil <= 7) {
      return { status: 'upcoming', label: `${daysUntil}d`, color: 'warning' };
    } else {
      return { status: 'future', label: `${daysUntil}d`, color: 'default' };
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete(project.id);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      upcoming: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'error',
      onhold: 'default'
    };
    return statusColors[status] || 'default';
  };

  if (!project) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {editMode ? 'Edit Project' : 'Project Details'}
          </Typography>
          <Stack direction="row" spacing={1}>
            {!editMode && (
              <IconButton onClick={() => setEditMode(true)} size="small">
                <EditOutlined />
              </IconButton>
            )}
            <IconButton onClick={handleDelete} size="small" color="error">
              <DeleteOutlined />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseOutlined />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Project Name and Status */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              ) : (
                <Typography variant="h6">{project.name}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="onhold">On Hold</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Chip 
                  label={project.status} 
                  color={getStatusColor(project.status)}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>

          {/* Description */}
          <Box>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">
                  {project.description || 'No description provided'}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Dates */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Start Date
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.startDate ? format(parseISO(project.startDate), 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      End Date
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.endDate ? format(parseISO(project.endDate), 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Instructors and Location */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Primary Instructor</InputLabel>
                  <Select
                    value={formData.instructorId}
                    onChange={(e) => handleInputChange('instructorId', e.target.value)}
                    label="Primary Instructor"
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {availableInstructors.map((instructor) => (
                      <MenuItem key={instructor.id} value={instructor.id} disabled={instructor.id === formData.instructor2Id}>
                        {instructor.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {availableInstructors.length === 0 && formData.instructorId === '' && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      No instructors available for selected dates
                    </Alert>
                  )}
                </FormControl>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UserOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Primary Instructor
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {instructors.find(i => i.id === project.instructorId)?.name || 'Unassigned'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Second Instructor (Optional)</InputLabel>
                  <Select
                    value={formData.instructor2Id}
                    onChange={(e) => handleInputChange('instructor2Id', e.target.value)}
                    label="Second Instructor (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {availableInstructors.map((instructor) => (
                      <MenuItem key={instructor.id} value={instructor.id} disabled={instructor.id === formData.instructorId}>
                        {instructor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UserOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Second Instructor
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {instructors.find(i => i.id === project.instructor2Id)?.name || 'None'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Training Recipient"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange('recipient', e.target.value)}
                  placeholder="e.g., Company or client name"
                />
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UsergroupAddOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Training Recipient
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.recipient || 'Not specified'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EnvironmentOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Location
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.location || 'Not specified'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>


          {/* Participants */}
          {project.participants && project.participants.length > 0 && !editMode && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Participants ({project.participants.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  {project.participants.map((participant, idx) => (
                    <Chip key={idx} label={participant} size="small" />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && !editMode && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {project.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Projections & Milestones */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 1
              }}
              onClick={() => setShowProjections(!showProjections)}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FlagOutlined style={{ fontSize: 16, color: '#1976d2' }} />
                <Typography variant="subtitle2" color="textSecondary">
                  Projections & Milestones ({formData.projections?.length || 0})
                </Typography>
              </Stack>
              <IconButton size="small">
                {showProjections ? <UpOutlined /> : <DownOutlined />}
              </IconButton>
            </Box>

            <Collapse in={showProjections}>
              <Stack spacing={2}>
                {/* Add New Projection Form (only in edit mode) */}
                {editMode && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: editingProjectionId ? 'primary.lighter' : 'grey.50', borderRadius: 1, border: editingProjectionId ? '1px solid' : 'none', borderColor: 'primary.main' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                      {editingProjectionId ? 'Edit Milestone' : 'Add New Milestone'}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={2.5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={newProjection.type}
                            onChange={(e) => handleProjectionTypeChange(e.target.value)}
                            label="Type"
                          >
                            {projectionTypes.filter(type => !type.system).map((type) => {
                              const IconComp = getProjectionIcon(type.icon);
                              return (
                                <MenuItem key={type.id} value={type.id}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <IconComp style={{ color: type.color, fontSize: 14 }} />
                                    <span style={{ fontSize: '0.85rem' }}>{type.label}</span>
                                  </Stack>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Start"
                            value={newProjection.date}
                            onChange={(date) => setNewProjection(prev => ({ ...prev, date }))}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small'
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="End (opt)"
                            value={newProjection.endDate}
                            onChange={(date) => setNewProjection(prev => ({ ...prev, endDate: date }))}
                            minDate={newProjection.date}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small'
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} md={3.5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label"
                          value={newProjection.label}
                          onChange={(e) => setNewProjection(prev => ({ ...prev, label: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            onClick={handleAddProjection}
                            disabled={!newProjection.date || !newProjection.label.trim()}
                            startIcon={editingProjectionId ? <SaveOutlined /> : <PlusOutlined />}
                            sx={{ height: '40px' }}
                          >
                            {editingProjectionId ? 'Save' : 'Add'}
                          </Button>
                          {editingProjectionId && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={handleCancelEdit}
                              sx={{ height: '40px', minWidth: 'auto', px: 1 }}
                            >
                              <CloseOutlined />
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Projections List */}
                {formData.projections && formData.projections.length > 0 ? (
                  <Stack spacing={1}>
                    {formData.projections
                      .slice()
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((projection) => {
                        const typeInfo = projectionTypes.find(pt => pt.id === projection.type);
                        const IconComp = getProjectionIcon(typeInfo?.icon);
                        const statusInfo = project.status !== 'completed' ? getProjectionStatus(projection.date) : null;

                        return (
                          <Paper
                            key={projection.id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              border: 1,
                              borderColor: statusInfo?.status === 'overdue' ? 'error.main' : 'divider',
                              borderRadius: 1,
                              bgcolor: statusInfo?.status === 'overdue' ? 'error.lighter' : 'background.paper'
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: statusInfo?.status === 'overdue' ? '#ff6b6b' : (typeInfo?.color || '#95a5a6')
                                  }}
                                >
                                  <IconComp style={{ fontSize: 14, color: 'white' }} />
                                </Avatar>
                                <Box>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight={500}>
                                      {projection.label}
                                    </Typography>
                                    {statusInfo && (
                                      <Chip
                                        size="small"
                                        label={statusInfo.label}
                                        color={statusInfo.color}
                                        icon={statusInfo.status === 'overdue' ? <WarningOutlined /> : undefined}
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Stack>
                                  <Typography variant="caption" color="textSecondary">
                                    {format(parseISO(projection.date), 'MMM dd, yyyy')}
                                    {projection.endDate && ` - ${format(parseISO(projection.endDate), 'MMM dd, yyyy')}`}
                                    {projection.notes && ` • ${projection.notes}`}
                                  </Typography>
                                </Box>
                              </Stack>
                              {editMode && (
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditProjection(projection)}
                                    color={editingProjectionId === projection.id ? 'primary' : 'default'}
                                    sx={{
                                      bgcolor: editingProjectionId === projection.id ? 'primary.lighter' : 'transparent'
                                    }}
                                  >
                                    <EditOutlined />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveProjection(projection.id)}
                                    color="error"
                                  >
                                    <DeleteOutlined />
                                  </IconButton>
                                </Stack>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      No milestones defined
                    </Typography>
                    {editMode && (
                      <Typography variant="caption" color="textSecondary">
                        Add milestones using the form above
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Collapse>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSave}
              startIcon={<SaveOutlined />}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

ProjectDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  project: PropTypes.object,
  instructors: PropTypes.array,
  getAvailableInstructors: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default ProjectDetailsDialog;