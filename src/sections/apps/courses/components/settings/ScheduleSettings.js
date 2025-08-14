import React from 'react';
import {
  Stack,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Schedule as ScheduleIcon,
  Launch as LaunchIcon,
  AccessTime as DeadlineIcon,
} from '@mui/icons-material';

const ScheduleSettings = ({ formData, onInputChange }) => {
  const hasGoLiveDate = formData.goLiveDate;
  const hasDeadline = formData.deadline;
  const isScheduled = hasGoLiveDate || hasDeadline;
  
  // Check if go live date is in the future
  const goLiveDateInFuture = hasGoLiveDate && new Date(formData.goLiveDate) > new Date();
  
  // Check if deadline is after go live date
  const deadlineAfterGoLive = hasGoLiveDate && hasDeadline && 
    new Date(formData.deadline) > new Date(formData.goLiveDate);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ScheduleIcon color="primary" />
        Course Schedule
      </Typography>
      <Stack spacing={3}>
          {/* Go Live Date */}
          <Box>
            <DatePicker
              label="Go Live Date"
              value={formData.goLiveDate}
              onChange={(date) => onInputChange('goLiveDate', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: hasGoLiveDate 
                    ? `Course becomes available on ${formatDate(formData.goLiveDate)}`
                    : "When should this course become available to learners?",
                  InputProps: {
                    startAdornment: <LaunchIcon sx={{ mr: 1, color: 'action.active' }} />
                  }
                }
              }}
            />
          </Box>

          {/* Enrollment Deadline */}
          <Box>
            <DatePicker
              label="Enrollment Deadline"
              value={formData.deadline}
              onChange={(date) => onInputChange('deadline', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: hasDeadline 
                    ? `Last enrollment date: ${formatDate(formData.deadline)}`
                    : "Optional: Set a cutoff date for new enrollments",
                  InputProps: {
                    startAdornment: <DeadlineIcon sx={{ mr: 1, color: 'action.active' }} />
                  }
                }
              }}
            />
          </Box>

          {/* Schedule Status */}
          {!isScheduled && (
            <Alert severity="info" variant="outlined">
              <Typography variant="body2">
                <strong>No Schedule Set</strong><br/>
                Course will be immediately available when published.
              </Typography>
            </Alert>
          )}

          {hasGoLiveDate && !hasDeadline && (
            <Alert severity="success" variant="outlined">
              <Typography variant="body2">
                <strong>Open Enrollment</strong><br/>
                Course launches {goLiveDateInFuture ? 'on' : 'launched on'} {formatDate(formData.goLiveDate)} with no enrollment deadline.
              </Typography>
            </Alert>
          )}

          {hasGoLiveDate && hasDeadline && deadlineAfterGoLive && (
            <Alert severity="success" variant="outlined">
              <Typography variant="body2">
                <strong>Scheduled Course</strong><br/>
                • Launch: {formatDate(formData.goLiveDate)}<br/>
                • Enrollment closes: {formatDate(formData.deadline)}
              </Typography>
            </Alert>
          )}

          {hasGoLiveDate && hasDeadline && !deadlineAfterGoLive && (
            <Alert severity="warning" variant="outlined">
              <Typography variant="body2">
                <strong>Schedule Conflict</strong><br/>
                Enrollment deadline should be after the go-live date.
              </Typography>
            </Alert>
          )}

          {!hasGoLiveDate && hasDeadline && (
            <Alert severity="warning" variant="outlined">
              <Typography variant="body2">
                <strong>Deadline Without Launch Date</strong><br/>
                Consider setting a go-live date for better course planning.
              </Typography>
            </Alert>
          )}

          {/* Schedule Tips */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              💡 <strong>Scheduling Tips:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              • Leave dates empty for immediate availability<br/>
              • Go-live date controls when the course becomes visible<br/>
              • Deadline stops new enrollments but doesn't affect existing learners
            </Typography>
          </Box>
        </Stack>
    </Box>
  );
};

export default ScheduleSettings;