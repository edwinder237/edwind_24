import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Chip,
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  createFilterOptions,
} from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { participantCommands } from 'store/commands';
import { Add } from '@mui/icons-material';

const filter = createFilterOptions();

const TagSelectorCell = ({ value, row }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dispatch = useDispatch();
  const projectId = useSelector(state => state.projectSettings?.projectId);
  const participants = useSelector(selectAllParticipants);
  const inputRef = useRef(null);

  const participantId = row.original.participant?.id;
  const currentTag = value || '';

  // Collect unique tags from all participants
  const existingTags = useMemo(() => {
    const tags = new Set();
    participants.forEach(p => {
      const tag = p.participant?.tag || p.tag;
      if (tag && tag.trim()) tags.add(tag.trim());
    });
    return Array.from(tags).sort();
  }, [participants]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleChange = async (event, newValue) => {
    if (!participantId) return;

    // newValue can be a string (typed) or an object with inputValue (create new)
    let tagValue = '';
    if (typeof newValue === 'string') {
      tagValue = newValue;
    } else if (newValue && newValue.inputValue) {
      tagValue = newValue.inputValue;
    } else if (newValue) {
      tagValue = newValue;
    }

    setUpdating(true);
    setOpen(false);
    try {
      await dispatch(participantCommands.updateParticipant({
        participantId,
        updates: { tag: tagValue },
        projectId
      }));
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (updating) {
    return <CircularProgress size={16} />;
  }

  if (!open) {
    return currentTag ? (
      <Chip
        label={currentTag}
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          fontWeight: 500,
          fontSize: '0.75rem',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
        }}
      />
    ) : (
      <Chip
        label="+ Tag"
        size="small"
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{
          borderStyle: 'dashed',
          color: 'text.secondary',
          fontSize: '0.7rem',
          cursor: 'pointer',
          opacity: 0.6,
          '&:hover': { opacity: 1, borderColor: 'primary.main', color: 'primary.main' }
        }}
      />
    );
  }

  return (
    <Autocomplete
      open
      size="small"
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      value={currentTag || null}
      onChange={handleChange}
      onClose={() => setOpen(false)}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        const isExisting = options.some(opt => opt === inputValue);
        if (inputValue !== '' && !isExisting) {
          filtered.push({ inputValue, label: `Create "${inputValue}"` });
        }
        return filtered;
      }}
      options={existingTags}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        if (option.inputValue) return option.inputValue;
        return option.label || '';
      }}
      renderOption={(props, option) => {
        if (typeof option === 'object' && option.inputValue) {
          return (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Add sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" color="primary.main" fontWeight={500}>
                {option.label}
              </Typography>
            </Box>
          );
        }
        return (
          <Box component="li" {...props}>
            <Chip
              label={option}
              size="small"
              sx={{
                bgcolor: 'primary.lighter',
                color: 'primary.dark',
                fontSize: '0.7rem',
                height: 22,
              }}
            />
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder="Search or create..."
          variant="standard"
          sx={{
            minWidth: 140,
            '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 }
          }}
        />
      )}
      sx={{
        '& .MuiAutocomplete-listbox': { maxHeight: 200 }
      }}
    />
  );
};

export default TagSelectorCell;
