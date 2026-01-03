import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Chip,
  ListItem,
  ListItemText
} from '@mui/material';

// project imports
import axios from 'utils/axios';

// ==============================|| AUTOCOMPLETE - INSTRUCTORS ||============================== //

export default function InstructorPicker({ 
  handleInstructorChange, 
  initialValue = null,
  error = false,
  helperText = ''
}) {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(initialValue);

  // Fetch instructors on component mount
  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/instructors/fetchInstructors', {
          params: {
            status: 'active'
          }
        });
        setInstructors(response.data);
      } catch (error) {
        console.error('Error fetching instructors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  // Sync selectedInstructor with initialValue changes
  useEffect(() => {
    setSelectedInstructor(initialValue);
  }, [initialValue]);

  // Handle creating new instructor
  const handleCreateNewInstructor = async (inputValue) => {
    if (!inputValue.trim()) return null;

    // Convert to camel case: capitalize first letter of each word
    const camelCaseName = inputValue.trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Split name into first and last name
    const nameParts = camelCaseName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const response = await axios.post('/api/instructors/createInstructor', {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`, // Placeholder email
        sub_organizationId: 1, // TODO: Get from current user's sub-organization
        createdBy: 'system' // TODO: Get from current user
      });

      if (response.data.success) {
        const newInstructor = response.data.data;
        console.log('New instructor created:', newInstructor);
        
        // Add to the list
        setInstructors(prev => [...prev, newInstructor]);
        
        return newInstructor;
      } else {
        console.error('Failed to create instructor:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating instructor:', error);
    }
    return null;
  };

  const handleChange = async (event, value, reason) => {
    if (value && value.isNew) {
      // Handle creating new option
      const newInstructor = await handleCreateNewInstructor(value.name);
      if (newInstructor) {
        setSelectedInstructor(newInstructor);
        handleInstructorChange(newInstructor);
      }
    } else {
      // Handle selecting existing option or clearing
      setSelectedInstructor(value);
      handleInstructorChange(value);
    }
  };

  return (
    <Autocomplete
      id="instructor-autocomplete"
      options={instructors}
      value={selectedInstructor}
      onChange={handleChange}
      getOptionLabel={(option) => {
        // Handle string inputs (when user types)
        if (typeof option === 'string') {
          return option;
        }
        // Handle object options (existing instructors)
        if (!option || !option.firstName) return '';
        return `${option.firstName} ${option.lastName || ''}`.trim();
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.id === value.id;
      }}
      filterOptions={(options, params) => {
        const filtered = options.filter(option => {
          if (!option || !option.firstName) return false;
          const fullName = `${option.firstName} ${option.lastName || ''}`.toLowerCase();
          return fullName.includes(params.inputValue.toLowerCase());
        });

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => {
          if (!option || !option.firstName) return false;
          const fullName = `${option.firstName} ${option.lastName || ''}`.toLowerCase();
          return inputValue.toLowerCase() === fullName;
        });
        
        if (inputValue !== '' && !isExisting) {
          // Convert to camel case for display in the create option
          const camelCaseName = inputValue.trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          filtered.unshift({
            id: 'create-new',
            firstName: camelCaseName,
            lastName: '',
            name: camelCaseName,
            isNew: true
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
      freeSolo
      forcePopupIcon
      ListboxProps={{
        sx: {
          maxHeight: 250,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'action.hover',
            borderRadius: 1
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.disabled'
            }
          }
        }
      }}
      renderOption={(props, option) => {
        if (option.isNew) {
          return (
            <ListItem
              {...props}
              sx={{
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.12)'
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: 18,
                  mr: 1.5
                }}
              >
                +
              </Box>
              <ListItemText
                primary={
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    Create "{option.name}"
                  </Typography>
                }
                secondary="Add new instructor"
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary'
                }}
              />
            </ListItem>
          );
        }

        return (
          <ListItem {...props}>
            <ListItemText
              primary={`${option.firstName} ${option.lastName || ''}`.trim()}
              secondary={option.email}
              primaryTypographyProps={{ variant: 'body1' }}
              secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </ListItem>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select or create instructor"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          inputProps={{
            ...params.inputProps,
            onChange: (e) => {
              // Convert to camel case in real-time
              const camelCaseValue = e.target.value
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              // Update the input value
              e.target.value = camelCaseValue;

              // Call the original onChange if it exists
              if (params.inputProps.onChange) {
                params.inputProps.onChange(e);
              }
            }
          }}
        />
      )}
    />
  );
}

InstructorPicker.propTypes = {
  handleInstructorChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
  error: PropTypes.bool,
  helperText: PropTypes.string
};