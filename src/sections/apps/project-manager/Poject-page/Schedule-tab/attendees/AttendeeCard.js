

// material-ui
import {
  CardContent,
  Checkbox,
  Grid,
  Link,
  Typography,
  Stack,
} from "@mui/material";

// project imports
import Avatar from "components/@extended/Avatar";
import AttendeeAction from "./AttendeeAction";
import ChipSelectMenu from "./chipSelector";

// assets
const Avatar1 = "/assets/images/users/avatar-1.png";

const AttendeeCard = ({ attendees }) => {

  const attendee = attendees.enrollee.participant;

  const handleClick = () => {
    console.info("You clicked the Chip.");
  };
 
if (attendees.id) {
    return (
      <CardContent>
        <Grid
          container
          spacing={2.5}
          sx={{ "& .Mui-checked + span": { textDecoration: "line-through" } }}
        >
          <Grid item xs={12}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Checkbox
                  checked={false}
                  onChange={null}
                  name="checkedA"
                  color="primary"
                />
              </Grid>
              <Grid item>
                <Avatar alt="User 1" src={Avatar1} />
              </Grid>
              <Grid item xs zeroMinWidth>
                <Typography align="left" variant="subtitle1">
                  {attendee.firstName}{" "}{attendee.lastName}
                </Typography>
                <Typography align="left" variant="caption" color="secondary">
                  {attendee.derpartement}
                </Typography>
              </Grid>
              <Grid item>
                <AttendeeAction />
              </Grid>
              <Grid item>
                <Stack direction="column" alignItems="center" color={"danger"}>
                  <ChipSelectMenu />
                  <Typography align="left" variant="caption">
                    5 min ago
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    );
  } else
    return (
      <CardContent>
        <Grid
          container
          spacing={2.5}
          sx={{ "& .Mui-checked + span": { textDecoration: "line-through" } }}
        >
          <Grid item xs={12}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs zeroMinWidth>
                <Typography align="left" variant="subtitle1">
                  no attendees yet{" "}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    );
};

export default AttendeeCard;
