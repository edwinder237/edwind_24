import React, { useState } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField
} from '@mui/material';
import {
  Search as SearchIcon,
  Support as SupportIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const SupportActivitySelector = ({
  currentValue,
  options,
  onSelectionChange,
  placeholder = "Search support activities...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event, newValue) => {
    if (newValue && onSelectionChange) {
      onSelectionChange(newValue);
    }
    setIsOpen(false);
  };

  const renderCurrentValue = () => {
    if (!currentValue) {
      return (
        <Box 
          sx={{ 
            p: 1.5, 
            border: '1px dashed', 
            borderColor: 'divider', 
            borderRadius: 1,
            bgcolor: 'action.hover',
            cursor: disabled ? 'default' : 'pointer',
            '&:hover': !disabled && {
              borderColor: 'primary.main'
            }
          }}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Click to select support activity
          </Typography>
        </Box>
      );
    }

    return (
      <Box 
        sx={{ 
          p: 1.5, 
          border: '1px solid', 
          borderColor: 'warning.main', 
          borderRadius: 1,
          bgcolor: 'warning.50',
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': !disabled && {
            borderColor: 'warning.dark'
          }
        }}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
            {currentValue.courseTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', ml: 3 }}>
            → {currentValue.activityTitle}
          </Typography>
        </Box>
        {!disabled && <EditIcon sx={{ fontSize: '16px', color: 'action.active', flexShrink: 0 }} />}
      </Box>
    );
  };

  const renderOption = (props, option) => (
    <Box 
      component="li" 
      {...props} 
      key={option.id}
      sx={{ 
        py: 2, 
        px: 2,
        '&:hover': {
          bgcolor: 'action.hover'
        },
        '&[aria-selected="true"]': {
          bgcolor: 'warning.50'
        }
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SupportIcon sx={{ fontSize: '16px', color: 'warning.main', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
            {option.courseTitle}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary', 
            fontSize: '0.8rem',
            lineHeight: 1.3
          }}>
            → {option.activityTitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const filterOptions = (options, { inputValue }) => {
    return options.filter(option =>
      option.searchText.includes(inputValue.toLowerCase())
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {renderCurrentValue()}
      
      {isOpen && !disabled && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          boxShadow: 3,
          borderRadius: 1,
          bgcolor: 'background.paper'
        }}>
          <Autocomplete
            open={true}
            onClose={() => setIsOpen(false)}
            size="small"
            value={currentValue}
            onChange={handleChange}
            options={options}
            getOptionLabel={(option) => `${option.courseTitle} → ${option.activityTitle}`}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            filterOptions={filterOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={placeholder}
                size="small"
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <SearchIcon sx={{ 
                      fontSize: '18px', 
                      color: 'action.active', 
                      mr: 1 
                    }} />
                  )
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px 6px 0 0',
                    paddingLeft: '12px'
                  }
                }}
              />
            )}
            renderOption={renderOption}
            groupBy={(option) => option.courseTitle}
            ListboxProps={{ 
              style: { 
                maxHeight: '400px',
                padding: 0
              }
            }}
            clearOnEscape
            selectOnFocus
            handleHomeEndKeys
            freeSolo={false}
            noOptionsText="No support activities found"
          />
        </Box>
      )}
    </Box>
  );
};

export default SupportActivitySelector;