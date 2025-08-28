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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  FormHelperText
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  CloseOutlined, 
  PlusOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

// ==============================|| CREATE PROJECT DIALOG ||============================== //

const steps = ['Basic Information', 'Schedule & Instructor', 'Additional Details'];

const CreateProjectDialog = ({ 
  open, 
  instructors, 
  getAvailableInstructors,
  onClose, 
  onCreate 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    status: 'upcoming',
    instructorId: '',
    location: '',
    tags: [],
    participants: []
  });
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [participantInput, setParticipantInput] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFormData({
        name: '',
        description: '',
        startDate: null,
        endDate: null,
        status: 'upcoming',
        instructorId: '',
        location: '',
        tags: [],
        participants: []
      });
      setErrors({});
      setTagInput('');
      setParticipantInput('');
    }
  }, [open]);

  // Update available instructors when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate && getAvailableInstructors) {
      const available = getAvailableInstructors(formData.startDate, formData.endDate);
      setAvailableInstructors(available);
    } else {
      setAvailableInstructors(instructors);
    }
  }, [formData.startDate, formData.endDate, instructors, getAvailableInstructors]);

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

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          newErrors.name = 'Project name is required';
        }
        break;
        
      case 1: // Schedule & Instructor
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
          newErrors.endDate = 'End date must be after start date';
        }
        break;
        
      case 2: // Additional Details
        // No required fields in this step
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddParticipant = () => {
    if (participantInput.trim() && !formData.participants.includes(participantInput.trim())) {
      handleInputChange('participants', [...formData.participants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const handleRemoveParticipant = (participantToRemove) => {
    handleInputChange('participants', formData.participants.filter(p => p !== participantToRemove));
  };

  const handleCreate = () => {
    if (validateStep(activeStep)) {
      const newProject = {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        progress: 0
      };
      onCreate(newProject);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description..."
            />
            <FormControl fullWidth>
              <InputLabel>Initial Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Initial Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
              </Select>
              <FormHelperText>Projects typically start as "Upcoming"</FormHelperText>
            </FormControl>
          </Stack>
        );
        
      case 1:
        return (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
            
            <FormControl fullWidth>
              <InputLabel>Assign Instructor</InputLabel>
              <Select
                value={formData.instructorId}
                onChange={(e) => handleInputChange('instructorId', e.target.value)}
                label="Assign Instructor"
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {availableInstructors.map((instructor) => (
                  <MenuItem key={instructor.id} value={instructor.id}>
                    {instructor.name} - {instructor.specialization}
                  </MenuItem>
                ))}
              </Select>
              {formData.startDate && formData.endDate && (
                <FormHelperText>
                  {availableInstructors.length > 0 
                    ? `${availableInstructors.length} instructor(s) available for selected dates`
                    : 'No instructors available for selected dates'}
                </FormHelperText>
              )}
            </FormControl>
            
            {availableInstructors.length === 0 && formData.startDate && formData.endDate && (
              <Alert severity="warning">
                All instructors are busy during the selected dates. You can still create the project and assign an instructor later.
              </Alert>
            )}
          </Stack>
        );
        
      case 2:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., New York, NY or Remote"
            />
            
            {/* Tags */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button size="small" onClick={handleAddTag} variant="outlined">
                  Add
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
            
            {/* Participants */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Participants
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add participant name"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                />
                <Button size="small" onClick={handleAddParticipant} variant="outlined">
                  Add
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.participants.map((participant, idx) => (
                  <Chip
                    key={idx}
                    label={participant}
                    onDelete={() => handleRemoveParticipant(participant)}
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Create New Project</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ minHeight: 300 }}>
            {renderStepContent()}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowLeftOutlined />}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleCreate}
            startIcon={<PlusOutlined />}
          >
            Create Project
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleNext}
            endIcon={<ArrowRightOutlined />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

CreateProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  instructors: PropTypes.array,
  getAvailableInstructors: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

export default CreateProjectDialog;