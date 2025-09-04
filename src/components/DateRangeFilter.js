import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
  Typography,
  TextField,
  IconButton,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';

const DateRangeFilter = ({ dateRange, onDateRangeChange, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [displayValue, setDisplayValue] = useState('');

  // Date preset options
  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last Seven Days' },
    { value: 'last14days', label: 'Last Fourteen Days' },
    { value: 'last30days', label: 'Last Thirty Days' },
    { value: 'currentMonth', label: 'Current Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'currentYear', label: 'Current Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom' }
  ];

  // Calculate date ranges based on preset selection
  const calculateDateRange = (preset) => {
    const today = dayjs();
    
    switch (preset) {
      case 'today':
        return { start: today.startOf('day'), end: today.endOf('day') };
      case 'yesterday':
        const yesterday = today.subtract(1, 'day');
        return { start: yesterday.startOf('day'), end: yesterday.endOf('day') };
      case 'last7days':
        return { start: today.subtract(6, 'day').startOf('day'), end: today.endOf('day') };
      case 'last14days':
        return { start: today.subtract(13, 'day').startOf('day'), end: today.endOf('day') };
      case 'last30days':
        return { start: today.subtract(29, 'day').startOf('day'), end: today.endOf('day') };
      case 'currentMonth':
        return { start: today.startOf('month'), end: today.endOf('month') };
      case 'lastMonth':
        const lastMonth = today.subtract(1, 'month');
        return { start: lastMonth.startOf('month'), end: lastMonth.endOf('month') };
      case 'currentYear':
        return { start: today.startOf('year'), end: today.endOf('year') };
      case 'lastYear':
        const lastYear = today.subtract(1, 'year');
        return { start: lastYear.startOf('year'), end: lastYear.endOf('year') };
      default:
        return { start: null, end: null };
    }
  };

  // Handle preset selection
  const handlePresetChange = (event) => {
    const preset = event.target.value;
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setCustomStartDate(dateRange.start ? dayjs(dateRange.start) : null);
      setCustomEndDate(dateRange.end ? dayjs(dateRange.end) : null);
    } else if (preset) {
      const range = calculateDateRange(preset);
      onDateRangeChange({
        start: range.start?.toDate() || null,
        end: range.end?.toDate() || null
      });
    } else {
      onDateRangeChange({ start: null, end: null });
    }
  };

  // Handle custom date changes
  const handleCustomDateChange = (type, date) => {
    if (type === 'start') {
      setCustomStartDate(date);
      onDateRangeChange({
        start: date?.toDate() || null,
        end: customEndDate?.toDate() || dateRange.end
      });
    } else {
      setCustomEndDate(date);
      onDateRangeChange({
        start: customStartDate?.toDate() || dateRange.start,
        end: date?.toDate() || null
      });
    }
  };

  // Update display value when dateRange changes
  useEffect(() => {
    if (dateRange.start || dateRange.end) {
      const startStr = dateRange.start ? dayjs(dateRange.start).format('MMM D, YYYY') : '';
      const endStr = dateRange.end ? dayjs(dateRange.end).format('MMM D, YYYY') : '';
      
      if (startStr && endStr) {
        setDisplayValue(`${startStr} - ${endStr}`);
      } else if (startStr) {
        setDisplayValue(`From ${startStr}`);
      } else if (endStr) {
        setDisplayValue(`Until ${endStr}`);
      }
    } else {
      setDisplayValue('');
    }
  }, [dateRange]);

  // Detect current preset based on dateRange
  useEffect(() => {
    if (!dateRange.start && !dateRange.end) {
      setSelectedPreset('');
      return;
    }

    // Check if current range matches any preset
    for (const preset of datePresets) {
      if (preset.value !== 'custom') {
        const range = calculateDateRange(preset.value);
        if (range.start && range.end && dateRange.start && dateRange.end) {
          const rangeStartStr = range.start.format('YYYY-MM-DD');
          const rangeEndStr = range.end.format('YYYY-MM-DD');
          const currentStartStr = dayjs(dateRange.start).format('YYYY-MM-DD');
          const currentEndStr = dayjs(dateRange.end).format('YYYY-MM-DD');
          
          if (rangeStartStr === currentStartStr && rangeEndStr === currentEndStr) {
            setSelectedPreset(preset.value);
            return;
          }
        }
      }
    }
    
    // If no preset matches, it's a custom range
    setSelectedPreset('custom');
    setCustomStartDate(dateRange.start ? dayjs(dateRange.start) : null);
    setCustomEndDate(dateRange.end ? dayjs(dateRange.end) : null);
  }, [dateRange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1300,
          mt: 1,
          p: 3,
          minWidth: 400,
          maxWidth: 500,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 2
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Date Range
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Stack>

        {/* Display Current Selection */}
        {displayValue && (
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={displayValue}
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 500 }}
              onDelete={() => {
                setSelectedPreset('');
                onDateRangeChange({ start: null, end: null });
              }}
              deleteIcon={<CloseOutlined />}
            />
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Preset Options */}
        <RadioGroup value={selectedPreset} onChange={handlePresetChange}>
          <Grid container spacing={1}>
            {datePresets.map((preset) => (
              <Grid item xs={6} key={preset.value}>
                <FormControlLabel
                  value={preset.value}
                  control={<Radio size="small" />}
                  label={preset.label}
                  sx={{
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      fontWeight: selectedPreset === preset.value ? 600 : 400
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </RadioGroup>

        {/* Custom Date Range Inputs */}
        {selectedPreset === 'custom' && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Custom
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={(date) => handleCustomDateChange('start', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      placeholder: 'MM/DD/YYYY'
                    }
                  }}
                  maxDate={customEndDate || dayjs()}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={(date) => handleCustomDateChange('end', date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      placeholder: 'MM/DD/YYYY'
                    }
                  }}
                  minDate={customStartDate}
                  maxDate={dayjs()}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

// Main Date Range Filter Button Component
const DateRangeFilterButton = ({ dateRange, onDateRangeChange, sx, ...props }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  const getDisplayText = () => {
    if (dateRange.start || dateRange.end) {
      const startStr = dateRange.start ? dayjs(dateRange.start).format('MMM D') : '';
      const endStr = dateRange.end ? dayjs(dateRange.end).format('MMM D, YYYY') : '';
      
      if (startStr && endStr) {
        return `${startStr} - ${endStr}`;
      } else if (startStr) {
        return `From ${startStr}`;
      } else if (endStr) {
        return `Until ${endStr}`;
      }
    }
    return '';
  };

  const hasDateFilter = dateRange.start || dateRange.end;
  const displayText = getDisplayText();

  return (
    <Box sx={{ position: 'relative', ...sx }} {...props}>
      <TextField
        fullWidth
        size="medium"
        label="Date Range"
        value={displayText}
        onClick={handleClick}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton size="small" onClick={handleClick}>
              <CalendarOutlined />
            </IconButton>
          ),
          style: { cursor: 'pointer' }
        }}
        InputLabelProps={{
          style: { fontWeight: 500 }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            cursor: 'pointer',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            }
          },
          '& .MuiInputBase-input': {
            cursor: 'pointer',
            fontSize: hasDateFilter ? '0.875rem' : '0.875rem'
          }
        }}
      />
      
      {open && (
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          onClose={handleClose}
        />
      )}
    </Box>
  );
};

export default DateRangeFilterButton;
export { DateRangeFilter };