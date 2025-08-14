import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Box,
  Button,
  Grid,
  InputLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Third-party
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';

// Project imports
import MainCard from 'components/MainCard';
import { PopupTransition } from 'components/@extended/Transitions';
import ColorSelector from './ColorSelector';

/**
 * Edit Group Dialog Component
 */
const EditGroupDialog = React.memo(({ 
  open, 
  onClose, 
  group, 
  onUpdate, 
  existingGroupNames = [] 
}) => {
  // Validation schema
  const validationSchema = Yup.object().shape({
    groupName: Yup.string()
      .max(255, 'Group name cannot exceed 255 characters')
      .test('unique-groupName', 'Group name already exists', function (value) {
        // Exclude current group name from uniqueness check
        const otherGroupNames = existingGroupNames.filter(name => name !== group?.groupName);
        return !otherGroupNames.includes(value);
      })
      .required('Group name is required'),
    chipColor: Yup.string().required('Color is required')
  });

  // Form configuration
  const formik = useFormik({
    initialValues: {
      groupName: group?.groupName || '',
      chipColor: group?.chipColor || '#1976d2'
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        await onUpdate(group.id, {
          groupName: values.groupName,
          chipColor: values.chipColor
        });
        onClose();
      } catch (error) {
        console.error('Failed to update group:', error);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const { errors, touched, isSubmitting, getFieldProps, setFieldValue, values, resetForm } = formik;

  // Reset form when group changes
  useEffect(() => {
    if (group) {
      resetForm({
        values: {
          groupName: group.groupName || '',
          chipColor: group.chipColor || '#1976d2'
        }
      });
    }
  }, [group, resetForm]);

  if (!group) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 500 } }}
    >
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form autoComplete="off" noValidate onSubmit={formik.handleSubmit}>
            <MainCard
              title={
                <Typography variant="h5">
                  Edit Group
                </Typography>
              }
              content={false}
              sx={{ m: 0 }}
            >
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Group Name Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1.25}>
                      <InputLabel htmlFor="edit-group-name">Group Name</InputLabel>
                      <TextField
                        fullWidth
                        id="edit-group-name"
                        placeholder="Enter Group Name"
                        {...getFieldProps('groupName')}
                        error={Boolean(touched.groupName && errors.groupName)}
                        helperText={touched.groupName && errors.groupName}
                      />
                    </Stack>
                  </Grid>
                  
                  {/* Color Selector */}
                  <ColorSelector
                    isMultipleMode={false}
                    getFieldProps={getFieldProps}
                    setFieldValue={setFieldValue}
                    currentColor={values.chipColor}
                  />
                </Grid>

                {/* Action Buttons */}
                <Stack 
                  direction="row" 
                  justifyContent="flex-end" 
                  spacing={2}
                  sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Button 
                    color="error" 
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Group'}
                  </Button>
                </Stack>
              </Box>
            </MainCard>
          </Form>
        </LocalizationProvider>
      </FormikProvider>
    </Dialog>
  );
});

EditGroupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  group: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  existingGroupNames: PropTypes.array
};

EditGroupDialog.displayName = 'EditGroupDialog';

export default EditGroupDialog;