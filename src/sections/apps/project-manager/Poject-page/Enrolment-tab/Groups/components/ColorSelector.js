import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  FormControl,
  RadioGroup
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ColorPalette from '../../ColorPalette';

/**
 * Optimized color selector component
 */
const ColorSelector = React.memo(({ 
  isMultipleMode, 
  getFieldProps, 
  setFieldValue,
  currentColor 
}) => {
  const theme = useTheme();

  // Memoize color options to prevent recreation on every render
  const backgroundColor = useMemo(() => [
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
  ], [theme]);

  const handleColorChange = React.useCallback((e) => {
    if (isMultipleMode) {
      setFieldValue('bulkChipColor', e.target.value);
    } else {
      setFieldValue('chipColor', e.target.value);
    }
  }, [isMultipleMode, setFieldValue]);

  return (
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
              value={currentColor || ''}
              onChange={handleColorChange}
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
  );
});

ColorSelector.propTypes = {
  isMultipleMode: PropTypes.bool.isRequired,
  getFieldProps: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  currentColor: PropTypes.string
};

ColorSelector.displayName = 'ColorSelector';

export default ColorSelector;