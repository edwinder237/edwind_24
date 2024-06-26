import { useState } from "react";

// material-ui
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers-pro";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { MobileDateTimePicker } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// project import
import MainCard from "components/MainCard";
import Date_Picker from "../../projects-list/datePicker";


// ==============================|| ACCOUNT PROFILE - SETTINGS ||============================== //

const TabSettings = () => {
  const [checked, setChecked] = useState([
    "en",
    "email-1",
    "email-3",
    "order-1",
    "order-3",
  ]);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const [date1, setDate1] = useState(new Date());
  const [date2, setDate2] = useState(new Date());

  const [time, setTime] = useState(new Date());
  const [datetime, setDatetime] = useState(new Date());

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
            <MainCard title="Time">
              <Grid container direction='row' alignItems="center" spacing={3}>
                <Grid item xs={4}>
                  <Stack spacing={0.5}>
                    <InputLabel>Start of day</InputLabel>
                    <TimePicker
                      ampm={false}
                      openTo="hours"
                      views={['hours', 'minutes', 'seconds']}
                      inputFormat="HH:mm:ss"
                      mask="__:__:__"
                      value={time}
                      onChange={(newValue) => {
                        setTime(newValue);
                      }}
                      renderInput={(params) => <TextField fullWidth {...params} />}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={4}>
                  <Stack spacing={0.5}>
                    <InputLabel>Lunch Time</InputLabel>
                    <TimePicker
                      ampm={false}
                      openTo="hours"
                      views={['hours', 'minutes', 'seconds']}
                      inputFormat="HH:mm:ss"
                      mask="__:__:__"
                      value={time}
                      onChange={(newValue) => {
                        setTime(newValue);
                      }}
                      renderInput={(params) => <TextField fullWidth {...params} />}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={4}>
                  <Stack spacing={0.5}>
                    <InputLabel>End of day time</InputLabel>
                    <TimePicker
                      ampm={false}
                      openTo="hours"
                      views={['hours', 'minutes', 'seconds']}
                      inputFormat="HH:mm:ss"
                      mask="__:__:__"
                      value={time}
                      onChange={(newValue) => {
                        setTime(newValue);
                      }}
                      renderInput={(params) => <TextField fullWidth {...params} />}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
          <Grid item xs={12}>
            <MainCard title="Date">
              <Stack spacing={2.5}>
                <Typography variant="subtitle1">Setup Running Dates</Typography>
                <List sx={{ p: 0, "& .MuiListItem-root": { p: 0, py: 0.25 } }}>
                  <ListItem>
                    <Date_Picker />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      id="switch-list-label-sctp"
                      primary={
                        <Typography color="secondary">
                          Send Copy To Personal Email
                        </Typography>
                      }
                    />
                    <Switch
                      edge="end"
                      onChange={handleToggle("sctp")}
                      checked={checked.indexOf("sctp") !== -1}
                      inputProps={{
                        "aria-labelledby": "switch-list-label-sctp",
                      }}
                    />
                  </ListItem>
                </List>
              </Stack>
            </MainCard>
          </Grid>
          <Grid item xs={12}>
            <MainCard title="Email Settings">
              <Stack spacing={2.5}>
                <Typography variant="subtitle1">
                  Setup Email Notification
                </Typography>
                <List sx={{ p: 0, "& .MuiListItem-root": { p: 0, py: 0.25 } }}>
                  <ListItem>
                    <ListItemText
                      id="switch-list-label-en"
                      primary={
                        <Typography color="secondary">
                          Email Notification
                        </Typography>
                      }
                    />
                    <Switch
                      edge="end"
                      onChange={handleToggle("en")}
                      checked={checked.indexOf("en") !== -1}
                      inputProps={{
                        "aria-labelledby": "switch-list-label-en",
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      id="switch-list-label-sctp"
                      primary={
                        <Typography color="secondary">
                          Send Copy To Personal Email
                        </Typography>
                      }
                    />
                    <Switch
                      edge="end"
                      onChange={handleToggle("sctp")}
                      checked={checked.indexOf("sctp") !== -1}
                      inputProps={{
                        "aria-labelledby": "switch-list-label-sctp",
                      }}
                    />
                  </ListItem>
                </List>
              </Stack>
            </MainCard>
          </Grid>
          <Grid item xs={12}>
            <MainCard title="Updates from System Notification">
              <Stack spacing={2.5}>
                <Typography variant="subtitle1">Email you with?</Typography>
                <List sx={{ p: 0, "& .MuiListItem-root": { p: 0, py: 0.25 } }}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="secondary">
                          News about PCT-themes products and feature updates
                        </Typography>
                      }
                    />
                    <Checkbox defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="secondary">
                          Tips on getting more out of PCT-themes
                        </Typography>
                      }
                    />
                    <Checkbox defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="secondary">
                          Things you missed since you last logged into
                          PCT-themes
                        </Typography>
                      }
                    />
                    <Checkbox />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="secondary">
                          News about products and other services
                        </Typography>
                      }
                    />
                    <Checkbox />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="secondary">
                          Tips and Document business products
                        </Typography>
                      }
                    />
                    <Checkbox />
                  </ListItem>
                </List>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6}>
        <MainCard title="Activity Related Emails">
          <Stack spacing={2.5}>
            <Typography variant="subtitle1">When to email?</Typography>
            <List sx={{ p: 0, "& .MuiListItem-root": { p: 0, py: 0.25 } }}>
              <ListItem>
                <ListItemText
                  id="switch-list-label-email-1"
                  primary={
                    <Typography color="secondary">
                      Have new notifications
                    </Typography>
                  }
                />
                <Switch
                  edge="end"
                  onChange={handleToggle("email-1")}
                  checked={checked.indexOf("email-1") !== -1}
                  inputProps={{
                    "aria-labelledby": "switch-list-label-email-1",
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  id="switch-list-label-email-2"
                  primary={
                    <Typography color="secondary">
                      You&apos;re sent a direct message
                    </Typography>
                  }
                />
                <Switch
                  edge="end"
                  onChange={handleToggle("email-2")}
                  checked={checked.indexOf("email-2") !== -1}
                  inputProps={{
                    "aria-labelledby": "switch-list-label-email-2",
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  id="switch-list-label-email-3"
                  primary={
                    <Typography color="secondary">
                      Someone adds you as a connection
                    </Typography>
                  }
                />
                <Switch
                  edge="end"
                  onChange={handleToggle("email-3")}
                  checked={checked.indexOf("email-3") !== -1}
                  inputProps={{
                    "aria-labelledby": "switch-list-label-email-3",
                  }}
                />
              </ListItem>
            </List>
            <Divider />
            <Typography variant="subtitle1">
              When to escalate emails?
            </Typography>
            <List sx={{ p: 0, "& .MuiListItem-root": { p: 0, py: 0.25 } }}>
              <ListItem>
                <ListItemText
                  id="switch-list-label-order-1"
                  primary={
                    <Typography color="secondary">Upon new order</Typography>
                  }
                />
                <Switch
                  edge="end"
                  onChange={handleToggle("order-1")}
                  checked={checked.indexOf("order-1") !== -1}
                  disabled
                  inputProps={{
                    "aria-labelledby": "switch-list-label-order-1",
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  id="switch-list-label-order-2"
                  primary={
                    <Typography color="secondary">
                      New membership approval
                    </Typography>
                  }
                />
                <Switch
                  edge="end"
                  disabled
                  onChange={handleToggle("order-2")}
                  checked={checked.indexOf("order-2") !== -1}
                  inputProps={{
                    "aria-labelledby": "switch-list-label-order-2",
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  id="switch-list-label-order-3"
                  primary={
                    <Typography color="secondary">
                      Member registration
                    </Typography>
                  }
                />
                <Switch
                  edge="end"
                  onChange={handleToggle("order-3")}
                  checked={checked.indexOf("order-3") !== -1}
                  inputProps={{
                    "aria-labelledby": "switch-list-label-order-3",
                  }}
                />
              </ListItem>
            </List>
          </Stack>
        </MainCard>
      </Grid>
      <Grid item xs={12}>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
        >
          <Button variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button variant="contained">Update Project</Button>
        </Stack>
      </Grid>
    </Grid>
    </LocalizationProvider>
  );
};

export default TabSettings;
