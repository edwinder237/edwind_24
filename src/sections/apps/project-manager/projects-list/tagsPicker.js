import { useState, useEffect } from 'react';

// material-ui
import { Autocomplete, Checkbox, TextField, Chip, Box, Typography, CircularProgress } from '@mui/material';

// ==============================|| AUTOCOMPLETE - CHECKBOXES ||============================== //

export default function TagsPicker({ handleTagsChange, initialValue = [] }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Load topics from database
  useEffect(() => {
    fetchTopics();
  }, []);

  // Set initial value if provided (for editing existing projects)
  useEffect(() => {
    if (initialValue && initialValue.length > 0 && topics.length > 0) {
      // If initialValue is a JSON string, parse it
      let parsedValue = initialValue;
      if (typeof initialValue === 'string') {
        try {
          parsedValue = JSON.parse(initialValue);
        } catch (error) {
          console.warn('Failed to parse initial topics value:', error);
          parsedValue = [];
        }
      }
      
      // Find matching topics from the database
      const matchingTopics = topics.filter(topic => 
        parsedValue.some(val => 
          (typeof val === 'string' && val === topic.title) ||
          (typeof val === 'object' && val.label === topic.title)
        )
      );
      setSelectedTopics(matchingTopics);
    }
  }, [initialValue, topics]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/topics');
      if (response.ok) {
        const data = await response.json();
        // Transform topics to match expected format
        const transformedTopics = data.map(topic => ({
          id: topic.id,
          label: topic.title,
          title: topic.title,
          description: topic.description,
          color: topic.color,
          icon: topic.icon
        }));
        setTopics(transformedTopics);
      } else {
        console.error('Failed to load topics');
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating new topic
  const handleCreateNewTopic = async (inputValue) => {
    if (!inputValue.trim()) return null;

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: inputValue.trim().toUpperCase(),
          description: null,
          color: null,
          icon: null
        }),
      });

      if (response.ok) {
        const newTopic = await response.json();
        
        // Transform to match expected format
        const transformedTopic = {
          id: newTopic.id,
          label: newTopic.title,
          title: newTopic.title,
          description: newTopic.description,
          color: newTopic.color,
          icon: newTopic.icon
        };
        
        // Add to the topics list
        setTopics(prev => [...prev, transformedTopic]);
        
        return transformedTopic;
      } else {
        const errorData = await response.json();
        console.error('Failed to create topic:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
    }
    return null;
  };

  const handleChange = async (event, value) => {
    // Handle creating new topics
    const processedValue = [];
    
    for (const item of value) {
      if (item && item.isNew) {
        // Create new topic
        const newTopic = await handleCreateNewTopic(item.title);
        if (newTopic) {
          processedValue.push(newTopic);
        }
      } else if (item) {
        // Existing topic
        processedValue.push(item);
      }
    }
    
    setSelectedTopics(processedValue);
    handleTagsChange(processedValue);
  };

  return (
    <Autocomplete
      multiple
      id="topics-picker"
      options={topics}
      loading={loading}
      value={selectedTopics}
      disableCloseOnSelect
      getOptionLabel={(option) => {
        // Handle string inputs (when user types)
        if (typeof option === 'string') {
          return option.toUpperCase();
        }
        // Handle object options (existing topics)
        return (option?.label || option?.title || '').toUpperCase();
      }}
      onChange={handleChange}
      filterOptions={(options, params) => {
        const { inputValue } = params;
        
        // If no input, return all options
        if (!inputValue || inputValue.trim() === '') {
          return options;
        }

        // Filter existing options based on input
        const filtered = options.filter(option =>
          option.title.toLowerCase().includes(inputValue.toLowerCase())
        );

        // Check if exact match exists
        const isExisting = options.some((option) => 
          inputValue.toLowerCase() === option.title.toLowerCase()
        );
        
        // Add "Create" option if input doesn't match any existing option
        if (!isExisting && inputValue.trim().length > 0) {
          filtered.push({
            id: 'create-new',
            title: inputValue.trim().toUpperCase(),
            label: inputValue.trim().toUpperCase(),
            isNew: true
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      freeSolo
      filterSelectedOptions
      renderOption={(props, option, { selected }) => {
        if (option.isNew) {
          return (
            <li {...props}>
              <Checkbox 
                style={{ marginRight: 8 }} 
                checked={false}
              />
              <Box>
                <Typography variant="body2" color="primary">
                  Create "<span style={{ textTransform: 'uppercase' }}>{option.title}</span>"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add new topic
                </Typography>
              </Box>
            </li>
          );
        }

        return (
          <li {...props}>
            <Checkbox 
              id={`topic-${option.id}`} 
              style={{ marginRight: 8 }} 
              checked={selected} 
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option.icon && (
                <span style={{ fontSize: '14px' }}>{option.icon}</span>
              )}
              <Box>
                <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                  {option.label}
                </Typography>
                {option.description && (
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {option.icon && (
                  <span style={{ fontSize: '12px' }}>{option.icon}</span>
                )}
                <span style={{ textTransform: 'uppercase' }}>{option.label}</span>
              </Box>
            }
            sx={{
              bgcolor: option.color ? `${option.color}20` : 'primary.lighter',
              border: '1px solid',
              borderColor: option.color || 'primary.light',
              color: option.color || 'primary.main',
              '& .MuiSvgIcon-root': {
                color: option.color || 'primary.main',
                '&:hover': {
                  color: option.color || 'primary.dark'
                }
              }
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField 
          {...params} 
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
            style: { textTransform: 'uppercase' },
            onChange: (e) => {
              // Convert input to uppercase in real-time
              e.target.value = e.target.value.toUpperCase();
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
        }
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.id === value.id;
      }}
    />
  );
}
