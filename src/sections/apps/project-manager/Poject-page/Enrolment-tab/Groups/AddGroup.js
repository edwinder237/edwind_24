import PropTypes from 'prop-types';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'store';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  IconButton as MuiIconButton,
  Chip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// third-party
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';

// project imports
import AlertCustomerDelete from '../AlertCustomerDelete';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import MainCard from 'components/MainCard';
import { openSnackbar } from 'store/reducers/snackbar';
import { addGroup } from 'store/reducers/projects';
import ColorPalette from '../ColorPalette';

// assets
import { CameraOutlined, DeleteFilled, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { yellow } from '@ant-design/colors';

/// REUSEABLE FORM CHECKLIST
// create formContext variable with string
// Update snackbar messages to formContext
// Update DialogTitle to formContext

const formContext = "Group"


// constant
const getInitialValues = (customer, isMultipleMode = false) => {
  const newCustomer = {
    groupName: '',
    participants: '',
    courses: '',
    chipColor: '',
    // For multiple groups mode
    groupNames: isMultipleMode ? [''] : [],
    bulkChipColor: '',
    // For sequential groups creation
    useSequentialNaming: false,
    sequentialCount: 3,
    sequentialPrefix: 'Group'
  };

  return newCustomer;
};



// ==============================|| CUSTOMER ADD / EDIT / DELETE ||============================== //

const AddGroup = ({ customer, onCancel,project_parentGroup,handleAddParticipant,groupsInState,participants }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {groups} = useSelector((state)=>state.projects);
  const isCreating = !customer;

  const backgroundColor = [
    {
      value: theme.palette.primary.main,
      color: 'primary.main'
    },
    {
      value: theme.palette.error.main,
      color: 'error.main'
    },
    {
      value: theme.palette.success.main,
      color: 'success.main'
    },
    {
      value: theme.palette.secondary.main,
      color: 'secondary.main'
    },
    {
      value: theme.palette.warning.main,
      color: 'warning.main'
    },
    {
      value: theme.palette.primary.lighter,
      color: 'primary.lighter'
    },
    {
      value: theme.palette.error.lighter,
      color: 'error.lighter'
    },
    {
      value: theme.palette.success.lighter,
      color: 'success.lighter'
    },
    {
      value: theme.palette.secondary.lighter,
      color: 'secondary.lighter'
    },
    {
      value: theme.palette.warning.lighter,
      color: 'warning.lighter'
    }
  ];

  const textColor = [
    {
      value: '#fff',
      color: 'white'
    },
    {
      value: theme.palette.error.lighter,
      color: 'error.lighter'
    },
    {
      value: theme.palette.success.lighter,
      color: 'success.lighter'
    },
    {
      value: theme.palette.secondary.lighter,
      color: 'secondary.lighter'
    },
    {
      value: theme.palette.warning.lighter,
      color: 'warning.lighter'
    },
    {
      value: theme.palette.primary.lighter,
      color: 'primary.lighter'
    },
    {
      value: theme.palette.primary.main,
      color: 'primary.main'
    },
    {
      value: theme.palette.error.main,
      color: 'error.main'
    },
    {
      value: theme.palette.success.main,
      color: 'success.main'
    },
    {
      value: theme.palette.secondary.main,
      color: 'secondary.main'
    },
    {
      value: theme.palette.warning.main,
      color: 'warning.main'
    }
  ];

  const [openAlert, setOpenAlert] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);

  const handleAlertClose = () => {
    setOpenAlert(!openAlert);
    onCancel();
  };

  const handleModeToggle = () => {
    const newMode = !isMultipleMode;
    setIsMultipleMode(newMode);
    
    // Reset form with new initial values when mode changes
    formik.resetForm({
      values: getInitialValues(customer, newMode)
    });
  };

//console.log(selectedParticipants)

  // Memoize initial values to prevent infinite re-renders
  const initialValues = useMemo(() => getInitialValues(customer, isMultipleMode), [customer, isMultipleMode]);

  // Memoize validation schema to prevent infinite re-renders
  const validationSchema = useMemo(() => Yup.object().shape({
      groupName: !isMultipleMode ? Yup.string()
        .max(255)
        .test('unique-groupName', 'Group name already exists', function (value) {
          return !groupsInState.some(group => group.groupName === value);
        })
        .required("Mandatory field") : Yup.string(),
      groupNames: isMultipleMode ? Yup.array()
        .when('useSequentialNaming', {
          is: false,
          then: Yup.array()
            .of(
              Yup.string()
                .max(255)
                .test('unique-groupName', 'Group name already exists', function (value) {
                  const currentNames = this.parent || [];
                  const existingNames = groupsInState.map(group => group.groupName);
                  // Check for duplicates within the array
                  const duplicateInArray = currentNames.filter(name => name === value).length > 1;
                  // Check if already exists in the system
                  const existsInSystem = existingNames.includes(value);
                  return !duplicateInArray && !existsInSystem;
                })
                .required("Group name is required")
            )
            .min(1, "At least one group name is required"),
          otherwise: Yup.array()
        }) : Yup.array(),
      sequentialCount: isMultipleMode ? Yup.number()
        .min(1, "Count must be at least 1")
        .max(50, "Count cannot exceed 50")
        .integer("Count must be a whole number") : Yup.number(),
      sequentialPrefix: isMultipleMode ? Yup.string()
        .max(20, "Prefix cannot exceed 20 characters")
        .matches(/^[a-zA-Z0-9\s\-_]*$/, "Prefix can only contain letters, numbers, spaces, hyphens, and underscores") : Yup.string(),
    }), [isMultipleMode, groupsInState]); // Memoize with proper dependencies

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        
        if (isMultipleMode) {
          // Handle multiple groups creation
          let groupNamesToCreate = [];
          
          if (values.useSequentialNaming) {
            // Generate sequential group names
            const existingNames = groupsInState.map(group => group.groupName);
            const prefix = values.sequentialPrefix || 'Group';
            let startingNumber = 1;
            
            // Find the next available number for the prefix
            while (existingNames.includes(`${prefix} ${startingNumber}`)) {
              startingNumber++;
            }
            
            // Generate the sequential names
            for (let i = 0; i < values.sequentialCount; i++) {
              const groupName = `${prefix} ${startingNumber + i}`;
              // Double-check the name doesn't exist (in case of concurrent operations)
              if (!existingNames.includes(groupName)) {
                groupNamesToCreate.push(groupName);
              }
            }
          } else {
            // Use manually entered group names
            const validGroupNames = values.groupNames.filter(name => name.trim() !== '');
            
            // Remove duplicates from the array
            groupNamesToCreate = [...new Set(validGroupNames)];
          }
          
          const newGroups = groupNamesToCreate.map(groupName => ({
            groupName: groupName.trim(),
            employees: [],
            courses: [],
            chipColor: values.bulkChipColor || theme.palette.primary.main
          }));
          
          
          // Add all groups in a single operation to prevent race conditions
          
          // Add groups sequentially to prevent database race conditions
          for (let i = 0; i < newGroups.length; i++) {
            const newGroup = newGroups[i];
            
            try {
              // Wait for the actual API call to complete
              await handleAddParticipant(newGroup);
            } catch (error) {
              // Continue with next group even if one fails
            }
          }
          
          dispatch(
            openSnackbar({
              open: true,
              message: `${newGroups.length} ${formContext}${newGroups.length > 1 ? 's' : ''} added successfully.`,
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );
        } else {
          // Handle single group creation (existing logic)
          const newGroup = {
            groupName: values.groupName,
            employees: [],
            courses: [],
            chipColor: values.chipColor || theme.palette.primary.main
          };
          
          if (customer) {
            // dispatch(updateCustomer(customer.id, newGroup)); - update
            dispatch(
              openSnackbar({
                open: true,
                message: `${formContext} updated successfully.`,
                variant: 'alert',
                alert: {
                  color: 'success'
                },
                close: false
              })
            );
          } else {
            handleAddParticipant(newGroup);
            dispatch(
              openSnackbar({
                open: true,
                message: `${formContext} added successfully.`,
                variant: 'alert',
                alert: {
                  color: 'success'
                },
                close: false
              })
            );
          }
        }

        setSubmitting(false);
        onCancel();
      } catch (error) {
        console.error(error);
        setSubmitting(false);
      }
    }
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue, values } = formik;

  // Handle form reset when mode changes - removed useEffect to prevent infinite loops

  // Helper functions for multiple groups
  const addGroupNameField = () => {
    const currentGroupNames = values.groupNames || [];
    setFieldValue('groupNames', [...currentGroupNames, '']);
  };

  const removeGroupNameField = (index) => {
    const currentGroupNames = values.groupNames || [];
    if (currentGroupNames.length > 1) {
      const newGroupNames = currentGroupNames.filter((_, i) => i !== index);
      setFieldValue('groupNames', newGroupNames);
    }
  };

  const updateGroupNameField = (index, value) => {
    const currentGroupNames = values.groupNames || [];
    const newGroupNames = [...currentGroupNames];
    newGroupNames[index] = value;
    setFieldValue('groupNames', newGroupNames);
  };
  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <MainCard
              title={
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5">
                    {customer ? `Edit ${formContext}` : `New ${formContext}${isMultipleMode ? 's' : ''}`}
                  </Typography>
                  {!customer && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isMultipleMode}
                          onChange={handleModeToggle}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {isMultipleMode ? 'Multiple Groups' : 'Single Group'}
                        </Typography>
                      }
                    />
                  )}
                </Stack>
              }
              content={false}
              sx={{ m: 0 }}
            >
              <Box sx={{ p: 3 }}>
              <Grid container spacing={3} >

                <Grid item xs={12} md={12}>
                  <Grid container spacing={3}>
                    {!isMultipleMode ? (
                      // Single Group Mode
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          <InputLabel htmlFor="group-name">Group Name</InputLabel>
                          <TextField
                            fullWidth
                            id="group-name"
                            placeholder="Enter Group Name"
                            {...getFieldProps('groupName')}
                            error={Boolean(touched.groupName && errors.groupName)}
                            helperText={touched.groupName && errors.groupName}
                          />
                        </Stack>
                      </Grid>
                    ) : (
                      // Multiple Groups Mode
                      <Grid item xs={12}>
                        <Stack spacing={3}>
                          {/* Sequential Naming Toggle */}
                          <FormControlLabel
                            control={
                              <Switch
                                checked={values.useSequentialNaming}
                                onChange={(e) => setFieldValue('useSequentialNaming', e.target.checked)}
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="body2">
                                Use Sequential Naming (e.g., Group 1, Group 2, Group 3...)
                              </Typography>
                            }
                          />

                          {values.useSequentialNaming ? (
                            // Sequential Naming Mode
                            <Stack spacing={2}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Stack spacing={1.25}>
                                    <InputLabel htmlFor="sequential-prefix">Prefix</InputLabel>
                                    <TextField
                                      fullWidth
                                      id="sequential-prefix"
                                      placeholder="Group"
                                      {...getFieldProps('sequentialPrefix')}
                                      error={Boolean(touched.sequentialPrefix && errors.sequentialPrefix)}
                                      helperText={touched.sequentialPrefix && errors.sequentialPrefix}
                                    />
                                  </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Stack spacing={1.25}>
                                    <InputLabel htmlFor="sequential-count">Number of Groups</InputLabel>
                                    <TextField
                                      fullWidth
                                      id="sequential-count"
                                      type="number"
                                      placeholder="3"
                                      inputProps={{ min: 1, max: 50 }}
                                      {...getFieldProps('sequentialCount')}
                                      error={Boolean(touched.sequentialCount && errors.sequentialCount)}
                                      helperText={touched.sequentialCount && errors.sequentialCount}
                                    />
                                  </Stack>
                                </Grid>
                              </Grid>
                              
                              {/* Preview of group names that will be created */}
                              {values.sequentialPrefix && values.sequentialCount > 0 && (
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Preview (will create {values.sequentialCount} groups):
                                  </Typography>
                                  <Box display="flex" flexWrap="wrap" gap={1}>
                                    {Array.from({ length: Math.min(values.sequentialCount, 10) }, (_, i) => {
                                      // Find next available number
                                      const existingNames = groupsInState.map(group => group.groupName);
                                      const prefix = values.sequentialPrefix || 'Group';
                                      let startingNumber = 1;
                                      while (existingNames.includes(`${prefix} ${startingNumber}`)) {
                                        startingNumber++;
                                      }
                                      return (
                                        <Chip
                                          key={i}
                                          label={`${prefix} ${startingNumber + i}`}
                                          size="small"
                                          variant="outlined"
                                          color="primary"
                                        />
                                      );
                                    })}
                                    {values.sequentialCount > 10 && (
                                      <Chip
                                        label={`... +${values.sequentialCount - 10} more`}
                                        size="small"
                                        variant="outlined"
                                        color="default"
                                      />
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          ) : (
                            // Manual Group Names Mode
                            <Stack spacing={2}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <InputLabel>Group Names</InputLabel>
                                <Button
                                  size="small"
                                  startIcon={<PlusOutlined />}
                                  onClick={addGroupNameField}
                                  variant="outlined"
                                >
                                  Add Group
                                </Button>
                              </Box>
                          {(values.groupNames || []).map((groupName, index) => (
                            <Box key={index} display="flex" alignItems="center" gap={1}>
                              <TextField
                                fullWidth
                                placeholder={`Enter Group Name ${index + 1}`}
                                value={groupName}
                                onChange={(e) => updateGroupNameField(index, e.target.value)}
                                error={Boolean(
                                  errors.groupNames && 
                                  errors.groupNames[index] && 
                                  touched.groupNames && 
                                  touched.groupNames[index]
                                )}
                                helperText={
                                  errors.groupNames && 
                                  errors.groupNames[index] && 
                                  touched.groupNames && 
                                  touched.groupNames[index] ? 
                                  errors.groupNames[index] : ''
                                }
                              />
                              {(values.groupNames || []).length > 1 && (
                                <MuiIconButton
                                  color="error"
                                  onClick={() => removeGroupNameField(index)}
                                  size="small"
                                >
                                  <CloseOutlined />
                                </MuiIconButton>
                              )}
                            </Box>
                          ))}
                              {errors.groupNames && typeof errors.groupNames === 'string' && (
                                <Typography color="error" variant="caption">
                                  {errors.groupNames}
                                </Typography>
                              )}
                            </Stack>
                          )}
                        </Stack>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            Background Color {isMultipleMode && '(Applied to all groups)'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl>
                            <RadioGroup
                              row
                              aria-label="chipColor"
                              {...getFieldProps('color')}
                              onChange={(e) => {
                                if (isMultipleMode) {
                                  setFieldValue('bulkChipColor', e.target.value);
                                } else {
                                  setFieldValue('chipColor', e.target.value);
                                }
                              }}
                              name="color-radio-buttons-group"
                              sx={{ '& .MuiFormControlLabel-root': { mr: 2 } }}
                            >
                              {backgroundColor.map((item, index) => (
                                <ColorPalette key={index} value={item.value} color={item.color} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>

                  </Grid>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Box>
                  {!isCreating && (
                    <Tooltip title="Delete Customer" placement="top">
                      <IconButton onClick={() => setOpenAlert(true)} size="large" color="error">
                        <DeleteFilled />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button color="error" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {customer ? 'Edit' : isMultipleMode ? 'Add Groups' : 'Add'}
                  </Button>
                </Stack>
              </Stack>
              </Box>
            </MainCard>
          </Form>
        </LocalizationProvider>
      </FormikProvider>
      {!isCreating && <AlertCustomerDelete title={customer.fatherName} open={openAlert} handleClose={handleAlertClose} />}
    </>
  );
};

AddGroup.propTypes = {
  customer: PropTypes.any,
  onCancel: PropTypes.func
};

export default AddGroup;
