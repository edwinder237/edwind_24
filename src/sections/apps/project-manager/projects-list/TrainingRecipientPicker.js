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

// ==============================|| AUTOCOMPLETE - TRAINING RECIPIENTS ||============================== //

export default function TrainingRecipientPicker({ 
  handleTrainingRecipientChange, 
  initialValue = null,
  error = false,
  helperText = ''
}) {
  const [trainingRecipients, setTrainingRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(initialValue);

  // Fetch training recipients on component mount
  useEffect(() => {
    const fetchTrainingRecipients = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/training-recipients/fetchTrainingRecipients', {
          params: {
            sub_organizationId: 1 // TODO: Get from current user's sub-organization
          }
        });
        setTrainingRecipients(response.data);
      } catch (error) {
        console.error('Error fetching training recipients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingRecipients();
  }, []);

  // Handle creating new training recipient
  const handleCreateNewRecipient = async (inputValue) => {
    if (!inputValue.trim()) return null;

    // Convert to camel case: capitalize first letter of each word
    const camelCaseName = inputValue.trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    try {
      const response = await axios.post('/api/training-recipients/createOrFind', {
        name: camelCaseName,
        sub_organizationId: 1, // TODO: Get from current user's sub-organization
        createdBy: 'clun74oh10003wszp0rpz6fzy' // TODO: Get from current user
      });

      if (response.data.success) {
        const newRecipient = response.data.trainingRecipient;
        
        // Add to the list if it's new
        if (response.data.isNew) {
          setTrainingRecipients(prev => [...prev, newRecipient]);
        }
        
        return newRecipient;
      }
    } catch (error) {
      console.error('Error creating training recipient:', error);
    }
    return null;
  };

  const handleChange = async (event, value, reason) => {
    if (value && value.isNew) {
      // Handle creating new option
      const newRecipient = await handleCreateNewRecipient(value.name);
      if (newRecipient) {
        setSelectedRecipient(newRecipient);
        handleTrainingRecipientChange(newRecipient);
      }
    } else {
      // Handle selecting existing option or clearing
      setSelectedRecipient(value);
      handleTrainingRecipientChange(value);
    }
  };

  return (
    <Autocomplete
      id="training-recipient-autocomplete"
      options={trainingRecipients}
      value={selectedRecipient}
      onChange={handleChange}
      getOptionLabel={(option) => {
        // Handle string inputs (when user types)
        if (typeof option === 'string') {
          return option;
        }
        // Handle object options (existing recipients)
        return option?.name || '';
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.id === value.id;
      }}
      filterOptions={(options, params) => {
        const filtered = options.filter(option =>
          option.name.toLowerCase().includes(params.inputValue.toLowerCase())
        );

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => 
          inputValue.toLowerCase() === option.name.toLowerCase()
        );
        
        if (inputValue !== '' && !isExisting) {
          // Convert to camel case for display in the create option
          const camelCaseName = inputValue.trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          filtered.push({
            id: 'create-new',
            name: camelCaseName,
            isNew: true
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
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
                  Add new training recipient
                </Typography>
              </Box>
            </li>
          );
        }

        return (
          <li {...props}>
            <Box>
              <Typography variant="body2">
                {option.name}
              </Typography>
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderTags={(value, getTagProps) => {
        // Since this is single select, we don't need this
        return null;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select or create training recipient"
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

TrainingRecipientPicker.propTypes = {
  handleTrainingRecipientChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
  error: PropTypes.bool,
  helperText: PropTypes.string
};