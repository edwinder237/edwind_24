import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';

const entityTypeOptions = [
  { value: '', label: 'All Entities' },
  { value: 'course', label: 'Course' },
  { value: 'module', label: 'Modules' },
  { value: 'activity', label: 'Activities' },
  { value: 'event', label: 'Events' },
];

const actionTypeOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'publish', label: 'Published' },
  { value: 'delivery_started', label: 'Delivery Started' },
];

const AuditLogFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters =
    filters.entityType || filters.actionType || filters.startDate || filters.endDate;

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
        {/* Entity Type Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select
            value={filters.entityType || ''}
            label="Entity Type"
            onChange={(e) => handleChange('entityType', e.target.value)}
          >
            {entityTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Type Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={filters.actionType || ''}
            label="Action"
            onChange={(e) => handleChange('actionType', e.target.value)}
          >
            {actionTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range */}
        <TextField
          size="small"
          type="date"
          label="From Date"
          value={filters.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          type="date"
          label="To Date"
          value={filters.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{ minWidth: 100 }}
          >
            Clear
          </Button>
        )}
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <FilterIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          {filters.entityType && (
            <Chip
              label={`Entity: ${entityTypeOptions.find((o) => o.value === filters.entityType)?.label}`}
              size="small"
              onDelete={() => handleChange('entityType', '')}
            />
          )}
          {filters.actionType && (
            <Chip
              label={`Action: ${actionTypeOptions.find((o) => o.value === filters.actionType)?.label}`}
              size="small"
              onDelete={() => handleChange('actionType', '')}
            />
          )}
          {filters.startDate && (
            <Chip
              label={`From: ${filters.startDate}`}
              size="small"
              onDelete={() => handleChange('startDate', '')}
            />
          )}
          {filters.endDate && (
            <Chip
              label={`To: ${filters.endDate}`}
              size="small"
              onDelete={() => handleChange('endDate', '')}
            />
          )}
        </Stack>
      )}
    </Box>
  );
};

export default AuditLogFilters;
