import { useState, useEffect } from 'react';

// material-ui
import { 
  Autocomplete, 
  TextField, 
  Chip, 
  Box, 
  Typography, 
  CircularProgress, 
  Stack,
  createFilterOptions 
} from '@mui/material';

// assets
import { CloseOutlined } from '@ant-design/icons';

// ==============================|| TOPICS PICKER WITH SUGGESTIONS ||============================== //

const filter = createFilterOptions();

export default function TagsPicker({ handleTagsChange, initialValue = [] }) {
  // Ensure initialValue is always an array of strings
  const sanitizedInitialValue = (() => {
    if (!initialValue) return [];
    
    // If it's a JSON string, parse it
    let parsed = initialValue;
    if (typeof initialValue === 'string') {
      try {
        parsed = JSON.parse(initialValue);
      } catch (error) {
        return [];
      }
    }
    
    // Convert to string array
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.title || item.label || '';
        }
        return '';
      }).filter(Boolean);
    }
    
    return [];
  })();
  
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Load topics from database
  useEffect(() => {
    fetchTopics();
  }, []);

  // Set initial value if provided (for editing existing projects)
  useEffect(() => {
    if (sanitizedInitialValue.length > 0) {
      setSelectedTopics(sanitizedInitialValue);
      handleTagsChange(sanitizedInitialValue);
    } else {
      setSelectedTopics([]);
    }
  }, [sanitizedInitialValue]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/topics');
      if (response.ok) {
        const data = await response.json();
        // Transform topics to match expected format - convert to string array
        const topicTitles = data.map(topic => topic.title).filter(Boolean);
        setTopics(topicTitles);
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
        const topicTitle = newTopic.title;
        
        // Add to the topics list
        setTopics(prev => [...prev, topicTitle]);
        
        return topicTitle;
      } else {
        const errorData = await response.json();
        console.error('Failed to create topic:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
    }
    return null;
  };

  const handleChange = async (event, newValue) => {
    // Process new values to handle creation of new topics
    const processedValue = [];
    
    for (const item of newValue) {
      if (typeof item === 'string') {
        // Check if it's a new topic (not in existing topics list)
        if (!topics.includes(item)) {
          const newTopic = await handleCreateNewTopic(item);
          if (newTopic) {
            processedValue.push(newTopic);
          }
        } else {
          processedValue.push(item);
        }
      }
    }
    
    setSelectedTopics(processedValue);
    handleTagsChange(processedValue);
  };

  // Handle clicking on suggestion chips
  const handleSuggestionClick = (topic) => {
    if (!selectedTopics.includes(topic)) {
      const newSelection = [...selectedTopics, topic];
      setSelectedTopics(newSelection);
      handleTagsChange(newSelection);
    }
  };

  // Filter out already selected topics from suggestions
  const availableSuggestions = topics
    .filter(topic => !selectedTopics.includes(topic))
    .slice(0, 8); // Show max 8 suggestions

  return (
    <Box>
      <Autocomplete
        multiple
        id="topics-picker"
        options={topics}
        loading={loading}
        value={selectedTopics}
        freeSolo
        autoHighlight
        disableCloseOnSelect
        onChange={handleChange}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          const { inputValue } = params;
          const isExisting = options.some((option) => inputValue === option);
          if (inputValue !== '' && !isExisting) {
            filtered.push(inputValue);
          }
          return filtered;
        }}
        getOptionLabel={(option) => option}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              {!topics.includes(option) ? `Add "${option}"` : option}
            </Box>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key || index}
                {...tagProps}
                variant="combined"
                color="primary"
                label={
                  <Typography variant="caption" color="primary.dark">
                    {option.toUpperCase()}
                  </Typography>
                }
                deleteIcon={<CloseOutlined style={{ fontSize: '0.875rem' }} />}
                size="small"
                sx={{
                  bgcolor: 'primary.lighter',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark'
                    }
                  }
                }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Add topics for your project"
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
          }
        }}
      />
      
      {/* Clickable Suggestions */}
      {availableSuggestions.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            Suggestions:
          </Typography>
          {availableSuggestions.map((topic, index) => (
            <Chip
              key={index}
              variant="outlined"
              onClick={() => handleSuggestionClick(topic)}
              label={<Typography variant="caption">{topic}</Typography>}
              size="small"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'primary.lighter',
                  borderColor: 'primary.main'
                }
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
