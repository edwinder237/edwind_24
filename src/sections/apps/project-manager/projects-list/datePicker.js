import { useState, useEffect } from "react";

// material-ui
import { Grid, InputLabel, Stack, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// ==============================|| PLUGIN - MASK INPUT ||============================== //

const Date_Picker = ({handleStartDateChange, handleEndDateChange, startDate, endDate}) => {
  const [date1, setDate1] = useState(startDate || new Date());
  const [date2, setDate2] = useState(endDate || new Date());

  // Update local state when props change
  useEffect(() => {
    if (startDate) {
      setDate1(startDate);
    }
    if (endDate) {
      setDate2(endDate);
    }
  }, [startDate, endDate]);





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
                      onChange={(newValue) => {
                        setDate1(newValue)
                        if (handleStartDateChange) {
                          handleStartDateChange(newValue)
                        }
                      }}
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
                      onChange={(newValue) => {
                        setDate2(newValue)
                        if (handleEndDateChange) {
                          handleEndDateChange(newValue)
                        }
                      }}
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
