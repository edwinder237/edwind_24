import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Stack,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  IconButton,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import {
  useCreateCurriculumSurveyMutation,
  useUpdateCurriculumSurveyMutation
} from 'store/api/projectApi';
import {
  SURVEY_PROVIDERS,
  SURVEY_TYPES,
  getProviderConfigFields,
  validateProviderConfig
} from 'utils/surveyProviders';

const steps = ['Basic Info', 'Provider & URL', 'Answer Key', 'Settings'];

const CreateSurveyDialog = ({ open, onClose, curriculumId, editingSurvey, courses = [] }) => {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    surveyType: 'post_training',
    provider: 'google_forms',
    providerConfig: { formUrl: '', answerKey: {} },
    isRequired: true,
    triggerCourseId: null,
    customTriggerDays: null,
    status: 'active'
  });

  // Answer key entries for UI
  const [answerKeyEntries, setAnswerKeyEntries] = useState([]);

  const [createSurvey, { isLoading: isCreating }] = useCreateCurriculumSurveyMutation();
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateCurriculumSurveyMutation();

  const isLoading = isCreating || isUpdating;
  const isEditing = !!editingSurvey;

  // Reset form when dialog opens/closes or survey changes
  useEffect(() => {
    if (open) {
      if (editingSurvey) {
        const config = editingSurvey.providerConfig || { formUrl: '' };
        setFormData({
          title: editingSurvey.title || '',
          description: editingSurvey.description || '',
          surveyType: editingSurvey.surveyType || 'post_training',
          provider: editingSurvey.provider || 'google_forms',
          providerConfig: config,
          isRequired: editingSurvey.isRequired ?? true,
          triggerCourseId: editingSurvey.triggerCourseId || null,
          customTriggerDays: editingSurvey.customTriggerDays || null,
          status: editingSurvey.status || 'active'
        });
        // Load existing answer key into entries
        const existingAnswerKey = config.answerKey || {};
        setAnswerKeyEntries(
          Object.entries(existingAnswerKey).map(([question, answer]) => ({
            question,
            answer: Array.isArray(answer) ? answer.join(', ') : answer
          }))
        );
      } else {
        setFormData({
          title: '',
          description: '',
          surveyType: 'post_training',
          provider: 'google_forms',
          providerConfig: { formUrl: '', answerKey: {} },
          isRequired: true,
          triggerCourseId: null,
          customTriggerDays: null,
          status: 'active'
        });
        setAnswerKeyEntries([]);
      }
      setActiveStep(0);
      setErrors({});
    }
  }, [open, editingSurvey]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleProviderConfigChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      providerConfig: {
        ...prev.providerConfig,
        [field]: event.target.value
      }
    }));
    setErrors(prev => ({ ...prev, [`providerConfig.${field}`]: null }));
  };

  const handleProviderChange = (event) => {
    const newProvider = event.target.value;
    setFormData(prev => ({
      ...prev,
      provider: newProvider,
      providerConfig: { formUrl: prev.providerConfig?.formUrl || '', answerKey: prev.providerConfig?.answerKey || {} }
    }));
  };

  // Answer key management
  const addAnswerKeyEntry = () => {
    setAnswerKeyEntries(prev => [...prev, { question: '', answer: '' }]);
  };

  const removeAnswerKeyEntry = (index) => {
    setAnswerKeyEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateAnswerKeyEntry = (index, field, value) => {
    setAnswerKeyEntries(prev => prev.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  // Convert entries to answer key object
  const getAnswerKeyFromEntries = () => {
    const answerKey = {};
    answerKeyEntries.forEach(entry => {
      if (entry.question.trim()) {
        // If answer contains commas, split into array (for multi-select questions)
        const answer = entry.answer.includes(',')
          ? entry.answer.split(',').map(a => a.trim())
          : entry.answer.trim();
        answerKey[entry.question.trim()] = answer;
      }
    });
    return answerKey;
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
    }

    if (step === 1) {
      const configValidation = validateProviderConfig(formData.provider, formData.providerConfig);
      if (!configValidation.isValid) {
        Object.entries(configValidation.errors).forEach(([key, value]) => {
          newErrors[`providerConfig.${key}`] = value;
        });
      }
    }

    // Step 2 is Answer Key - no validation required (optional)

    if (step === 3) {
      if (formData.surveyType === 'per_course' && !formData.triggerCourseId) {
        newErrors.triggerCourseId = 'Please select a course';
      }
      if (formData.surveyType === 'custom' && !formData.customTriggerDays) {
        newErrors.customTriggerDays = 'Please enter number of days';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      // Build provider config with answer key
      const answerKey = getAnswerKeyFromEntries();
      const providerConfig = {
        ...formData.providerConfig,
        answerKey: Object.keys(answerKey).length > 0 ? answerKey : undefined
      };

      const surveyData = {
        curriculumId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        surveyType: formData.surveyType,
        provider: formData.provider,
        providerConfig,
        isRequired: formData.isRequired,
        triggerCourseId: formData.surveyType === 'per_course' ? formData.triggerCourseId : null,
        customTriggerDays: formData.surveyType === 'custom' ? parseInt(formData.customTriggerDays) : null,
        status: formData.status,
        createdBy: 'user' // TODO: Get from auth context
      };

      if (isEditing) {
        await updateSurvey({ id: editingSurvey.id, ...surveyData }).unwrap();
        dispatch(openSnackbar({
          open: true,
          message: 'Survey updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        await createSurvey(surveyData).unwrap();
        dispatch(openSnackbar({
          open: true,
          message: 'Survey created successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }

      onClose(true);
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} survey`,
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const providerConfigFields = getProviderConfigFields(formData.provider);
  const surveyTypeConfig = SURVEY_TYPES[formData.surveyType];

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Survey' : 'Create Survey'}
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Basic Info */}
        {activeStep === 0 && (
          <Stack spacing={3}>
            <TextField
              label="Survey Title"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
              placeholder="e.g., Post-Training Feedback Survey"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of what this survey is for..."
            />

            <FormControl fullWidth>
              <InputLabel>Survey Type</InputLabel>
              <Select
                value={formData.surveyType}
                onChange={handleChange('surveyType')}
                label="Survey Type"
              >
                {Object.values(SURVEY_TYPES).map((type) => (
                  <MenuItem key={type.key} value={type.key}>
                    <Box>
                      <Typography>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}

        {/* Step 2: Provider & URL */}
        {activeStep === 1 && (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Survey Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={handleProviderChange}
                label="Survey Provider"
              >
                {Object.values(SURVEY_PROVIDERS).map((provider) => (
                  <MenuItem key={provider.key} value={provider.key}>
                    <Box>
                      <Typography>{provider.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {provider.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">
              Provider Configuration
            </Typography>

            {providerConfigFields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type === 'password' ? 'password' : 'text'}
                value={formData.providerConfig?.[field.key] || ''}
                onChange={handleProviderConfigChange(field.key)}
                error={!!errors[`providerConfig.${field.key}`]}
                helperText={errors[`providerConfig.${field.key}`] || field.helperText}
                fullWidth
                required={field.required}
                placeholder={field.placeholder}
              />
            ))}

            <Alert severity="info" sx={{ mt: 2 }}>
              Create your survey in {SURVEY_PROVIDERS[formData.provider]?.label || 'your survey tool'} first, then paste the share URL above.
            </Alert>
          </Stack>
        )}

        {/* Step 3: Answer Key (optional) */}
        {activeStep === 2 && (
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Optional:</strong> Define correct answers for grading. If your Google Form is in quiz mode, correct answers will be fetched automatically.
              </Typography>
            </Alert>

            <Typography variant="subtitle2">
              Custom Answer Key
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter question titles exactly as they appear in your form, along with the correct answer(s). For multiple correct answers, separate with commas.
            </Typography>

            <Stack spacing={2}>
              {answerKeyEntries.map((entry, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Question Title"
                      value={entry.question}
                      onChange={(e) => updateAnswerKeyEntry(index, 'question', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="e.g., What year is it?"
                    />
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <TextField
                        label="Correct Answer(s)"
                        value={entry.answer}
                        onChange={(e) => updateAnswerKeyEntry(index, 'answer', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g., 2024 or Option A, Option B"
                        helperText="For multiple answers, separate with commas"
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeAnswerKeyEntry(index)}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addAnswerKeyEntry}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Answer Key Entry
              </Button>
            </Stack>

            {answerKeyEntries.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No custom answer key defined. Results will show without grading unless your form uses Google Forms quiz mode.
              </Typography>
            )}
          </Stack>
        )}

        {/* Step 4: Settings */}
        {activeStep === 3 && (
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={handleChange('isRequired')}
                />
              }
              label="Required for completion"
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>

            {/* Per-Course trigger */}
            {formData.surveyType === 'per_course' && (
              <FormControl fullWidth error={!!errors.triggerCourseId}>
                <InputLabel>Trigger After Course</InputLabel>
                <Select
                  value={formData.triggerCourseId || ''}
                  onChange={handleChange('triggerCourseId')}
                  label="Trigger After Course"
                >
                  {courses.length === 0 ? (
                    <MenuItem disabled>No courses available</MenuItem>
                  ) : (
                    courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.triggerCourseId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.triggerCourseId}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* Custom timing */}
            {formData.surveyType === 'custom' && (
              <TextField
                label="Days After Enrollment"
                type="number"
                value={formData.customTriggerDays || ''}
                onChange={handleChange('customTriggerDays')}
                error={!!errors.customTriggerDays}
                helperText={errors.customTriggerDays || 'Survey will be sent X days after participant enrollment'}
                fullWidth
                inputProps={{ min: 1 }}
              />
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={isLoading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isLoading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Survey' : 'Create Survey'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

CreateSurveyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  curriculumId: PropTypes.number.isRequired,
  editingSurvey: PropTypes.object,
  courses: PropTypes.array
};

export default CreateSurveyDialog;
