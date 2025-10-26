import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Stack,
  TextField,
  Typography,
  InputLabel,
  Chip
} from '@mui/material';
import { generateSequentialGroupNames } from '../utils/groupNameUtils';

/**
 * Optimized component for sequential group creation form
 */
const SequentialGroupForm = React.memo(({ 
  values, 
  getFieldProps, 
  touched, 
  errors, 
  groupsInState 
}) => {
  // Memoize preview group names to avoid recalculation on every render
  const previewGroupNames = useMemo(() => {
    if (!values.sequentialPrefix || values.sequentialCount <= 0) return [];
    
    const existingNames = groupsInState.map(group => group.groupName);
    const prefix = values.sequentialPrefix || 'Group';
    const count = Math.min(values.sequentialCount, 10); // Limit preview to 10
    
    return generateSequentialGroupNames(prefix, count, existingNames);
  }, [values.sequentialPrefix, values.sequentialCount, groupsInState]);

  return (
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
      {previewGroupNames.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Preview (will create {values.sequentialCount} groups):
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {previewGroupNames.map((groupName, i) => (
              <Chip
                key={i}
                label={groupName}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
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
  );
});

SequentialGroupForm.propTypes = {
  values: PropTypes.object.isRequired,
  getFieldProps: PropTypes.func.isRequired,
  touched: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  groupsInState: PropTypes.array.isRequired
};

SequentialGroupForm.displayName = 'SequentialGroupForm';

export default SequentialGroupForm;