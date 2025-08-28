import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { 
  Autocomplete, 
  TextField, 
  Typography, 
  Box,
  CircularProgress,
  Chip
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
      console.log('Creating new instructor with name:', value.name);
      const newInstructor = await handleCreateNewInstructor(value.name);
      if (newInstructor) {
        console.log('Successfully created instructor, updating state:', newInstructor);
        setSelectedInstructor(newInstructor);
        handleInstructorChange(newInstructor);
      } else {
        console.error('Failed to create new instructor');
      }
    } else {
      // Handle selecting existing option or clearing
      console.log('Selected existing instructor or cleared:', value);
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
            
          filtered.push({
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
      renderOption={(props, option) => {
        if (option.isNew) {
          return (
            <li {...props}>
              <Box>
                <Typography variant="body2" color="primary">
                  Create "{option.name}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add new instructor
                </Typography>
              </Box>
            </li>
          );
        }

        return (
          <li {...props}>
            <Box>
              <Typography variant="body2">
                {option.firstName} {option.lastName || ''}
              </Typography>
              {option.email && (
                <Typography variant="caption" color="text.secondary">
                  {option.email}
                </Typography>
              )}
            </Box>
          </li>
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
      sx={{
        '& .MuiOutlinedInput-root': {
          p: 1
        },
        '& .MuiAutocomplete-tag': {
          bgcolor: 'primary.lighter',
          border: '1px solid',
          borderColor: 'primary.light',
          '& .MuiSvgIcon-root': {
            color: 'primary.main',
            '&:hover': {
              color: 'primary.dark'
            }
          }
        }
      }}
    />
  );
}

InstructorPicker.propTypes = {
  handleInstructorChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
  error: PropTypes.bool,
  helperText: PropTypes.string
};