import { Autocomplete, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

// Enhanced Autocomplete that only adds better UI for create options
export default function EnhancedAutocomplete({ 
  renderOption,
  filterOptions,
  createOptionText = "Add new",
  ...autocompleteProps 
}) {
  
  // Enhanced renderOption that makes create options more visible
  const enhancedRenderOption = (props, option, state) => {
    if (option.isNew) {
      return (
        <li {...props} key="create-new" style={{ ...props.style, backgroundColor: 'rgba(25, 118, 210, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', p: 1 }}>
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
                fontSize: 18
              }}
            >
              +
            </Box>
            <Box>
              <Typography variant="body2" color="primary.main" fontWeight={600}>
                Create "{option.name}"
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {createOptionText}
              </Typography>
            </Box>
          </Box>
        </li>
      );
    }

    // Use custom renderOption if provided, otherwise default
    if (renderOption) {
      return renderOption(props, option, state);
    }

    return (
      <li {...props} key={option.id}>
        <Box>
          <Typography variant="body2">
            {option.name || option.title || option.firstName + ' ' + (option.lastName || '')}
          </Typography>
          {option.description && (
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  // Enhanced filterOptions that puts create option at top
  const enhancedFilterOptions = (options, params) => {
    let filtered;
    
    if (filterOptions) {
      filtered = filterOptions(options, params);
    } else {
      filtered = options;
    }

    // Move create option to top if it exists
    const createIndex = filtered.findIndex(option => option.isNew);
    if (createIndex > 0) {
      const createOption = filtered.splice(createIndex, 1)[0];
      filtered.unshift(createOption);
    }

    return filtered;
  };

  return (
    <Autocomplete
      {...autocompleteProps}
      renderOption={enhancedRenderOption}
      filterOptions={enhancedFilterOptions}
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
        },
        ...autocompleteProps.ListboxProps
      }}
    />
  );
}

EnhancedAutocomplete.propTypes = {
  renderOption: PropTypes.func,
  filterOptions: PropTypes.func,
  createOptionText: PropTypes.string,
};