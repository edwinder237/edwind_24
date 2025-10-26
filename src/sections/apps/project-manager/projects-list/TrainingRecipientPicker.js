import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  TextField,
  Typography,
  Box,
  CircularProgress,
  Chip,
  ListItem,
  ListItemText,
  Stack
} from '@mui/material';

// project imports
import axios from 'utils/axios';
import EnhancedAutocomplete from 'components/EnhancedAutocomplete';

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

  const handleChange = (event, value, reason) => {
    if (value && value.isNew) {
      // Instead of creating immediately, pass the new recipient data to parent
      // The parent (AddProject) will handle showing the form
      handleTrainingRecipientChange(value);
    } else {
      // Handle selecting existing option or clearing
      setSelectedRecipient(value);
      handleTrainingRecipientChange(value);
    }
  };

  return (
    <EnhancedAutocomplete
      id="training-recipient-autocomplete"
      options={trainingRecipients}
      value={selectedRecipient}
      onChange={handleChange}
      createOptionText="Add new training recipient"
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
            
          filtered.unshift({
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
      renderOption={(props, option) => (
        <ListItem
          {...props}
          secondaryAction={
            option._count && (
              <Stack direction="row" spacing={1}>
                {option._count.projects !== undefined && (
                  <Chip
                    label={`${option._count.projects} project${option._count.projects !== 1 ? 's' : ''}`}
                    size="small"
                    color={option._count.projects > 0 ? 'primary' : 'default'}
                    variant={option._count.projects > 0 ? 'filled' : 'outlined'}
                  />
                )}
                {option._count.participants !== undefined && (
                  <Chip
                    label={`${option._count.participants} participant${option._count.participants !== 1 ? 's' : ''}`}
                    size="small"
                    color={option._count.participants > 0 ? 'secondary' : 'default'}
                    variant={option._count.participants > 0 ? 'filled' : 'outlined'}
                  />
                )}
              </Stack>
            )
          }
        >
          <ListItemText
            primary={option.name}
            secondary={option.description}
            primaryTypographyProps={{
              variant: 'body1'
            }}
            secondaryTypographyProps={{
              variant: 'body2',
              noWrap: true
            }}
          />
        </ListItem>
      )}
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