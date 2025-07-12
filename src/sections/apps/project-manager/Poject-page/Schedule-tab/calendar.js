import { useEffect, useRef, useState } from "react";

// material-ui
import {
  useMediaQuery,
  Box,
  Backdrop,
  Dialog,
  SpeedDial,
  Tooltip,
  Button,
  Stack,
} from "@mui/material";

// third-party
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import timelinePlugin from "@fullcalendar/timeline";

// project import
import Loader from "components/Loader";
import { PopupTransition } from "components/@extended/Transitions";
import CalendarStyled from "./CalendarStyled";
import Toolbar from "./Toolbar";
import AddEventForm from "./AddEventForm";
import MainCard from "components/MainCard";
import ViewSchedule from "./viewSchedule";

import { dispatch, useSelector } from "store";

import {
  getEvents,
  selectEvent,
  selectRange,
  toggleModal,
  updateCalendarView,
  updateEvent,
} from "store/reducers/calendar";

// types
import { PlusOutlined } from "@ant-design/icons";

// ==============================|| CALENDAR - MAIN ||============================== //

const Calendar = ({ getSelectedEventDetails, curriculum }) => {
  const [loading, setLoading] = useState(true);

  const [openSchedule, setOpenSchedule] = useState(false);

  const [selectedEventDetails, setSelectedEventDetails] = useState("");
  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { calendarView, events, isModalOpen, selectedRange, selectedEventId } =
    useSelector((state) => state.calendar);

  const { singleProject } = useSelector((state) => state.projects);
  const { isAdding } = useSelector((state) => state.calendar);

  const selectedEvent = useSelector((state) => {
    const { events, selectedEventId } = state.calendar;
    if (selectedEventId) {
      return events.find((event) => event.id == selectedEventId);
    }
    return null;
  });

  const [Events, setEvents] = useState(events);

  const calendarRef = useRef(null);

  useEffect(() => {
    const newView = matchDownSM ? "listWeek" : "listWeek";
    const viewCall = dispatch(updateCalendarView(newView));
    const eventCall = dispatch(getEvents(singleProject.id));
    Promise.all([viewCall, eventCall]).then(() => setLoading(false));
    console.log("events feteched");
    // eslint-disable-next-line
  }, [isAdding]);

  useEffect(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();
      const newView = matchDownSM ? "listWeek" : "listWeek";
      calendarApi.changeView(newView);
      dispatch(updateCalendarView(newView));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownSM]);

  const handleClose = () => {
    setOpenSchedule(false);
  };
  const handleOpen = () => {
    setOpenSchedule(true);
  };

  const [date, setDate] = useState(new Date());

  // calendar toolbar events
  const handleDateToday = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handleViewChange = (newView) => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.changeView(newView);
      dispatch(updateCalendarView(newView));
    }
  };

  const handleDatePrev = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  };

  const handleDateNext = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  };

  // calendar events
  const handleRangeSelect = (arg) => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();
      calendarApi.unselect();
    }

    dispatch(selectRange(arg.start, arg.end));
  };

  const handleEventSelect = (arg) => {
    setSelectedEventDetails(arg.event);
    // Reset background color of all events
    calendarRef.current
      .getApi()
      .getEvents()
      .forEach((event) => {
        event.setProp("backgroundColor", "");
      });

    // Highlight the clicked event in yellow
    arg.event.setProp("backgroundColor", "yellow");
    arg.event.setProp("textColor", "black");

    //returns the event details object
    const eventProps = arg.event;

    //fonction locataded in the index file
    getSelectedEventDetails(eventProps);
    //
  };

  const handleEventEdit = (event) => {
    //console.log(event);
    dispatch(selectEvent(event.id));
  };

  const handleEventUpdate = async ({ event }) => {
    try {
      dispatch(
        updateEvent(event.id, {
          allDay: event.allDay,
          start: event.start,
          end: event.end,
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleModal = () => {
    dispatch(toggleModal());
  };

  if (loading) return <Loader />;

  if (Events)
    return (
      <MainCard
        sx={{ mt: 0, width: 1 }}
        title="My Day"
        secondary={
          <Stack direction="row" spacing={2}>
            <Button
              style={{
                backgroundColor: selectedEventDetails.backgroundColor,
                color: selectedEventDetails.textColor,
              }}
              onClick={() => handleEventEdit(selectedEventDetails)}
            >
              {selectedEventDetails && `Edit | ${selectedEventDetails.title} `}
            </Button>
            <Button variant="contained" color="primary" onClick={handleOpen}>  View Schedule </Button>
              <Backdrop
                sx={{
                  color: "#fff",
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={openSchedule}
                onClick={handleClose}
              >
               <ViewSchedule handleClose={handleClose}/>
              </Backdrop>
            
          </Stack>
        }
      >
        <Box sx={{ position: "relative" }}>
          <CalendarStyled>
            <Toolbar
              date={date}
              view={calendarView}
              onClickNext={handleDateNext}
              onClickPrev={handleDatePrev}
              onClickToday={handleDateToday}
              onChangeView={handleViewChange}
            />

            <FullCalendar
              weekends={true}
              editable
              droppable
              selectable
              events={events}
              ref={calendarRef}
              rerenderDelay={10}
              initialDate={date}
              initialView={calendarView}
              dayMaxEventRows={3}
              eventDisplay="block"
              headerToolbar={false}
              allDayMaintainDuration
              eventResizableFromStart
              select={handleRangeSelect}
              eventDrop={handleEventUpdate}
              eventClick={handleEventSelect}
              eventResize={handleEventUpdate}
              height={matchDownSM ? "auto" : 720}
              plugins={[
                listPlugin,
                dayGridPlugin,
                timelinePlugin,
                timeGridPlugin,
                interactionPlugin,
              ]}
            />
          </CalendarStyled>

          {/* Dialog renders its body even if not open */}
          <Dialog
            maxWidth="sm"
            TransitionComponent={PopupTransition}
            fullWidth
            onClose={handleModal}
            open={isModalOpen}
            sx={{ "& .MuiDialog-paper": { p: 0 } }}
          >
            <AddEventForm
              events={events}
              event={selectedEvent}
              range={selectedRange}
              onCancel={handleModal}
              curriculum={curriculum}
            />
          </Dialog>
          <Tooltip title="Add New Event">
            <SpeedDial
              ariaLabel="add-event-fab"
              sx={{
                display: "inline-flex",
                position: "sticky",
                bottom: 24,
                left: "100%",
                transform: "translate(-50%, -50% )",
              }}
              icon={<PlusOutlined style={{ fontSize: "1.5rem" }} />}
              onClick={handleModal}
            />
          </Tooltip>
        </Box>
      </MainCard>
    );
};

// to be added back to project views in menu
//Calendar.getLayout = function getLayout(page) {
// return <Layout>{page}</Layout>;
//};

export default Calendar;
