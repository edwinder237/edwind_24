import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  InputLabel,
  IconButton as MuiIconButton
} from '@mui/material';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * Optimized component for manual group creation form
 */
const ManualGroupForm = React.memo(({ 
  values, 
  setFieldValue, 
  touched, 
  errors 
}) => {
  // Memoized handlers to prevent unnecessary re-renders
  const addGroupNameField = useCallback(() => {
    const currentGroupNames = values.groupNames || [];
    setFieldValue('groupNames', [...currentGroupNames, '']);
  }, [values.groupNames, setFieldValue]);

  const removeGroupNameField = useCallback((index) => {
    const currentGroupNames = values.groupNames || [];
    if (currentGroupNames.length > 1) {
      const newGroupNames = currentGroupNames.filter((_, i) => i !== index);
      setFieldValue('groupNames', newGroupNames);
    }
  }, [values.groupNames, setFieldValue]);

  const updateGroupNameField = useCallback((index, value) => {
    const currentGroupNames = values.groupNames || [];
    const newGroupNames = [...currentGroupNames];
    newGroupNames[index] = value;
    setFieldValue('groupNames', newGroupNames);
  }, [values.groupNames, setFieldValue]);

  return (
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
        <GroupNameField
          key={index}
          index={index}
          groupName={groupName}
          canRemove={(values.groupNames || []).length > 1}
          onUpdate={updateGroupNameField}
          onRemove={removeGroupNameField}
          errors={errors}
          touched={touched}
        />
      ))}
      
      {errors.groupNames && typeof errors.groupNames === 'string' && (
        <Typography color="error" variant="caption">
          {errors.groupNames}
        </Typography>
      )}
    </Stack>
  );
});

// Separate component for each group name field to minimize re-renders
const GroupNameField = React.memo(({ 
  index, 
  groupName, 
  canRemove, 
  onUpdate, 
  onRemove, 
  errors, 
  touched 
}) => {
  const handleChange = useCallback((e) => {
    onUpdate(index, e.target.value);
  }, [index, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  const hasError = Boolean(
    errors.groupNames && 
    errors.groupNames[index] && 
    touched.groupNames && 
    touched.groupNames[index]
  );

  const errorMessage = hasError ? errors.groupNames[index] : '';

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        fullWidth
        placeholder={`Enter Group Name ${index + 1}`}
        value={groupName}
        onChange={handleChange}
        error={hasError}
        helperText={errorMessage}
      />
      {canRemove && (
        <MuiIconButton
          color="error"
          onClick={handleRemove}
          size="small"
        >
          <CloseOutlined />
        </MuiIconButton>
      )}
    </Box>
  );
});

GroupNameField.propTypes = {
  index: PropTypes.number.isRequired,
  groupName: PropTypes.string.isRequired,
  canRemove: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired
};

GroupNameField.displayName = 'GroupNameField';

ManualGroupForm.propTypes = {
  values: PropTypes.object.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  touched: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
};

ManualGroupForm.displayName = 'ManualGroupForm';

export default ManualGroupForm;