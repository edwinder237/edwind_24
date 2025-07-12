import { useState } from "react";

// material-ui
import {
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Stack,
  Typography,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import AttendeeCard from "./AttendeeCard";
import { useSelector } from "store";

// assets
import { PlusCircleOutlined } from "@ant-design/icons";
import IconButton from "components/@extended/IconButton";

// assets
const Avatar1 = "/assets/images/users/avatar-1.png";

// ===========================||  ||=========================== //

const Attendees = ({ eventParticipants, eventCourse, groupName }) => {
  const { singleProject } = useSelector((state) => state.projects);
  const [state, setState] = useState({
    checkedA: true,
    checkedB: true,
    checkedC: true,
    checkedD: false,
    checkedE: false,
    checkedF: false,
    checkedG: false,
  });

  const handleChangeState = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  const eventParticipantsDetails = eventParticipants.map((participant) => {
    const foundPerson = singleProject.participants.find(
      (project_participant) =>
        project_participant.id === participant?.project_paticipantId
    );
    return foundPerson
      ? { ...participant, participant: foundPerson.participant }
      : null;
  });

  return (
    <MainCard
      title={` ${eventCourse} | Participants `}
      content={false}
      secondary={
        <>
          <Stack direction="row">
            <Typography>change group</Typography>
            <Tooltip title="Add Task">
              <IconButton>
                <PlusCircleOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </>
      }
      sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
    >
      {eventParticipants.map(({ ...attendees }) => (
        <AttendeeCard attendees={attendees} />
      ))}
    </MainCard>
  );
};

export default Attendees;
