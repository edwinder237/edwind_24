import React from 'react';
import {
  Stack,
  TextField,
  InputAdornment,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  EmojiEvents as CertificateIcon,
} from '@mui/icons-material';

const EnrollmentSettings = ({ formData, onInputChange }) => {
  const isFreeCourse = !formData.cost || parseFloat(formData.cost) === 0;
  const hasParticipantLimit = formData.maxParticipants && parseInt(formData.maxParticipants) > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PeopleIcon color="primary" />
        Enrollment & Pricing
      </Typography>
      <Stack spacing={3}>
          {/* Enrollment Capacity */}
          <Box>
            <TextField
              fullWidth
              type="number"
              label="Maximum Participants"
              value={formData.maxParticipants}
              onChange={(e) => onInputChange('maxParticipants', e.target.value)}
              placeholder="Unlimited"
              helperText={hasParticipantLimit 
                ? `Course limited to ${formData.maxParticipants} participants`
                : "Leave empty for unlimited enrollment"
              }
              inputProps={{ min: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PeopleIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Course Pricing */}
          <Box>
            <TextField
              fullWidth
              type="number"
              label="Course Cost"
              value={formData.cost}
              onChange={(e) => onInputChange('cost', e.target.value)}
              placeholder="0.00"
              helperText={isFreeCourse 
                ? "Course is free for all learners"
                : `Course costs $${formData.cost} per participant`
              }
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Certification */}
          <Box>
            <TextField
              fullWidth
              label="Certification"
              value={formData.certification}
              onChange={(e) => onInputChange('certification', e.target.value)}
              placeholder="e.g., Certificate of Completion"
              helperText="What certificate will learners receive upon completion?"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CertificateIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Enrollment Summary */}
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              <strong>Enrollment Summary:</strong><br/>
              • {hasParticipantLimit ? `Limited to ${formData.maxParticipants} participants` : 'Unlimited enrollment'}<br/>
              • {isFreeCourse ? 'Free course' : `$${formData.cost} per participant`}<br/>
              • {formData.certification ? `Includes: ${formData.certification}` : 'No certification specified'}
            </Typography>
          </Alert>
        </Stack>
    </Box>
  );
};

export default EnrollmentSettings;