import React, { useState, useCallback, useEffect } from "react";
import { useDispatch } from "store";
import { useFormik } from "formik";
import * as Yup from "yup";

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
  Collapse,
  Fade,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { openSnackbar } from "store/reducers/snackbar";
import Avatar from "components/@extended/Avatar";

// assets
import {
  UserAddOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";

// ==============================|| NEW PARTICIPANT FORM ||============================== //

const steps = ['Basic Information', 'Group Assignment', 'Review & Submit'];

const createValidationSchema = (existingEmails = []) => Yup.object({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .test('email-unique', 'This email is already registered in the project', function(value) {
      if (!value) return true; // Let required validation handle empty values
      return !existingEmails.includes(value.toLowerCase().trim());
    }),
  roleId: Yup.number()
    .required('Role is required'),
  group: Yup.string()
    .optional(),
});

const NewParticipantForm = ({ 
  onCancel, 
  handleCRUD, 
  groups = [], 
  isOpen = false,
  existingParticipants = []
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [participantRoles, setParticipantRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const { handleAddParticipant } = handleCRUD;
  
  // Extract existing emails for validation
  const existingEmails = existingParticipants.map(p => 
    p.participant?.email?.toLowerCase().trim()
  ).filter(Boolean);

  // Fetch participant roles on component mount
  useEffect(() => {
    const fetchParticipantRoles = async () => {
      if (!isOpen) return;
      
      setLoadingRoles(true);
      try {
        const response = await fetch('/api/participant-roles/for-dropdown');
        if (response.ok) {
          const roles = await response.json();
          setParticipantRoles(roles);
        } else {
          console.error('Failed to fetch participant roles');
          dispatch(openSnackbar({
            open: true,
            message: 'Failed to load participant roles',
            variant: 'alert',
            alert: { color: 'warning' },
          }));
          // Fallback to default roles
          setParticipantRoles([
            { id: 1, title: 'Learner', description: 'Standard learner role' },
            { id: 2, title: 'Manager', description: 'Management role' },
            { id: 3, title: 'Admin', description: 'Administrative role' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching participant roles:', error);
        // Fallback to default roles
        setParticipantRoles([
          { id: 1, title: 'Learner', description: 'Standard learner role' },
          { id: 2, title: 'Manager', description: 'Management role' },
          { id: 3, title: 'Admin', description: 'Administrative role' }
        ]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchParticipantRoles();
  }, [isOpen, dispatch]);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      group: '',
    },
    validationSchema: createValidationSchema(existingEmails),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        
        const newParticipant = {
          participant: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.toLowerCase().trim(),
            participantStatus: "Active",
            roleId: values.roleId,
            profilePrefs: {},
            credentials: { username: values.firstName.toLowerCase() },
          },
          group: values.group, // Send group name as string
        };

        await handleAddParticipant(newParticipant);
        
        // Note: Success message is now handled in the handleAddParticipant function
        // to ensure consistency across all participant addition methods

        // Reset form and close - handleAddParticipant will close the dialog
        formik.resetForm();
        setActiveStep(0);
        
      } catch (error) {
        console.error('Error adding participant:', error);
        
        // Handle specific error types
        if (error?.response?.status === 409) {
          const errorData = error.response.data;
          if (errorData.participantExists) {
            setSubmitError(`${values.firstName} ${values.lastName} is already enrolled in this project.`);
          } else if (errorData.error === "Email already exists") {
            setSubmitError(`A participant with email "${values.email}" already exists. Please use a different email address.`);
          } else {
            setSubmitError(errorData.message || 'This participant already exists in the system.');
          }
        } else if (error?.response?.status === 400) {
          setSubmitError('Please check all required fields and try again.');
        } else {
          setSubmitError(error?.response?.data?.message || error?.message || 'Failed to add participant. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleNext = useCallback(() => {
    if (activeStep === 0) {
      // Validate basic information
      formik.setTouched({
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
      });
      
      const hasBasicErrors = !!(
        formik.errors.firstName || 
        formik.errors.lastName || 
        formik.errors.email || 
        formik.errors.roleId
      );

      if (!hasBasicErrors && formik.values.firstName && formik.values.lastName && formik.values.email && formik.values.roleId) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      // Validate group assignment (now optional)
      formik.setTouched({ group: true });
      
      if (!formik.errors.group) {
        setActiveStep(2);
      }
    }
  }, [activeStep, formik]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const handleReset = useCallback(() => {
    formik.resetForm();
    setActiveStep(0);
    setSubmitError(null);
  }, [formik]);

  const getSelectedGroup = useCallback(() => {
    return groups.find(group => group.groupName === formik.values.group);
  }, [groups, formik.values.group]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={3} pr={6}>
            <Typography variant="h6" color="text.primary">
              Enter participant details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                  placeholder="Enter first name"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                  placeholder="Enter last name"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  placeholder="Enter email address"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={formik.touched.roleId && Boolean(formik.errors.roleId)}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="roleId"
                    value={formik.values.roleId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Role"
                    disabled={loadingRoles}
                  >
                    {loadingRoles ? (
                      <MenuItem disabled>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CircularProgress size={16} />
                          <Typography>Loading roles...</Typography>
                        </Stack>
                      </MenuItem>
                    ) : (
                      participantRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          <Stack>
                            <Typography variant="body1">{role.title}</Typography>
                            {role.description && (
                              <Typography variant="caption" color="text.secondary">
                                {role.description}
                              </Typography>
                            )}
                          </Stack>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {formik.touched.roleId && formik.errors.roleId && (
                    <FormHelperText>{formik.errors.roleId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" color="text.primary">
              Assign to a group (Optional)
            </Typography>
            
            <FormControl fullWidth error={formik.touched.group && Boolean(formik.errors.group)}>
              <InputLabel>Select Group (Optional)</InputLabel>
              <Select
                name="group"
                value={formik.values.group || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Select Group (Optional)"
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Chip
                        label="No Group"
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.grey[400],
                          color: theme.palette.common.white,
                        }}
                      />
                    );
                  }
                  const selectedGroup = groups && groups.find(group => group && group.groupName === selected);
                  return selectedGroup ? (
                    <Chip
                      label={selected}
                      size="small"
                      sx={{
                        backgroundColor: selectedGroup.chipColor || theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                      }}
                    />
                  ) : selected;
                }}
              >
                <MenuItem value="">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.grey[400],
                      }}
                    />
                    <Typography>No Group</Typography>
                  </Stack>
                </MenuItem>
                {groups && groups.map((group, index) => (
                  <MenuItem key={group?.id || index} value={group?.groupName || ''}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: group?.chipColor || theme.palette.primary.main,
                        }}
                      />
                      <Typography>{group?.groupName || 'Unknown Group'}</Typography>
                      <Chip
                        size="small"
                        label={`${group.participants?.length || 0} members`}
                        variant="outlined"
                      />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.group && formik.errors.group && (
                <FormHelperText>{formik.errors.group}</FormHelperText>
              )}
            </FormControl>

            {formik.values.group && (
              <Fade in>
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <TeamOutlined />
                    <Typography variant="subtitle2">Group Information</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formik.values.group ? (
                      <>
                        {formik.values.firstName} will be added to the "{formik.values.group}" group
                        {getSelectedGroup()?.participants?.length > 0 && 
                          ` with ${getSelectedGroup().participants.length} other member${getSelectedGroup().participants.length === 1 ? '' : 's'}`
                        }.
                      </>
                    ) : (
                      `${formik.values.firstName} will be added without a group assignment.`
                    )}
                  </Typography>
                </Paper>
              </Fade>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" color="text.primary">
              Review participant information
            </Typography>
            
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                      }}
                    >
                      {formik.values.firstName.charAt(0)}{formik.values.lastName.charAt(0)}
                    </Avatar>
                    <Stack>
                      <Typography variant="h6">
                        {formik.values.firstName} {formik.values.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formik.values.email}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Typography variant="body1">
                    {participantRoles.find(r => r.id === formik.values.roleId)?.title || 'Unknown Role'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Group</Typography>
                  <Chip
                    label={formik.values.group || "No Group"}
                    size="small"
                    sx={{
                      backgroundColor: getSelectedGroup()?.chipColor || (formik.values.group ? theme.palette.primary.main : theme.palette.grey[400]),
                      color: theme.palette.primary.contrastText,
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Collapse in={!!submitError}>
              <Alert 
                severity="error" 
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setSubmitError(null)}
                  >
                    <CloseOutlined fontSize="inherit" />
                  </IconButton>
                }
              >
                {submitError}
              </Alert>
            </Collapse>
          </Stack>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardHeader
        avatar={<UserAddOutlined style={{ fontSize: '1.5rem', color: theme.palette.primary.main }} />}
        title="Add New Participant"
        subheader="Follow the steps to add a participant to your project"
        action={
          <IconButton onClick={onCancel} size="small">
            <CloseOutlined />
          </IconButton>
        }
      />
      
      <Divider />
      
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: completed 
                          ? 'success.main' 
                          : active 
                            ? 'primary.main' 
                            : 'action.disabled',
                        color: completed || active ? 'primary.contrastText' : 'text.disabled',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {completed ? <CheckCircleOutlined /> : index + 1}
                    </Box>
                  )}
                >
                  <Typography 
                    variant="caption" 
                    color={activeStep >= index ? 'text.primary' : 'text.disabled'}
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ minHeight: 300 }}>
          {renderStepContent()}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button onClick={handleReset} color="warning" disabled={isSubmitting}>
              Reset
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={formik.handleSubmit}
                disabled={isSubmitting || !formik.isValid}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <UserAddOutlined />}
              >
                {isSubmitting ? 'Adding...' : 'Add Participant'}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NewParticipantForm;