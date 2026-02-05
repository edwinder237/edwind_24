import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  ListSubheader
} from '@mui/material';
import { TIMEZONE_OPTIONS_GROUPED, getTimezoneAliases } from 'utils/timezone';

/**
 * Get the browser's timezone
 */
export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * TimezoneSelect - A searchable, grouped timezone selector
 * Defaults to browser timezone if no value provided
 */
const TimezoneSelect = ({
  value,
  onChange,
  label = 'Timezone',
  placeholder = 'Search timezones...',
  size = 'medium',
  fullWidth = true,
  helperText,
  error = false,
  defaultToBrowser = true
}) => {
  // Get effective value (use browser timezone as default if no value provided)
  const effectiveValue = useMemo(() => {
    if (value) return value;
    if (defaultToBrowser) return getBrowserTimezone();
    return 'UTC';
  }, [value, defaultToBrowser]);

  // Auto-set browser timezone on mount if no value provided
  useEffect(() => {
    if (!value && defaultToBrowser && onChange) {
      const browserTz = getBrowserTimezone();
      onChange(browserTz);
    }
  }, []);

  // Flatten grouped options for Autocomplete
  const flatOptions = useMemo(() => {
    return TIMEZONE_OPTIONS_GROUPED.flatMap(group =>
      group.timezones.map(tz => ({
        ...tz,
        region: group.region
      }))
    );
  }, []);

  // Find current value object
  const selectedOption = useMemo(() => {
    return flatOptions.find(opt => opt.value === effectiveValue) || null;
  }, [flatOptions, effectiveValue]);

  // Custom filter that searches label, value, and aliases
  const filterOptions = (options, { inputValue }) => {
    if (!inputValue) return options;

    const search = inputValue.toLowerCase().trim();
    return options.filter(opt => {
      // Match label (e.g., "Toronto (GMT-5)")
      if (opt.label.toLowerCase().includes(search)) return true;
      // Match timezone value (e.g., "America/Toronto")
      if (opt.value.toLowerCase().includes(search)) return true;
      // Match aliases (e.g., "montreal", "eastern", "est")
      const aliases = getTimezoneAliases(opt.value);
      return aliases.some(alias => alias.toLowerCase().includes(search));
    });
  };

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(event, newValue) => {
        onChange(newValue ? newValue.value : '');
      }}
      options={flatOptions}
      filterOptions={filterOptions}
      groupBy={(option) => option.region}
      getOptionLabel={(option) => option.label || ''}
      isOptionEqualToValue={(option, value) => option.value === value?.value}
      renderGroup={(params) => (
        <li key={params.key}>
          <ListSubheader
            component="div"
            sx={{
              bgcolor: 'background.default',
              fontWeight: 600,
              color: 'primary.main',
              lineHeight: '32px',
              top: -8
            }}
          >
            {params.group}
          </ListSubheader>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box
            component="li"
            key={key}
            {...otherProps}
            sx={{
              py: 0.75,
              px: 2,
              '&.Mui-focused': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          error={error}
          helperText={helperText}
        />
      )}
      ListboxProps={{
        sx: {
          maxHeight: 350,
          '& .MuiAutocomplete-groupUl': {
            padding: 0
          }
        }
      }}
      fullWidth={fullWidth}
      autoHighlight
      openOnFocus
    />
  );
};

TimezoneSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium']),
  fullWidth: PropTypes.bool,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  defaultToBrowser: PropTypes.bool
};

export default TimezoneSelect;
