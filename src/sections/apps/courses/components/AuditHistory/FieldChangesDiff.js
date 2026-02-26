import React from 'react';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Field display names
const fieldLabels = {
  title: 'Title',
  summary: 'Summary',
  language: 'Language',
  deliveryMethod: 'Delivery Method',
  level: 'Level',
  courseCategory: 'Category',
  courseStatus: 'Status',
  CourseType: 'Course Type',
  targetAudience: 'Target Audience',
  maxParticipants: 'Max Participants',
  code: 'Code',
  version: 'Version',
  published: 'Published',
  content: 'Content',
  JSONContent: 'Content (JSON)',
  customDuration: 'Duration',
  moduleStatus: 'Status',
  moduleOrder: 'Order',
  activityType: 'Activity Type',
  activityStatus: 'Status',
  contentUrl: 'Content URL',
  duration: 'Duration',
};

// Format value for display
const formatValue = (value) => {
  if (value === null || value === undefined) return <em style={{ color: '#999' }}>empty</em>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    } catch {
      return '[Object]';
    }
  }
  if (typeof value === 'string' && value.length > 200) {
    return value.substring(0, 200) + '...';
  }
  return String(value);
};

const FieldChangesDiff = ({ changes }) => {
  if (!changes || Object.keys(changes).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No changes recorded
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {Object.entries(changes).map(([field, change]) => {
        const label = fieldLabels[field] || field;
        const fromValue = change.from;
        const toValue = change.to;
        const isAdded = fromValue === null || fromValue === undefined || fromValue === '';
        const isRemoved = toValue === null || toValue === undefined || toValue === '';

        return (
          <Paper
            key={field}
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
              <Chip
                label={label}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, height: 24 }}
              />
              {isAdded && (
                <Chip
                  icon={<AddIcon sx={{ fontSize: '0.875rem !important' }} />}
                  label="Added"
                  size="small"
                  color="success"
                  sx={{ height: 20 }}
                />
              )}
              {isRemoved && (
                <Chip
                  icon={<RemoveIcon sx={{ fontSize: '0.875rem !important' }} />}
                  label="Removed"
                  size="small"
                  color="error"
                  sx={{ height: 20 }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {/* From Value */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 100,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: isAdded ? 'transparent' : 'error.lighter',
                  border: '1px solid',
                  borderColor: isAdded ? 'transparent' : 'error.light',
                }}
              >
                {!isAdded && (
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      color: 'error.dark',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatValue(fromValue)}
                  </Typography>
                )}
              </Box>

              {/* Arrow */}
              {!isAdded && !isRemoved && (
                <ArrowIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
              )}

              {/* To Value */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 100,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: isRemoved ? 'transparent' : 'success.lighter',
                  border: '1px solid',
                  borderColor: isRemoved ? 'transparent' : 'success.light',
                }}
              >
                {!isRemoved && (
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      color: 'success.dark',
                    }}
                  >
                    {formatValue(toValue)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default FieldChangesDiff;
