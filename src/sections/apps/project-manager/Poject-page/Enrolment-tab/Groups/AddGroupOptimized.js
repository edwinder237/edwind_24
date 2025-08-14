import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  InputLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Third-party
import { useFormik, Form, FormikProvider } from 'formik';

// Project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import AlertCustomerDelete from '../AlertCustomerDelete';

// Local imports
import { useGroupFormState } from './hooks/useGroupFormState';
import { useGroupValidation } from './hooks/useGroupValidation';
import { useGroupSubmission } from './hooks/useGroupSubmission';
import { getInitialValues } from './utils/groupNameUtils';
import SequentialGroupForm from './components/SequentialGroupForm';
import ManualGroupForm from './components/ManualGroupForm';
import ColorSelector from './components/ColorSelector';

// Assets
import { DeleteFilled } from '@ant-design/icons';

const formContext = "Group";

/**
 * Optimized AddGroup component with separated concerns and performance optimizations
 */
const AddGroupOptimized = React.memo(({ 
  customer, 
  onCancel, 
  handleAddParticipant, 
  groupsInState, 
  participants 
}) => {
  const isCreating = !customer;

  // Custom hooks for state management
  const {
    openAlert,
    setOpenAlert,
    isMultipleMode,
    handleAlertClose,
    handleModeToggle
  } = useGroupFormState();

  // Validation schema
  const validationSchema = useGroupValidation(isMultipleMode, groupsInState);

  // Submission handler
  const { handleSubmit } = useGroupSubmission(
    customer,
    isMultipleMode,
    groupsInState,
    handleAddParticipant,
    onCancel
  );

  // Memoize initial values to prevent infinite re-renders
  const initialValues = useMemo(() => getInitialValues(customer, isMultipleMode), [customer, isMultipleMode]);

  // Form configuration
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: handleSubmit
  });

  const { errors, touched, isSubmitting, getFieldProps, setFieldValue, values, resetForm } = formik;

  // Reset form when mode changes
  useEffect(() => {
    resetForm({
      values: getInitialValues(customer, isMultipleMode)
    });
  }, [isMultipleMode, customer, resetForm]);

  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form autoComplete="off" noValidate onSubmit={formik.handleSubmit}>
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
                <Grid container spacing={3}>
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
                              <SequentialGroupForm
                                values={values}
                                getFieldProps={getFieldProps}
                                touched={touched}
                                errors={errors}
                                groupsInState={groupsInState}
                              />
                            ) : (
                              <ManualGroupForm
                                values={values}
                                setFieldValue={setFieldValue}
                                touched={touched}
                                errors={errors}
                              />
                            )}
                          </Stack>
                        </Grid>
                      )}
                      
                      <ColorSelector
                        isMultipleMode={isMultipleMode}
                        getFieldProps={getFieldProps}
                        setFieldValue={setFieldValue}
                        currentColor={isMultipleMode ? values.bulkChipColor : values.chipColor}
                      />
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
      {!isCreating && (
        <AlertCustomerDelete 
          title={customer?.fatherName} 
          open={openAlert} 
          handleClose={handleAlertClose} 
        />
      )}
    </>
  );
});

AddGroupOptimized.propTypes = {
  customer: PropTypes.any,
  onCancel: PropTypes.func.isRequired,
  handleAddParticipant: PropTypes.func.isRequired,
  groupsInState: PropTypes.array.isRequired,
  participants: PropTypes.array
};

AddGroupOptimized.displayName = 'AddGroupOptimized';

export default AddGroupOptimized;