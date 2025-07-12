import PropTypes from "prop-types";
import { useEffect, useState } from "react";

//REDUX
import { useDispatch, useSelector } from "react-redux";
import { addProject } from "store/reducers/projects";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Radio,
  RadioGroup,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import _ from "lodash";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";
import { createId } from "@paralleldrive/cuid2";

// project imports
import MainCard from "components/MainCard";
import AlertProjectDelete from "./AlertProjectDelete";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import { openSnackbar } from "store/reducers/snackbar";
import SimpleEditor from "components/SimpleEditor";
import Date_Picker from "./datePicker";
import TagsPicker from "./tagsPicker";
import GoogleMapAutocomplete from "./google-map-autocomplete";

// assets
import { DeleteFilled } from "@ant-design/icons";

// constant
const getInitialValues = () => {
  const newProject = {
    title: "",
    type: "",
    language: "",
    tags: "",
    description: "",
    location: "",
    shared:true
  };

  return newProject;
};

const types = ["onboarding", "continuous", "other"];

// ==============================|| PROJECT ADD / EDIT / DELETE ||============================== //

const AddProject = ({ project, onCancel,getStateChange }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isCreating = !project;
  // Replace with your authentication logic
  const mockUserData = {
    user: { name: 'John Doe' },
    sub_orgId: 'default-org',
    sub_org_name: 'Default Organization'
  };
  const today = new Date();
  const { projects,isAdding } = useSelector((state) => state.projects);

  const [projectTitle, setProjectTitle] = useState("Title");
  const [projectType, setProjectType] = useState("Type");
  const [projectTags, setProjectTags] = useState(JSON.stringify([]));
  const [projectDescription, setProjectDescription] = useState("Desciption");
  const [projectStartDate, setProjectStartDate] = useState(today);
  const [projectEndDate, setProjectEndDate] = useState(today);
  const [projectLocation, setProjectLocation] = useState("location");

  const ProjectSchema = Yup.object().shape({
    title: Yup.string().max(255).required("Title is required"),
    type: Yup.string().required("Type is required"),
    description: Yup.string().max(191),
  });

  const [openAlert, setOpenAlert] = useState(false);

  const handleAlertClose = () => {
    setOpenAlert(!openAlert);
    onCancel();
  };

  const handleOnChange = (event) => {
    switch (event.target.id) {
      case "project-title":
        setProjectTitle(event.target.value);
        break;
      default:
        console.log("Unhandled event type:", event.target.id);
    }
  };


  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: ProjectSchema,
    onSubmit: (values, { setSubmitting }) => {
      console.log(values);
      try {
        const newProject = {
          sortorder: 1,
          cuid: createId(),
          sub_organizationId: 1,
          createdBy: 'clun74oh10003wszp0rpz6fzy',
          createdAt: today,
          published: values.shared,
          title: values.title,
          summary: projectDescription,
          duration: 180,
          tags: projectTags,
          projectType: values.type,
          projectCategory: "automotive",
          projectStatus: "started",
          startDate: projectStartDate,
          endDate: projectEndDate,
          backgroundImg: "",
          color: "",
          language: values.language,
          location: projectLocation,
        };
        if (project) {
          // dispatch(project(project.id, newCustomer)); - update
          dispatch(
            openSnackbar({
              open: true,
              message: "Project updated successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else {
          dispatch(addProject(newProject, projects,isAdding));
          
          dispatch(
            openSnackbar({
              open: true,
              message: "Project added successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        }

        setSubmitting(true);
        onCancel();
      } catch (error) {
        console.error(error);
      }
    },
  });

  const {
    errors,
    touched,
    handleSubmit,
    isSubmitting,
    getFieldProps,
    setFieldValue,
  } = formik;

  function handleTagsChange(tags) {
    const JSONTags = JSON.stringify(tags);
    setProjectTags(JSONTags);
  }

  function handleTextChange(text) {
    setProjectDescription(text);
  }

  function handleStartDateChange(date) {
    //const mysqlStartDate = new Date(date).toISOString().slice(0, 19).replace("T", " ");
    setProjectStartDate(date);
  }
  function handleEndDateChange(date) {
    //const mysqlEndDate = new Date(date).toISOString().slice(0, 19).replace("T", " ");
    setProjectEndDate(date);
  }

  function handleLocationChange(location) {
    const JSONLocation = JSON.stringify(location)
    setProjectLocation(JSONLocation);
  }

  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit}
            onChange={handleOnChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MainCard
                  title={project ? "Edit Project" : "New Project"}
                  content={false}
                  sx={{ overflow: "visible" }}
                >
                  <CardContent>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid
                            item
                            xs={12}
                            sm={3}
                            lg={3}
                            sx={{ pt: { xs: 2, sm: "1 !important" } }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "end",
                                flexWrap: "wrap",
                                "& > :not(style)": {
                                  mt: 1,
                                  width: 100,
                                  height: 100,
                                },
                              }}
                            >
                              <Paper elevation={3} />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={9} lg={7}>
                            <Typography variant="h3" sx={{ mb: 0 }}>
                              {projectTitle} | {projectType}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Edwind | Created by Marc Nelson
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container spacing={2} alignItems="center">
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
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Project Title :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <TextField
                              fullWidth
                              id="project-title"
                              placeholder="Enter project name"
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
                            sx={{ pt: { xs: 2, sm: "1 !important" } }}
                          >
                            <InputLabel
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Project Type :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <FormControl fullWidth>
                              <Select
                                id="project-title"
                                displayEmpty
                                {...getFieldProps("type")}
                                onChange={(event) => {
                                  setFieldValue("type", event.target.value);
                                  setProjectType(event.target.value);
                                }}
                                input={
                                  <OutlinedInput
                                    id="select-column-hiding"
                                    placeholder="Sort by"
                                  />
                                }
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return (
                                      <Typography variant="subtitle1">
                                        Select Status
                                      </Typography>
                                    );
                                  }

                                  return (
                                    <Typography variant="subtitle2">
                                      {selected}
                                    </Typography>
                                  );
                                }}
                              >
                                {types.map((column) => (
                                  <MenuItem key={column} value={column}>
                                    <ListItemText primary={column} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {touched.type && errors.type && (
                              <FormHelperText
                                error
                                id="standard-weight-helper-text-email-login"
                                sx={{ pl: 1.75 }}
                              >
                                {errors.type}
                              </FormHelperText>
                            )}
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={3}
                            lg={3}
                            sx={{ pt: { xs: 2, sm: "1 !important" } }}
                          >
                            <InputLabel
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Language :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <RadioGroup
                              row
                              id="project-language"
                              name="language"
                              {...getFieldProps("language")}
                            >
                              <FormControlLabel
                                value="english"
                                control={<Radio />}
                                label="English"
                              />
                              <FormControlLabel
                                value="french"
                                control={<Radio />}
                                label="French"
                              />
                            </RadioGroup>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container spacing={3} alignItems="center">
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
                              sx={{
                                textAlign: { xs: "left", sm: "right" },
                              }}
                            >
                              Tags :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <TagsPicker handleTagsChange={handleTagsChange} />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={3}
                            lg={3}
                            sx={{
                              alignSelf: "flex-start",
                              pt: { xs: 2, sm: "1 !important" },
                            }}
                          >
                            <InputLabel
                              sx={{
                                textAlign: { xs: "left", sm: "right" },
                              }}
                            >
                              Description :
                            </InputLabel>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={8}
                            lg={7}
                            sx={{
                              "& .quill": {
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? "dark.main"
                                    : "grey.50",
                                borderRadius: "4px",
                                "& .ql-toolbar": {
                                  bgcolor:
                                    theme.palette.mode === "dark"
                                      ? "dark.light"
                                      : "grey.100",
                                  borderColor: theme.palette.divider,
                                  borderTopLeftRadius: "4px",
                                  borderTopRightRadius: "4px",
                                },
                                "& .ql-container": {
                                  borderColor: `${theme.palette.divider} !important`,
                                  borderBottomLeftRadius: "4px",
                                  borderBottomRightRadius: "4px",
                                  "& .ql-editor": {
                                    minHeight: 225,
                                  },
                                },
                              },
                            }}
                          >
                            <SimpleEditor handleTextChange={handleTextChange} />
                          </Grid>

                          <Grid
                            item
                            xs={12}
                            sm={3}
                            lg={3}
                            sx={{
                              alignSelf: "flex-start",
                              pt: { xs: 2, sm: "1 !important" },
                            }}
                          >
                            <InputLabel
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Dates :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <Date_Picker
                              handleStartDateChange={handleStartDateChange}
                              handleEndDateChange={handleEndDateChange}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid
                            item
                            xs={12}
                            sm={3}
                            lg={3}
                            sx={{
                              pt: { xs: 20, sm: "1 !important" },
                            }}
                          >
                            <InputLabel
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Location :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={12} sm={8} lg={7}>
                            <GoogleMapAutocomplete
                              handleLocationChange={handleLocationChange}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container spacing={2} alignItems="center">
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
                              sx={{ textAlign: { xs: "left", sm: "right" } }}
                            >
                              Shared :
                            </InputLabel>
                          </Grid>
                          <Grid item xs={10} sm={6} lg={5}>
                            <Typography variant="caption" color="textSecondary">
                              Make this project available to Everyone in the
                              organization
                            </Typography>
                          </Grid>
                          <Grid item xs={2} sm={2} lg={2}>
                            <FormControlLabel
                              id="project-shared"
                              control={
                                <Switch
                                  {...getFieldProps("shared")}
                                  checked={formik.values.shared}
                                  sx={{ mt: 0 }}
                                />
                              }
                              label=""
                              labelPlacement="start"
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid
                          container
                          spacing={2}
                          justifyContent="end"
                          alignItems="center"
                        >
                          <Grid item>
                            {!isCreating && (
                              <Tooltip title="Delete Project" placement="top">
                                <IconButton
                                  onClick={() => setOpenAlert(true)}
                                  size="large"
                                  color="error"
                                >
                                  <DeleteFilled />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Grid>

                          <Grid item xs={8} sm={3.7} lg={4.7}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Button color="error" onClick={onCancel}>
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                              >
                                {project ? "Edit" : "Add"}
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MainCard>
              </Grid>
            </Grid>
          </Form>
        </LocalizationProvider>
      </FormikProvider>
      {!isCreating && (
        <AlertProjectDelete
          title={project.title}
          open={openAlert}
          handleClose={handleAlertClose}
        />
      )}
    </>
  );
};

AddProject.propTypes = {
  project: PropTypes.object,
  onCancel: PropTypes.func,
};

export default AddProject;
