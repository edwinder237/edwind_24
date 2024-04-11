import React, { useState, useEffect } from "react";

import { useDispatch, useSelector } from "store";
import { getCourses } from "store/reducers/courses";

//child components
import Moduleswidget from "./moduleswidget";
import Calendar from "./calendar";
import Attendees from "./attendees/attendees";
import SessionNotes from "./SessionNotes";

// material-ui
import { Box, Grid, Stack, Button } from "@mui/material";
//import Button from "themes/overrides/Button";

function AgendaContainer() {
  const dispatch = useDispatch();
  const { singleProject: Project} = useSelector((state) => state.projects);
  const { courses } = useSelector((state) => state.courses);
  const { isAdding} = useSelector((state) => state.calendar);

  const { curriculum, events, project_parentGroup } = Project;

  const [scheduleState, setScheduleState] = useState({ participants: [] });

  useEffect(() => {
    dispatch(getCourses());

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdding]);


  function getSelectedEventDetails(event) {
   // console.log(event);
    const { title: eventTitle, extendedProps ,id} = event;
    const { courseId, event_attendees, event_groups, eventType } =
      extendedProps;

      const eventId = parseInt(id)
      const selectedEventAttendees = Project.events?.find(e=>e.id === eventId)?.event_attendees;

    const project_attendess = event_attendees.map(
      (a) => a.project_participants?.participant
    );
    const project_groups = event_groups.map((group) =>
      group.groups.participants.map((p) => p.participant)
    );

    const eventParticipants = project_attendess.concat(...project_groups);

    switch (eventType) {
      case "course":
        const course = courses.find((course) => course.id == courseId);
        setScheduleState({
          ...scheduleState,
          participants: selectedEventAttendees,
          courseTitle: `${course.duration}min | ${eventTitle} | ${course.title}`,
          groupName: [],
          instructorNotes: [],
          modules: course.modules,
        });

        //console.log('Selected Event',event);
        break;
      case "other":
        console.log("this is another type of project");
        break;
      case "TypeC":
        // Code for TypeC event
        break;
      // Add more cases as needed

      default:
        // Default case if the type is not recognized
        break;
    }
  }

console.log('Schedule Page Rendered')
  if (scheduleState ) {
    return (
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={7} lg={7}>
            <Calendar
              project_parentGroup={project_parentGroup}
              curriculum={curriculum}
              getSelectedEventDetails={getSelectedEventDetails}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={5} lg={5} bgcolor="">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12} lg={12}>
               
                  <Attendees
                    eventParticipants={scheduleState.participants || []}
                    eventCourse={scheduleState.courseTitle}
                    groupName={
                      scheduleState.groupName &&
                      scheduleState.groupName.groupName
                    }
                  />
           
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Moduleswidget eventState={scheduleState} />
              </Grid>

              <SessionNotes notes={scheduleState.instructorNotes} />
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  } else return null;
}

export default AgendaContainer;
