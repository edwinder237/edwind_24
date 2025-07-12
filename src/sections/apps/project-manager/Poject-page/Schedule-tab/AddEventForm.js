import PropTypes from "prop-types";
import { useEffect, useState, useCallback, useMemo } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Accordion,
  AccordionActions,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  CardContent,
  DialogActions,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Radio,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  LocalizationProvider,
  MobileDateTimePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import _ from "lodash";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";

// project imports
import ColorPalette from "./ColorPalette";
import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import AddCourse from "./addEventForm/addCourse";
import AddInstructors from "./addEventForm/addInstructor";
import Suggestions from "./addEventForm/suggestions";

import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { createEvent, deleteEvent, updateEvent } from "store/reducers/calendar";

// assets
import { CalendarOutlined, DeleteFilled } from "@ant-design/icons";

// constant
const getInitialValues = (event, range) => {
  const newEvent = {
    title: "",
    description: "",
    color: "#1890ff",
    textColor: "#fff",
    allDay: false,
    start: range ? new Date(range.start) : new Date(),
    end: range ? new Date(range.end) : new Date(),
  };

  if (event || range) {
    return _.merge({}, newEvent, event);
  }

  return newEvent;
};

// ==============================|| CALENDAR EVENT ADD / EDIT / DELETE ||============================== //

const AddEventFrom = ({ event, range, onCancel, events }) => {
  const theme = useTheme();
  const { isAdding } = useSelector((state) => state.calendar);

  const [eventType, setEventType] = useState("course");
  const [participants, setParticipants] = useState("no participants");
  const isCreating = !event;
  const groups = ["group 1", "group 2", "group 3"];

  const backgroundColor = [
    {
      value: "#bf00ff",
      color: "primary.main",
    },
    {
      value: theme.palette.error.main,
      color: "error.main",
    },
    {
      value: theme.palette.success.main,
      color: "success.main",
    },
    {
      value: theme.palette.secondary.main,
      color: "secondary.main",
    },
    {
      value: theme.palette.warning.main,
      color: "warning.main",
    },
    {
      value: theme.palette.primary.lighter,
      color: "primary.lighter",
    },
    {
      value: theme.palette.error.lighter,
      color: "error.lighter",
    },
    {
      value: theme.palette.success.lighter,
      color: "success.lighter",
    },
    {
      value: theme.palette.secondary.lighter,
      color: "secondary.lighter",
    },
    {
      value: theme.palette.warning.lighter,
      color: "warning.lighter",
    },
  ];

  const textColor = [
    {
      value: "#fff",
      color: "white",
    },
    {
      value: theme.palette.error.lighter,
      color: "error.lighter",
    },
    {
      value: theme.palette.success.lighter,
      color: "success.lighter",
    },
    {
      value: theme.palette.secondary.lighter,
      color: "secondary.lighter",
    },
    {
      value: theme.palette.warning.lighter,
      color: "warning.lighter",
    },
    {
      value: theme.palette.primary.lighter,
      color: "primary.lighter",
    },
    {
      value: theme.palette.primary.main,
      color: "primary.main",
    },
    {
      value: theme.palette.error.main,
      color: "error.main",
    },
    {
      value: theme.palette.success.main,
      color: "success.main",
    },
    {
      value: theme.palette.secondary.main,
      color: "secondary.main",
    },
    {
      value: theme.palette.warning.main,
      color: "warning.main",
    },
  ];

  const EventSchema = Yup.object().shape({
    title: Yup.string().max(255).required("Title is required"),
    description: Yup.string().max(5000),
    end: Yup.date().when(
      "start",
      (start, schema) =>
        start && schema.min(start, "End date must be later than start date")
    ),
    start: Yup.date(),
    color: Yup.string().max(255),
    textColor: Yup.string().max(255),
  });
  const deleteHandler = () => {
    dispatch(deleteEvent(event?.id, events));
    dispatch(
      openSnackbar({
        open: true,
        message: "Event deleted successfully.",
        variant: "alert",
        alert: {
          color: "success",
        },
        close: false,
      })
    );
  };
  const formik = useFormik({
    initialValues: getInitialValues(event, range),
    validationSchema: EventSchema,
    onSubmit: (values, { setSubmitting }) => {
      try {
        const newEvent = {
          title: values.title,
          description: values.description,
          color: values.color,
          textColor: values.textColor,
          allDay: values.allDay,
          start: values.start,
          end: values.end,
          projectId:3
        };
        if (event) {
          console.log("updating", event);
          dispatch(updateEvent(event.id, newEvent, events));
          dispatch(
            openSnackbar({
              open: true,
              message: "Event updated successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else {
          console.log(newEvent, events);

          dispatch(createEvent(newEvent, events, isAdding));

          dispatch(
            openSnackbar({
              open: true,
              message: "Event added successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        }

        setSubmitting(false);
      } catch (error) {
        console.error(error);
      }
    },
  });

  const {
    values,
    errors,
    touched,
    handleSubmit,
    isSubmitting,
    getFieldProps,
    setFieldValue,
  } = formik;

  return (
    <FormikProvider value={formik}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
          <MainCard
            title={event ? "Edit Event" : "Add Event"}
            content={false}
            sx={{ overflow: "visible" }}
          >
            <CardContent>
              <Grid
                container
                spacing={3}
                sx={{ padding: 0, alignItems: "center" }}
              >
                <Grid
                  item
                  xs={12}
                  sm={3}
                  lg={3}
                  sx={{ pt: { xs: 2, sm: "1 !important" } }}
                >
                  <InputLabel
                    htmlFor="cal-title"
                    sx={{ textAlign: { xs: "left", sm: "right" } }}
                  >
                    Title
                  </InputLabel>
                </Grid>
                <Grid item xs={12} sm={8} lg={7}>
                  <TextField
                    fullWidth
                    id="cal-title"
                    placeholder="Title"
                    {...getFieldProps("title")}
                    error={Boolean(touched.title && errors.title)}
                    helperText={touched.title && errors.title}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={3}
                  lg={3}
                  sx={{
                    pt: { xs: 2, sm: "1 !important" },
                    alignSelf: "flex-start",
                  }}
                >
                  <InputLabel
                    htmlFor="cal-description"
                    sx={{ textAlign: { xs: "left", sm: "right" } }}
                  >
                    Description
                  </InputLabel>
                </Grid>
                <Grid item xs={12} sm={8} lg={7}>
                  <TextField
                    fullWidth
                    id="cal-description"
                    multiline
                    rows={3}
                    placeholder="Description"
                    {...getFieldProps("description")}
                    error={Boolean(touched.description && errors.description)}
                    helperText={touched.description && errors.description}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={3}
                  lg={3}
                  sx={{ pt: { xs: 2, sm: "1 !important" } }}
                >
                  <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                    Event type
                  </InputLabel>
                </Grid>
                <Grid item xs={12} sm={8} lg={7}>
                  <RadioGroup
                    row
                    id="project-language"
                    name="language"
                    defaultValue="course"
                    {...getFieldProps("language")}
                  >
                    <FormControlLabel
                      value="course"
                      control={<Radio />}
                      label="Course"
                      onChange={(e) => setEventType(e.target.value)}
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio />}
                      label="Other"
                      onChange={(e) => setEventType(e.target.value)}
                    />
                  </RadioGroup>
                </Grid>
                <Grid item sx={{ pt: { xs: 2, sm: "1 !important" } }}>
                  {eventType === "course" && (
                    <Grid container spacing={2}>
                      <Grid
                        item
                        xs={12}
                        sm={3}
                        lg={3}
                        sx={{ pt: { xs: 2, sm: "1 !important" } }}
                      >
                        <InputLabel
                          htmlFor="cal-participants"
                          sx={{ textAlign: { xs: "left", sm: "right" } }}
                        >
                          Instructor
                        </InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={8} lg={7}>
                        <AddInstructors />
                      </Grid>

                      <Grid item xs={12} sm={3} lg={3} sx={{}}>
                        {" "}
                      </Grid>
                      <Grid item xs={12} sm={8} lg={7} sx={{ mt: -1 }}>
                        <Suggestions />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={3}
                        lg={3}
                        sx={{ pt: { xs: 2, sm: "1 !important" } }}
                      >
                        <InputLabel
                          htmlFor="cal-participants"
                          sx={{ textAlign: { xs: "left", sm: "right" } }}
                        >
                          Course
                        </InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={8} lg={8}>
                        <AddCourse eventId={event?.id} />
                      </Grid>

                      <Grid
                        item
                        xs={12}
                        sm={3}
                        lg={3}
                        sx={{ pt: { xs: 2, sm: "1 !important" } }}
                      >
                        <InputLabel
                          htmlFor="cal-participants"
                          sx={{ textAlign: { xs: "left", sm: "right" } }}
                        >
                          Groups
                        </InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={8} lg={7}>
                        <FormControl fullWidth>
                          <Select
                            labelId="cal-participants"
                            id="cal-participants"
                            value={participants}
                            onChange={(e) => setParticipants(e.target.value)}
                          >
                            {groups.map((group) => (
                              <MenuItem value={group}>{group}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={3}
                  lg={3}
                  sx={{ pt: { xs: 2, sm: "1 !important" } }}
                >
                  <InputLabel
                    htmlFor="cal-participants"
                    sx={{ textAlign: { xs: "left", sm: "right" } }}
                  >
                    allDay
                  </InputLabel>
                </Grid>

                <Grid item xs={12} sm={8} lg={7}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.allDay}
                        {...getFieldProps("allDay")}
                      />
                    }
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={3}
                  lg={3}
                  sx={{ pt: { xs: 2, sm: "1 !important" } }}
                >
                  <InputLabel
                    htmlFor="cal-start-date"
                    sx={{ textAlign: { xs: "left", sm: "right" } }}
                  >
                    Date
                  </InputLabel>
                </Grid>

                <Grid item xs={12} sm={8} lg={7}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1.25}>
                        <InputLabel htmlFor="cal-start-date">
                          Start Date
                        </InputLabel>
                        <MobileDateTimePicker
                          value={new Date(values.start)}
                          format="dd/MM/yyyy hh:mm a"
                          onChange={(date) => setFieldValue("start", date)}
                          slotProps={{
                            textField: {
                              InputProps: {
                                endAdornment: (
                                  <InputAdornment
                                    position="end"
                                    sx={{ cursor: "pointer" }}
                                  >
                                    <CalendarOutlined />
                                  </InputAdornment>
                                ),
                              },
                            },
                          }}
                        />
                        {touched.start && errors.start && (
                          <FormHelperText error={true}>
                            {errors.start}
                          </FormHelperText>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1.25}>
                        <InputLabel htmlFor="cal-end-date">End Date</InputLabel>
                        <MobileDateTimePicker
                          value={new Date(values.end)}
                          format="dd/MM/yyyy hh:mm a"
                          onChange={(date) => setFieldValue("end", date)}
                          slotProps={{
                            textField: {
                              InputProps: {
                                endAdornment: (
                                  <InputAdornment
                                    position="end"
                                    sx={{ cursor: "pointer" }}
                                  >
                                    <CalendarOutlined />
                                  </InputAdornment>
                                ),
                              },
                            },
                          }}
                        />
                        {touched.end && errors.end && (
                          <FormHelperText error={true}>
                            {errors.end}
                          </FormHelperText>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={12} lg={12}>
                  <Accordion sx={{ border: "none" }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1-content"
                      id="panel1-header"
                      sx={{ borderBottom: 'none' }} 
                    >
                      Advanded Settings
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid
                          item
                          xs={12}
                          sm={3}
                          lg={3}
                          sx={{
                            pt: { xs: 2, sm: "1 !important" },
                          }}
                        >
                          <InputLabel
                            htmlFor="background-color"
                            sx={{ textAlign: { xs: "left", sm: "right" } }}
                          >
                            Background Color
                          </InputLabel>
                        </Grid>

                        <Grid item xs={12} sm={8} lg={7}>
                          <FormControl>
                            <RadioGroup
                              row
                              aria-label="color"
                              {...getFieldProps("color")}
                              onChange={(e) =>
                                setFieldValue("color", e.target.value)
                              }
                              name="color-radio-buttons-group"
                              sx={{ "& .MuiFormControlLabel-root": { mr: 2 } }}
                            >
                              {backgroundColor.map((item, index) => (
                                <ColorPalette
                                  key={index}
                                  value={item.value}
                                  color={item.color}
                                />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={3}
                          lg={3}
                          sx={{
                            pt: { xs: 2, sm: "1 !important" },
                          }}
                        >
                          <InputLabel
                            htmlFor="text-color"
                            sx={{ textAlign: { xs: "left", sm: "right" } }}
                          >
                            Text Color
                          </InputLabel>
                        </Grid>
                        <Grid item xs={12} sm={8} lg={7}>
                          <FormControl component="fieldset">
                            <RadioGroup
                              row
                              aria-label="textColor"
                              {...getFieldProps("textColor")}
                              onChange={(e) =>
                                setFieldValue("textColor", e.target.value)
                              }
                              name="text-color-radio-buttons-group"
                              sx={{ "& .MuiFormControlLabel-root": { mr: 2 } }}
                            >
                              {textColor.map((item, index) => (
                                <ColorPalette
                                  key={index}
                                  value={item.value}
                                  color={item.color}
                                />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <DialogActions sx={{ p: 2.5 }}>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
                <Grid item>
                  {!isCreating && (
                    <Tooltip title="Delete Event" placement="top">
                      <IconButton
                        onClick={deleteHandler}
                        size="large"
                        color="error"
                      >
                        <DeleteFilled />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
                <Grid item>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button color="error" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {event ? "Save" : "Add"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </DialogActions>
          </MainCard>
        </Form>
      </LocalizationProvider>
    </FormikProvider>
  );
};

AddEventFrom.propTypes = {
  event: PropTypes.object,
  range: PropTypes.object,
  onCancel: PropTypes.func,
};

export default AddEventFrom;
