import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';

const BasicInformation = ({ formData, onInputChange }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      case 'expert': return 'secondary';
      default: return 'default';
    }
  };

  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
  ];

  const deliveryMethodOptions = [
    { value: 'online', label: '💻 Online' },
    { value: 'in-person', label: '🏢 In Person' },
    { value: 'hybrid', label: '🔄 Hybrid' },
    { value: 'self-paced', label: '⏰ Self-Paced' },
  ];

  const courseCategoryOptions = [
    { value: 'technical', label: '⚙️ Technical' },
    { value: 'business', label: '💼 Business' },
    { value: 'design', label: '🎨 Design' },
    { value: 'marketing', label: '📈 Marketing' },
    { value: 'management', label: '👥 Management' },
    { value: 'other', label: '📚 Other' },
  ];

  const languageOptions = [
    { value: 'english', label: '🇺🇸 English' },
    { value: 'spanish', label: '🇪🇸 Español' },
    { value: 'french', label: '🇫🇷 Français' },
    { value: 'german', label: '🇩🇪 Deutsch' },
    { value: 'other', label: '🌐 Other' },
  ];

  return (
    <Grid container spacing={3}>
          {/* Primary Information */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Course Title"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Enter a descriptive course title"
              required
              helperText="This will be the main title displayed to learners"
            />
          </Grid>

          {/* Translated Title */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Translated Title"
              value={formData.translatedTitle}
              onChange={(e) => onInputChange('translatedTitle', e.target.value)}
              placeholder="Enter translated course title"
              helperText="Alternative title for translated documents"
            />
          </Grid>

          {/* Course Identifiers */}
          <Grid item xs={12} sm={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Course Code"
                  value={formData.code}
                  onChange={(e) => onInputChange('code', e.target.value)}
                  placeholder="e.g., WEB-101"
                  helperText="Unique identifier for administrative purposes"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Version"
                  value={formData.version}
                  onChange={(e) => onInputChange('version', e.target.value)}
                  placeholder="e.g., 1.0.0"
                  helperText="Track course revisions and updates"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={formData.language}
                    label="Language"
                    onChange={(e) => onInputChange('language', e.target.value)}
                  >
                    {languageOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Course Summary"
              value={formData.summary}
              onChange={(e) => onInputChange('summary', e.target.value)}
              placeholder="Provide a comprehensive description of what learners will gain from this course"
              helperText="A compelling summary helps learners understand the value and outcomes"
            />
          </Grid>

          {/* Course Classification */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Delivery Method</InputLabel>
              <Select
                value={formData.deliveryMethod}
                label="Delivery Method"
                onChange={(e) => onInputChange('deliveryMethod', e.target.value)}
              >
                {deliveryMethodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Course Level</InputLabel>
              <Select
                value={formData.level}
                label="Course Level"
                onChange={(e) => onInputChange('level', e.target.value)}
              >
                {levelOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Chip 
                      label={option.label} 
                      size="small" 
                      color={getLevelColor(option.value)}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.courseCategory}
                label="Category"
                onChange={(e) => onInputChange('courseCategory', e.target.value)}
              >
                {courseCategoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Target Audience"
              value={formData.targetAudience}
              onChange={(e) => onInputChange('targetAudience', e.target.value)}
              placeholder="e.g., Beginners with no prior experience"
              helperText="Who should take this course?"
            />
          </Grid>
        </Grid>
  );
};

export default BasicInformation;