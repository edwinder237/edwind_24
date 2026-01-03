import { useEffect } from "react";

// material-ui
import { Grid, InputLabel, Stack, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// Custom hook for date range auto-adjustment
import { useDateRangeInput } from "hooks/useTimeRangeInput";

// ==============================|| PLUGIN - MASK INPUT ||============================== //

const Date_Picker = ({handleStartDateChange, handleEndDateChange, startDate, endDate}) => {
  // Use the date range hook for auto-adjustment logic
  // minDurationDays: 0 allows same-day start and end dates (single-day projects)
  const {
    startDate: date1,
    endDate: date2,
    setStartDate: setDate1,
    setEndDate: setDate2,
    _setStartDateRaw,
    _setEndDateRaw
  } = useDateRangeInput({
    initialStartDate: startDate || new Date(),
    initialEndDate: endDate || new Date(),
    minDurationDays: 0
  });

  // Update local state when props change (using raw setters to avoid auto-adjust on init)
  useEffect(() => {
    if (startDate) {
      _setStartDateRaw(startDate);
    }
    if (endDate) {
      _setEndDateRaw(endDate);
    }
  }, [startDate, endDate, _setStartDateRaw, _setEndDateRaw]);

  // Notify parent when dates change (including auto-adjusted values)
  useEffect(() => {
    if (date1 && handleStartDateChange) {
      handleStartDateChange(date1);
    }
  }, [date1, handleStartDateChange]);

  useEffect(() => {
    if (date2 && handleEndDateChange) {
      handleEndDateChange(date2);
    }
  }, [date2, handleEndDateChange]);

  if (date1 && date2)
    return (
      <>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={12}>
              <Grid container alignItems="center" spacing={3}>
                <Grid item xs={12} sm={6} lg={6}>
                  <Stack spacing={0.5}>
                    <InputLabel>Start Date</InputLabel>
                    <DatePicker
                      value={date1}
                      onChange={(newValue) => setDate1(newValue)}
                      renderInput={(params) => (
                        <TextField fullWidth {...params} />
                      )}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} lg={6}>
                  <Stack spacing={0.5}>
                    <InputLabel>End Date</InputLabel>
                    <DatePicker
                      value={date2}
                      onChange={(newValue) => setDate2(newValue)}
                      minDate={date1}
                      renderInput={(params) => (
                        <TextField fullWidth {...params} />
                      )}
                      inputFormat="mm-dd-yyyy"
                      mask="__-__-____"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </>
    );
};

export default Date_Picker;
