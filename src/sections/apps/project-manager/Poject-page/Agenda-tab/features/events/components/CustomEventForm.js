import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ArrowLeftOutlined, DownOutlined } from '@ant-design/icons';
import CustomEventIconPicker, { DEFAULT_CATEGORY_ICONS } from './CustomEventIconPicker';
import { CUSTOM_EVENT_CATEGORIES, CUSTOM_EVENT_DURATIONS } from '../../../utils/constants';
import { APP_COLOR_OPTIONS } from 'constants/eventColors';

const CustomEventForm = ({ onSubmit, onCancel, isSubmitting, theme }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Break',
    duration: 60,
    icon: DEFAULT_CATEGORY_ICONS['Break'],
    color: null
  });
  const [errors, setErrors] = useState({});

  // Update icon when category changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      icon: DEFAULT_CATEGORY_ICONS[prev.category] || DEFAULT_CATEGORY_ICONS.Other
    }));
  }, [formData.category]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleColorSelect = (colorValue) => {
    setFormData(prev => ({
      ...prev,
      color: prev.color === colorValue ? null : colorValue
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const getTextColor = (colorValue) => {
    const colorOption = APP_COLOR_OPTIONS.find(c => c.value === colorValue);
    return colorOption?.textColor || '#ffffff';
  };

  return (
    <Box>
      {/* Header with back button */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          onClick={onCancel}
          size="small"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              bgcolor: theme.palette.action.hover
            }
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 16 }} />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600}>
          Create Custom Event
        </Typography>
      </Stack>

      {/* Form fields */}
      <Stack spacing={2.5}>
        {/* Title */}
        <TextField
          label="Event Title"
          value={formData.title}
          onChange={handleChange('title')}
          error={!!errors.title}
          helperText={errors.title}
          required
          fullWidth
          placeholder="Enter event title..."
          inputProps={{ maxLength: 100 }}
          size="small"
        />

        {/* Description */}
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          error={!!errors.description}
          helperText={errors.description || `${formData.description.length}/500`}
          multiline
          rows={2}
          fullWidth
          placeholder="Add a description (optional)..."
          inputProps={{ maxLength: 500 }}
          size="small"
        />

        {/* Category and Duration row */}
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ flex: 1 }} size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={handleChange('category')}
              label="Category"
            >
              {CUSTOM_EVENT_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ width: 130 }} size="small">
            <InputLabel>Duration</InputLabel>
            <Select
              value={formData.duration}
              onChange={handleChange('duration')}
              label="Duration"
            >
              {CUSTOM_EVENT_DURATIONS.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Icon Picker */}
        <CustomEventIconPicker
          selectedIcon={formData.icon}
          category={formData.category}
          onSelect={handleIconSelect}
        />

        {/* Color Picker (collapsible) */}
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 }
          }}
        >
          <AccordionSummary
            expandIcon={<DownOutlined style={{ fontSize: 12 }} />}
            sx={{
              minHeight: 44,
              '&.Mui-expanded': { minHeight: 44 },
              '& .MuiAccordionSummary-content': { margin: '8px 0' }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">
                Custom Color
              </Typography>
              {formData.color && (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    bgcolor: formData.color,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                />
              )}
              {!formData.color && (
                <Typography variant="caption" color="text.secondary">
                  (Optional)
                </Typography>
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {APP_COLOR_OPTIONS.map(({ name, value }) => (
                <Box
                  key={name}
                  onClick={() => handleColorSelect(value)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: value,
                    cursor: 'pointer',
                    border: formData.color === value
                      ? `3px solid ${theme.palette.mode === 'dark' ? '#fff' : '#000'}`
                      : `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: theme.shadows[3]
                    }
                  }}
                  title={name}
                />
              ))}
            </Box>
            {formData.color && (
              <Button
                size="small"
                onClick={() => handleColorSelect(null)}
                sx={{ mt: 1 }}
              >
                Use Default Color
              </Button>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Action buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.title.trim() || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </Stack>
    </Box>
  );
};

CustomEventForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  theme: PropTypes.object.isRequired
};

CustomEventForm.defaultProps = {
  isSubmitting: false
};

export default CustomEventForm;
