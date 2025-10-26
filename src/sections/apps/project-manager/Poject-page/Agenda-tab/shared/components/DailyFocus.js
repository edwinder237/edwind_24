import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack
} from '@mui/material';
import { Edit, Save, Cancel, Delete } from '@mui/icons-material';
import { useSelector } from 'store';
import MainCard from 'components/MainCard';

const DailyFocus = React.memo(({ selectedDate }) => {
  const { singleProject: Project } = useSelector((state) => state.projects);
  const [focus, setFocus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cache to store fetched focus data
  const focusCache = useRef(new Map());
  const MAX_CACHE_SIZE = 50; // Limit cache size to prevent memory issues
  
  // Memoize cache key generation
  const cacheKey = useMemo(() => {
    if (!Project?.id || !selectedDate) return null;
    return `${Project.id}_${selectedDate.toISOString().split('T')[0]}`;
  }, [Project?.id, selectedDate]);
  
  // Cache management - remove oldest entries when cache gets too large
  const manageCacheSize = () => {
    if (focusCache.current.size > MAX_CACHE_SIZE) {
      const keysToDelete = [];
      let count = 0;
      for (const key of focusCache.current.keys()) {
        if (count >= 10) break; // Remove oldest 10 entries
        keysToDelete.push(key);
        count++;
      }
      keysToDelete.forEach(key => focusCache.current.delete(key));
    }
  };

  useEffect(() => {
    if (selectedDate && Project?.id) {
      fetchDailyFocus();
    }
  }, [selectedDate, Project?.id]);

  const fetchDailyFocus = async () => {
    if (!selectedDate || !Project?.id) return;
    
    if (!cacheKey) return;
    
    // Check cache first
    if (focusCache.current.has(cacheKey)) {
      const cachedData = focusCache.current.get(cacheKey);
      setFocus(cachedData?.focus || '');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/projects/daily-focus?projectId=${Project.id}&date=${selectedDate.toISOString().split('T')[0]}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const focusText = data?.focus || '';
        
        // Cache the fetched data
        manageCacheSize();
        focusCache.current.set(cacheKey, { focus: focusText });
        setFocus(focusText);
      } else if (response.status === 404) {
        // Cache empty result for 404 (no focus set)
        manageCacheSize();
        focusCache.current.set(cacheKey, { focus: '' });
        setFocus('');
      } else {
        setError('Failed to fetch daily focus');
      }
    } catch (err) {
      setError('Error loading daily focus');
      console.error('Error fetching daily focus:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveFocus = async () => {
    if (!selectedDate || !Project?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/projects/daily-focus?projectId=${Project.id}&date=${selectedDate.toISOString().split('T')[0]}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ focus: focus.trim() }),
        }
      );

      if (response.ok) {
        setIsEditing(false);
        
        // Update cache with new data
        if (cacheKey) {
          focusCache.current.set(cacheKey, { focus: focus.trim() });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save focus');
      }
    } catch (err) {
      setError('Error saving focus');
      console.error('Error saving daily focus:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFocus = async () => {
    if (!selectedDate || !Project?.id || !focus) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/projects/daily-focus?projectId=${Project.id}&date=${selectedDate.toISOString().split('T')[0]}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setFocus('');
        setIsEditing(false);
        
        // Update cache to reflect deletion
        if (cacheKey) {
          focusCache.current.set(cacheKey, { focus: '' });
        }
      } else {
        setError('Failed to delete focus');
      }
    } catch (err) {
      setError('Error deleting focus');
      console.error('Error deleting daily focus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    
    // Reset to cached value instead of making API call
    if (selectedDate && Project?.id) {
      if (cacheKey && focusCache.current.has(cacheKey)) {
        const cachedData = focusCache.current.get(cacheKey);
        setFocus(cachedData?.focus || '');
      } else {
        // Only fetch if not in cache
        fetchDailyFocus();
      }
    }
  };

  if (!selectedDate) {
    return (
      <MainCard title="Focus of the Day">
        <Typography variant="body2" color="text.secondary">
          Select a date to set the daily focus
        </Typography>
      </MainCard>
    );
  }

  return (
    <MainCard 
      title="Focus of the Day"
      secondary={
        <Chip 
          label={selectedDate.toLocaleDateString()} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      }
    >

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="What's the main focus for this day?"
              inputProps={{ maxLength: 500 }}
              helperText={`${focus.length}/500 characters`}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                startIcon={<Save />}
                variant="contained"
                onClick={saveFocus}
                disabled={loading || focus.trim().length === 0}
              >
                Save
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box>
            {focus ? (
              <>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {focus}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton onClick={deleteFocus} color="error" disabled={loading}>
                    <Delete />
                  </IconButton>
                  <IconButton onClick={handleEdit} color="primary" disabled={loading}>
                    <Edit />
                  </IconButton>
                </Stack>
              </>
            ) : (
              <Box textAlign="center" py={2}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No focus set for this day
                </Typography>
                <Button
                  startIcon={<Edit />}
                  variant="outlined"
                  onClick={handleEdit}
                  disabled={loading}
                >
                  Set Daily Focus
                </Button>
              </Box>
            )}
          </Box>
        )}
    </MainCard>
  );
});

export default DailyFocus;