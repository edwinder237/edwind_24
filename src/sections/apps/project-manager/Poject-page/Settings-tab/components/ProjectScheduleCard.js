import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Stack,
  Typography,
  TextField,
  Divider,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Box,
  Chip
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers-pro';
import MainCard from 'components/MainCard';
import { timeStringToDate, dateToTimeString } from '../utils/timeHelpers';
import { WORKING_DAY_OPTIONS, TIMEZONE_OPTIONS } from '../utils/constants';

const ProjectScheduleCard = React.memo(({ 
  settings,
  onUpdateField,
  onToggleWorkingDay
}) => {
  // Memoized time conversion functions
  const startOfDayDate = useMemo(() => 
    timeStringToDate(settings.startOfDayTime), 
    [settings.startOfDayTime]
  );

  const endOfDayDate = useMemo(() => 
    timeStringToDate(settings.endOfDayTime), 
    [settings.endOfDayTime]
  );

  // Memoized working day chips
  const workingDayChips = useMemo(() => 
    WORKING_DAY_OPTIONS.map((day) => (
      <Chip
        key={day.value}
        label={day.label}
        onClick={() => onToggleWorkingDay(day.value)}
        color={settings.workingDays.includes(day.value) ? 'primary' : 'default'}
        variant={settings.workingDays.includes(day.value) ? 'filled' : 'outlined'}
        sx={{ cursor: 'pointer' }}
      />
    )), 
    [settings.workingDays, onToggleWorkingDay]
  );

  // Memoized timezone options
  const timezoneMenuItems = useMemo(() => 
    TIMEZONE_OPTIONS.map((tz) => (
      <MenuItem key={tz} value={tz}>{tz}</MenuItem>
    )), 
    []
  );

  return (
    <MainCard title="Project Schedule">
      <Stack spacing={3}>
        <Typography variant="subtitle1">Project Duration</Typography>
        
        {/* Date Pickers */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={0.5}>
              <InputLabel>Start Date</InputLabel>
              <DatePicker
                value={settings.startDate}
                onChange={(newValue) => onUpdateField('startDate', newValue)}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack spacing={0.5}>
              <InputLabel>End Date</InputLabel>
              <DatePicker
                value={settings.endDate}
                onChange={(newValue) => onUpdateField('endDate', newValue)}
                minDate={settings.startDate}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Stack>
          </Grid>
        </Grid>
        
        <Divider />
        
        <Typography variant="subtitle1">Daily Schedule</Typography>
        
        {/* Time Pickers */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Stack spacing={0.5}>
              <InputLabel>Start of Day</InputLabel>
              <TimePicker
                ampm={false}
                value={startOfDayDate}
                onChange={(newValue) => onUpdateField('startOfDayTime', dateToTimeString(newValue))}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Stack spacing={0.5}>
              <InputLabel>Lunch Time</InputLabel>
              <TextField
                fullWidth
                value={settings.lunchTime}
                onChange={(e) => onUpdateField('lunchTime', e.target.value)}
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
                value={endOfDayDate}
                onChange={(newValue) => onUpdateField('endOfDayTime', dateToTimeString(newValue))}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Stack>
          </Grid>
        </Grid>

        {/* Timezone Selector */}
        <Stack spacing={0.5}>
          <InputLabel>Timezone</InputLabel>
          <FormControl fullWidth>
            <Select
              value={settings.timezone}
              onChange={(e) => onUpdateField('timezone', e.target.value)}
            >
              {timezoneMenuItems}
            </Select>
          </FormControl>
        </Stack>

        {/* Working Days */}
        <Stack spacing={0.5}>
          <InputLabel>Working Days</InputLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {workingDayChips}
          </Box>
        </Stack>
      </Stack>
    </MainCard>
  );
});

ProjectScheduleCard.propTypes = {
  settings: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    startOfDayTime: PropTypes.string.isRequired,
    endOfDayTime: PropTypes.string.isRequired,
    lunchTime: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
    workingDays: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onUpdateField: PropTypes.func.isRequired,
  onToggleWorkingDay: PropTypes.func.isRequired
};

ProjectScheduleCard.displayName = 'ProjectScheduleCard';

export default ProjectScheduleCard;