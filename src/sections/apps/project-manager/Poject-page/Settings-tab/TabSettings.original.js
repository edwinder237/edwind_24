import { useState, useEffect } from "react";

// material-ui
import {
  Button,
  Divider,
  Grid,
  InputLabel,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers-pro";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { DatePicker } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// project import
import MainCard from "components/MainCard";
import ProjectInstructors from "./ProjectInstructors";
import { useDispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { getProjectSettings, updateProjectSettings } from "store/reducers/projects";

// utils
import { format, parse } from 'date-fns';

// ==============================|| PROJECT SETTINGS ||============================== //

const TabSettings = () => {
  const dispatch = useDispatch();
  const { singleProject: project, projectSettings, settingsLoading, error } = useSelector((state) => state.projects);
  
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Project dates
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Work schedule times  
  const [startOfDayTime, setStartOfDayTime] = useState('09:00');
  const [endOfDayTime, setEndOfDayTime] = useState('17:00');
  const [lunchTime, setLunchTime] = useState('12:00-13:00');
  
  // Additional settings
  const [timezone, setTimezone] = useState('UTC');
  const [workingDays, setWorkingDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);


  // Load project settings on component mount or project change
  useEffect(() => {
    if (project?.id) {
      dispatch(getProjectSettings(project.id));
    }
  }, [project?.id, dispatch]);

  // Initialize form with project settings data
  useEffect(() => {
    if (projectSettings) {
      setStartDate(projectSettings.startDate ? new Date(projectSettings.startDate) : null);
      setEndDate(projectSettings.endDate ? new Date(projectSettings.endDate) : null);
      setStartOfDayTime(projectSettings.startOfDayTime || '09:00');
      setEndOfDayTime(projectSettings.endOfDayTime || '17:00');
      setLunchTime(projectSettings.lunchTime || '12:00-13:00');
      setTimezone(projectSettings.timezone || 'UTC');
      setWorkingDays(projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      setHasChanges(false);
    }
  }, [projectSettings]);

  // Track changes
  useEffect(() => {
    if (projectSettings) {
      const currentStartDate = projectSettings.startDate ? new Date(projectSettings.startDate) : null;
      const currentEndDate = projectSettings.endDate ? new Date(projectSettings.endDate) : null;
      
      const hasDateChanges = 
        (startDate?.getTime() !== currentStartDate?.getTime()) ||
        (endDate?.getTime() !== currentEndDate?.getTime());

      const hasTimeChanges = 
        startOfDayTime !== (projectSettings.startOfDayTime || '09:00') ||
        endOfDayTime !== (projectSettings.endOfDayTime || '17:00') ||
        lunchTime !== (projectSettings.lunchTime || '12:00-13:00') ||
        timezone !== (projectSettings.timezone || 'UTC') ||
        JSON.stringify(workingDays) !== JSON.stringify(projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

      setHasChanges(hasDateChanges || hasTimeChanges);
    }
  }, [startDate, endDate, startOfDayTime, endOfDayTime, lunchTime, timezone, workingDays, projectSettings]);


  const handleWorkingDayToggle = (day) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const timeStringToDate = (timeString) => {
    if (!timeString) return new Date();
    try {
      return parse(timeString, 'HH:mm', new Date());
    } catch {
      return new Date();
    }
  };

  const dateToTimeString = (date) => {
    if (!date) return '09:00';
    try {
      return format(date, 'HH:mm');
    } catch {
      return '09:00';
    }
  };

  const handleSaveSettings = async () => {
    if (!project?.id) {
      dispatch(openSnackbar({
        open: true,
        message: 'No project selected',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    try {
      setSaving(true);

      const settingsData = {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
        startOfDayTime,
        endOfDayTime,
        lunchTime,
        timezone,
        workingDays,
        updatedBy: 'user'
      };

      const result = await dispatch(updateProjectSettings(project.id, settingsData));

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Project settings updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        setHasChanges(false);
      } else {
        throw new Error(result.message || 'Failed to update project settings');
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update project settings',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (projectSettings) {
      setStartDate(projectSettings.startDate ? new Date(projectSettings.startDate) : null);
      setEndDate(projectSettings.endDate ? new Date(projectSettings.endDate) : null);
      setStartOfDayTime(projectSettings.startOfDayTime || '09:00');
      setEndOfDayTime(projectSettings.endOfDayTime || '17:00');
      setLunchTime(projectSettings.lunchTime || '12:00-13:00');
      setTimezone(projectSettings.timezone || 'UTC');
      setWorkingDays(projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      setHasChanges(false);
    }
    
    dispatch(openSnackbar({
      open: true,
      message: 'Changes cancelled',
      variant: 'alert',
      alert: { color: 'info' }
    }));
  };

  const workingDayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const timezoneOptions = [
    'UTC',
    'America/New_York',
    'America/Toronto', 
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  if (settingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading project settings...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button 
          size="small" 
          onClick={() => project?.id && dispatch(getProjectSettings(project.id))}
          sx={{ ml: 2 }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Grid container spacing={3}>
            {/* Project Dates */}
            <Grid item xs={12}>
              <MainCard title="Project Schedule">
                <Stack spacing={3}>
                  <Typography variant="subtitle1">Project Duration</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={0.5}>
                        <InputLabel>Start Date</InputLabel>
                        <DatePicker
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          renderInput={(params) => <TextField fullWidth {...params} />}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={0.5}>
                        <InputLabel>End Date</InputLabel>
                        <DatePicker
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          minDate={startDate}
                          renderInput={(params) => <TextField fullWidth {...params} />}
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  <Divider />
                  
                  <Typography variant="subtitle1">Daily Schedule</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.5}>
                        <InputLabel>Start of Day</InputLabel>
                        <TimePicker
                          ampm={false}
                          value={timeStringToDate(startOfDayTime)}
                          onChange={(newValue) => setStartOfDayTime(dateToTimeString(newValue))}
                          renderInput={(params) => <TextField fullWidth {...params} />}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.5}>
                        <InputLabel>Lunch Time</InputLabel>
                        <TextField
                          fullWidth
                          value={lunchTime}
                          onChange={(e) => setLunchTime(e.target.value)}
                          placeholder="12:00-13:00"
                          helperText="Format: HH:mm-HH:mm"
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.5}>
                        <InputLabel>End of Day</InputLabel>
                        <TimePicker
                          ampm={false}
                          value={timeStringToDate(endOfDayTime)}
                          onChange={(newValue) => setEndOfDayTime(dateToTimeString(newValue))}
                          renderInput={(params) => <TextField fullWidth {...params} />}
                        />
                      </Stack>
                    </Grid>
                  </Grid>

                  <Stack spacing={0.5}>
                    <InputLabel>Timezone</InputLabel>
                    <FormControl fullWidth>
                      <Select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        {timezoneOptions.map((tz) => (
                          <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack spacing={0.5}>
                    <InputLabel>Working Days</InputLabel>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {workingDayOptions.map((day) => (
                        <Chip
                          key={day.value}
                          label={day.label}
                          onClick={() => handleWorkingDayToggle(day.value)}
                          color={workingDays.includes(day.value) ? 'primary' : 'default'}
                          variant={workingDays.includes(day.value) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Stack>
                </Stack>
              </MainCard>
            </Grid>

          </Grid>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Grid container spacing={3}>
            {/* Project Information */}
            <Grid item xs={12}>
              <MainCard title="Project Information">
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Project ID</Typography>
                      <Typography variant="body1">{project?.id || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Project Status</Typography>
                      <Typography variant="body1">{project?.projectStatus || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="body1">
                        {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body1">
                        {projectSettings?.updatedAt ? new Date(projectSettings.updatedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </Grid>

        {/* Project Instructors - Half Width */}
        <Grid item xs={12} lg={6}>
          <ProjectInstructors projectId={project?.id} />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={2}
          >
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={handleCancel}
              disabled={saving || !hasChanges}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleSaveSettings}
              disabled={saving || !hasChanges}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Updating...' : 'Update Settings'}
            </Button>
          </Stack>
          {hasChanges && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, textAlign: 'right', display: 'block' }}>
              You have unsaved changes
            </Typography>
          )}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default TabSettings;