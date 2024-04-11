import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// material-ui
import { Grid, List } from "@mui/material";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import { useDispatch, useSelector } from "store";

function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(checked, values) {
  return checked.filter((value) => values.indexOf(value) !== -1);
}

function union(a, b) {
  return [...a, ...not(b, a)];
}

export default function TransferList({ courseId, eventId }) {
  const projectId = 21;
  if (!courseId) return <>no data</>;
  const dispatch = useDispatch();
  const [checked, setChecked] = useState([]);
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);

  //States below are used to send unique data to the server
  const [addedAttendees, setAddedAttendees] = useState([]);
  const [removedAttendees, setRemovedAttendees] = useState([]);

  const leftArray = left.map((i) => i?.string);
  const rightArray = right.map((i) => i?.string);

  const enrolleesQuery = useQuery({
    queryKey: ["enrollees", courseId, eventId],
    queryFn: () =>
      axios.post("/api/projects/fetchEventEnrolleesAndAttendees", {
        courseId,
        eventId,
      }),
  });

  const groupQuery = useQuery({
    queryKey: ["groups", courseId, eventId],
    queryFn: () =>
    axios.post("/api/projects/fetchGroupsDetails", {
      projectId,
    }),
  });

  console.log(groupQuery.data)

  useEffect(() => {
    if (enrolleesQuery.isLoading) console.log("landind the plane");
    if (enrolleesQuery.error) console.log("error");
    if (enrolleesQuery.isSuccess) {
      const enrollees = enrolleesQuery?.data?.data.enrollees;
      const firstNames = enrollees?.map((enr) => ({
        id: enr?.enrolleeId,
        string: `
          ${enr?.enrolleeId}
          ${enr?.participant.firstName}
          ${enr?.participant.lastName}
          ${enr?.participant.department ?? ""} 
        `,
      }));

      console.log(firstNames);

      setLeft(firstNames);
      const attendees = enrolleesQuery?.data.data.attendees;
      console.log(attendees);
      const attendeesNames = attendees?.map((att) => ({
        id: att?.enrollee?.id,
        string: `
      ${att?.enrollee.id}
      ${att?.enrollee.participant.firstName}
      ${att?.enrollee.participant.lastName}
      ${att?.enrollee.participant.derpartement} `,
      }));
      console.log(attendeesNames);
      setRight(attendeesNames);
    }
  }, [courseId, enrolleesQuery.isSuccess]);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

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
  const numberOfChecked = (items) => intersection(checked, items).length;

  const handleToggleAll = (items) => () => {
    if (numberOfChecked(items) === items.length) {
      setChecked(not(checked, items));
    } else {
      setChecked(union(checked, items));
    }
  };

  const handleCheckedRight = () => {
    const removed = leftChecked.filter((i) => i.id);
    const updatedRemovedAttendees = removedAttendees.filter(
      (item) => !removed.some((i) => i.id === item.id)
    );
    const existingAttendeesIds = enrolleesQuery.data.data.attendees.map(i=>i.enrollee.id);
    setRight([...right, ...leftChecked]);
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));

    // this section handle states that update the database
    setAddedAttendees([...addedAttendees, ...leftChecked]);
    setRemovedAttendees(updatedRemovedAttendees);

    console.log(right.filter(i=> existingAttendeesIds.some(a=>a.id !==i.id)))
  };
  const handleCheckedLeft = () => {
    const removed = rightChecked.filter((i) => i.id);
    const updatedAddedAttendees = addedAttendees.filter(
      (item) => !removed.some((i) => i.id === item.id)
    );
    setLeft([...left, ...rightChecked]);
    setRight(not(right, rightChecked));
    setChecked(not(checked, rightChecked));

    // this section handle states that update the database
    setAddedAttendees(updatedAddedAttendees);
    setRemovedAttendees(removed);
  };
  console.log("added", addedAttendees);
  console.log("removed", removedAttendees);
  const customList = (title, items, bgcolor) => {
    console.log(bgcolor, items);
    return (
      <Card>
        <CardHeader
          sx={{ px: 2, py: 1, bgcolor: bgcolor }}
          avatar={
            <Checkbox
              onClick={handleToggleAll(items)}
              checked={
                numberOfChecked(items) === items?.length && items?.length !== 0
              }
              indeterminate={
                numberOfChecked(items) !== items?.length &&
                numberOfChecked(items) !== 0
              }
              disabled={items?.length === 0}
              inputProps={{
                "aria-label": "all items selected",
              }}
            />
          }
          title={title}
          subheader={`${numberOfChecked(items)}/${items?.length} selected`}
        />
        <Divider />
        <Button>save</Button>
        <List
          sx={{
            width: 200,
            height: 230,
            bgcolor: "background.paper",
            overflow: "auto",
          }}
          dense
          component="div"
          role="list"
        >
          {items?.map((value) => {
            const labelId = `transfer-list-all-item-${value}-label`;
            const string = value.string;
            return (
              <ListItemButton
                key={string}
                role="listitem"
                onClick={handleToggle(value)}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={checked.indexOf(value) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{
                      "aria-labelledby": labelId,
                    }}
                  />
                </ListItemIcon>
                <ListItemText id={labelId} primary={string} />
              </ListItemButton>
            );
          })}
        </List>
      </Card>
    );
  };

  if (enrolleesQuery.isLoading) return <>Loading..</>;
  return (
    <Grid container spacing={2} justifyContent="start" alignItems="center">
      <Grid item>{customList("suggestions", left, "orange")}</Grid>

      <Grid item>
        <Grid container direction="column" alignItems="center">
          <Button
            sx={{ my: 0.5 }}
            variant="outlined"
            size="small"
            onClick={handleCheckedRight}
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            sx={{ my: 0.5 }}
            variant="outlined"
            size="small"
            onClick={handleCheckedLeft}
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
        </Grid>
      </Grid>
      <Grid item>{customList("Current Attendees", right, "green")}</Grid>
    </Grid>
  );
}
