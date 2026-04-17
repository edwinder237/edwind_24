import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  Skeleton,
  Chip,
  Stack
} from '@mui/material';

// project imports
import axios from 'utils/axios';

// ==============================|| AUTOCOMPLETE - CURRICULUM ||============================== //

export default function CurriculumPicker({
  handleCurriculumChange,
  initialValue = null,
  error = false,
  helperText = '',
  projectTitle = ''
}) {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState(initialValue);

  // Fetch curriculums on component mount
  useEffect(() => {
    const fetchCurriculumsData = async () => {
      setLoading(true);
      try {
        // Fetch all curriculums first
        const response = await axios.get('/api/curriculums/fetchCurriculums');
        let curriculumsList = response.data;

        // Check if there's already a default curriculum
        const hasDefault = curriculumsList.some(c => c.isDefault);

        // Only create a default if none exists
        if (!hasDefault) {
          await axios.post('/api/curriculums/ensureDefault');
          // Re-fetch to get the updated list with the new default
          const updatedResponse = await axios.get('/api/curriculums/fetchCurriculums');
          curriculumsList = updatedResponse.data;
        }

        // Add group labels: default → "Suggested", next 3 → "Recent", rest → "All Curriculums"
        let recentCount = 0;
        const grouped = curriculumsList.map(c => {
          if (c.isDefault) return { ...c, group: 'Suggested' };
          if (recentCount < 3) { recentCount++; return { ...c, group: 'Recent' }; }
          return { ...c, group: 'All Curriculums' };
        });

        setCurriculums(grouped);

        // Auto-select the default curriculum if no initial value was provided
        if (!initialValue && curriculumsList.length > 0) {
          const defaultCurriculum = curriculumsList.find(c => c.isDefault);
          if (defaultCurriculum) {
            setSelectedCurriculum(defaultCurriculum);
            handleCurriculumChange(defaultCurriculum);
          }
        }
      } catch (error) {
        console.error('Error fetching curriculums:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculumsData();
  }, []);

  const handleChange = (event, value) => {
    setSelectedCurriculum(value);
    handleCurriculumChange(value);
  };

  if (loading) {
    return (
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={52} animation="wave" sx={{ borderRadius: 1 }} />
        <Stack spacing={0.75} sx={{ px: 1 }}>
          {[80, 65, 50].map((width, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton animation="wave" height={20} width={width} />
                {i === 0 && <Skeleton animation="wave" height={20} width={48} sx={{ borderRadius: 3 }} />}
              </Box>
              <Skeleton animation="wave" height={22} width={72} sx={{ borderRadius: 3 }} />
            </Box>
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Autocomplete
      id="curriculum-autocomplete"
      options={curriculums}
      groupBy={(option) => option.group}
      value={selectedCurriculum}
      onChange={handleChange}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        // Show project-specific name for the default curriculum
        if (option?.isDefault && projectTitle) {
          return `${projectTitle} - Curriculum`;
        }
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
        const { key, ...otherProps } = props;
        return (
          <li key={key} {...otherProps}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {option.title}
                  </Typography>
                  {option.isDefault && (
                    <Chip
                      label="Default"
                      size="small"
                      color="info"
                      variant="filled"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
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
          }}
        />
      )}
    />
  );
}

CurriculumPicker.propTypes = {
  handleCurriculumChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  projectTitle: PropTypes.string
};