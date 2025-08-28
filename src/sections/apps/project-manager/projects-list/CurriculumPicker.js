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

// ==============================|| AUTOCOMPLETE - CURRICULUM ||============================== //

export default function CurriculumPicker({ 
  handleCurriculumChange, 
  initialValue = null,
  error = false,
  helperText = ''
}) {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(initialValue);

  // Fetch curriculums on component mount
  useEffect(() => {
    const fetchCurriculums = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/curriculums/fetchCurriculums');
        setCurriculums(response.data);
      } catch (error) {
        console.error('Error fetching curriculums:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculums();
  }, []);

  const handleChange = (event, value) => {
    setSelectedCurriculum(value);
    handleCurriculumChange(value);
  };

  return (
    <Autocomplete
      id="curriculum-autocomplete"
      options={curriculums}
      value={selectedCurriculum}
      onChange={handleChange}
      getOptionLabel={(option) => {
        // Handle string inputs (when user types)
        if (typeof option === 'string') {
          return option;
        }
        // Handle object options (existing curriculums)
        return option?.title || '';
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.id === value.id;
      }}
      filterOptions={(options, params) => {
        const filtered = options.filter(option =>
          option.title.toLowerCase().includes(params.inputValue.toLowerCase())
        );
        return filtered;
      }}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  {option.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {option.courseCount > 0 && (
                    <Chip 
                      label={`${option.courseCount} courses`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )}
                  {option.supportActivitiesCount > 0 && (
                    <Chip 
                      label={`${option.supportActivitiesCount} activities`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select a curriculum"
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

CurriculumPicker.propTypes = {
  handleCurriculumChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
  error: PropTypes.bool,
  helperText: PropTypes.string
};