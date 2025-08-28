import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//REDUX
import { useDispatch, useSelector } from "store";
import { addProject, updateProject, getProjects } from "store/reducers/projects";
import { setLoading, clearLoading } from "store/reducers/loading";
import axios from "utils/axios";

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
  Stepper,
  Step,
  StepLabel,
  Fade,
  Zoom
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
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
import TrainingRecipientPicker from "./TrainingRecipientPicker";
import InstructorPicker from "./InstructorPicker";
import GoogleMapAutocomplete from "./google-map-autocomplete";
import CurriculumPicker from "./CurriculumPicker";

// assets
import { 
  DeleteFilled,
  InfoCircleOutlined,
  BookOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";

// constant
const getInitialValues = (project) => {
  if (project) {
    // Editing existing project - populate with current values
    return {
      title: project.title || "",
      type: project.projectType || project.type || "",
      language: project.language || "English",
      tags: project.tags || "", // Topics
      description: project.summary || project.description || "",
      location: project.location || "",
      trainingRecipient: project.trainingRecipientId ? project.trainingRecipientId.toString() : "",
      instructor: project.instructorId ? project.instructorId.toString() : "",
      curriculum: project.curriculumId ? project.curriculumId.toString() : "",
      shared: project.published !== undefined ? project.published : project.sharing || true,
      backgroundImg: project.backgroundImg || ""
    };
  }
  
  // Creating new project - use empty values
  const newProject = {
    title: "",
    type: "",
    language: "English",
    tags: "", // Topics
    description: "",
    location: "",
    trainingRecipient: "",
    instructor: "",
    curriculum: "",
    shared: true,
    backgroundImg: ""
  };

  return newProject;
};

const types = [
  "Onboarding", 
  "Continuous", 
  "Consultation", 
  "Event", 
  "Presentation", 
  "Certification", 
  "Other"
];

// Step configurations
const steps = [
  {
    label: 'Basic Information',
    description: 'Project title, type, and recipient',
    icon: <InfoCircleOutlined />
  },
  {
    label: 'Content & Topics',
    description: 'Description, topics, and language',
    icon: <BookOutlined />
  },
  {
    label: 'Schedule & Location',
    description: 'Dates and location details',
    icon: <SettingOutlined />
  },
  {
    label: 'Review & Submit',
    description: 'Final review and settings',
    icon: <CheckCircleOutlined />
  }
];

// ==============================|| PROJECT ADD / EDIT / DELETE ||============================== //

const AddProject = ({ project, onCancel,getStateChange }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const isCreating = !project;
  // Replace with your authentication logic
  const mockUserData = {
    user: { name: 'John Doe' },
    sub_orgId: 'default-org',
    sub_org_name: 'Default Organization'
  };
  const today = new Date();
  const { projects,isAdding } = useSelector((state) => state.projects);

  // Step management
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const [projectTitle, setProjectTitle] = useState(project?.title || "Title");
  const [projectType, setProjectType] = useState(project?.projectType || project?.type || "Type");
  const [projectTopics, setProjectTopics] = useState(project?.tags || JSON.stringify([]));
  const [projectDescription, setProjectDescription] = useState(project?.summary || project?.description || "Description");
  const [projectStartDate, setProjectStartDate] = useState(project?.startDate ? new Date(project.startDate) : today);
  const [projectEndDate, setProjectEndDate] = useState(project?.endDate ? new Date(project.endDate) : today);
  const [projectLocation, setProjectLocation] = useState(project?.location || "location");
  const [selectedTrainingRecipient, setSelectedTrainingRecipient] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  // Set initial training recipient for editing
  useEffect(() => {
    if (project?.trainingRecipientId) {
      // If editing a project, we need to fetch the training recipient details
      const fetchTrainingRecipient = async () => {
        try {
          const response = await axios.get('/api/training-recipients/fetchTrainingRecipients', {
            params: {
              sub_organizationId: 1 // TODO: Get from current user's sub-organization
            }
          });
          const recipient = response.data.find(r => r.id === project.trainingRecipientId);
          if (recipient) {
            setSelectedTrainingRecipient(recipient);
          }
        } catch (error) {
          console.error('Error fetching training recipient for editing:', error);
        }
      };
      fetchTrainingRecipient();
    }
  }, [project]);

  // Set initial instructor for editing
  useEffect(() => {
    if (project?.instructorId) {
      // If editing a project, we need to fetch the instructor details
      const fetchInstructor = async () => {
        try {
          const response = await axios.get('/api/instructors/fetchInstructors', {
            params: {
              status: 'active'
            }
          });
          const instructor = response.data.find(i => i.id === project.instructorId);
          if (instructor) {
            setSelectedInstructor(instructor);
          }
        } catch (error) {
          console.error('Error fetching instructor for editing:', error);
        }
      };
      fetchInstructor();
    }
  }, [project]);

  // Set initial curriculum for editing
  useEffect(() => {
    // Check if project has curriculum data through project_curriculums relation
    if (project?.project_curriculums && project.project_curriculums.length > 0) {
      // Get the first curriculum (assuming one curriculum per project for now)
      const projectCurriculum = project.project_curriculums[0];
      if (projectCurriculum?.curriculum) {
        setSelectedCurriculum(projectCurriculum.curriculum);
        setFieldValue("curriculum", projectCurriculum.curriculum.id.toString());
      }
    } else if (project?.curriculumId) {
      // Fallback: If curriculumId is directly on project, fetch the curriculum details
      const fetchCurriculum = async () => {
        try {
          const response = await axios.get('/api/curriculums/fetchCurriculums');
          const curriculum = response.data.find(c => c.id === project.curriculumId);
          if (curriculum) {
            setSelectedCurriculum(curriculum);
            setFieldValue("curriculum", curriculum.id.toString());
          }
        } catch (error) {
          console.error('Error fetching curriculum for editing:', error);
        }
      };
      fetchCurriculum();
    }
  }, [project]);

  const ProjectSchema = Yup.object().shape({
    title: Yup.string().max(255).required("Title is required"),
    type: Yup.string().required("Type is required"),
    description: Yup.string().max(191),
    trainingRecipient: Yup.string().required("Training recipient is required"),
    curriculum: Yup.string().required("Curriculum is required"),
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
    initialValues: getInitialValues(project),
    validationSchema: ProjectSchema,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('Form values:', values);
      console.log('Selected instructor state:', selectedInstructor);
      console.log('Selected training recipient state:', selectedTrainingRecipient);
      console.log('Selected curriculum state:', selectedCurriculum);
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
          tags: projectTopics,
          projectType: values.type,
          projectCategory: "automotive",
          projectStatus: "started",
          startDate: projectStartDate,
          endDate: projectEndDate,
          backgroundImg: values.backgroundImg || "",
          color: "",
          language: values.language,
          location: projectLocation,
          trainingRecipientId: selectedTrainingRecipient ? selectedTrainingRecipient.id : null,
          instructorId: selectedInstructor ? selectedInstructor.id : null,
          curriculumId: selectedCurriculum ? selectedCurriculum.id : null,
        };
        if (project) {
          // Update existing project
          const updateData = {
            id: project.id,
            title: values.title,
            description: projectDescription,
            type: values.type,
            tags: projectTopics,
            startDate: projectStartDate,
            endDate: projectEndDate,
            language: values.language,
            location: projectLocation,
            trainingRecipientId: selectedTrainingRecipient ? selectedTrainingRecipient.id : null,
            instructorId: selectedInstructor ? selectedInstructor.id : null,
            curriculumId: selectedCurriculum ? selectedCurriculum.id : null,
            sharing: values.shared,
            backgroundImg: values.backgroundImg || ""
          };
          
          dispatch(updateProject(updateData)).then(async (result) => {
            if (result.success) {
              // If an instructor was selected, update their assignment as main project instructor
              if (selectedInstructor) {
                try {
                  // First check if instructor is already assigned to project
                  const existingResponse = await axios.get(`/api/projects/instructors?projectId=${project.id}`);
                  const existingInstructors = existingResponse.data.instructors || [];
                  const existingInstructor = existingInstructors.find(pi => pi.instructor.id === selectedInstructor.id);
                  
                  if (existingInstructor) {
                    // Update existing instructor to main type
                    await axios.put(`/api/projects/instructors?projectId=${project.id}`, {
                      instructorId: selectedInstructor.id,
                      instructorType: 'main'
                    });
                  } else {
                    // Add new instructor as main
                    await axios.post(`/api/projects/instructors?projectId=${project.id}`, {
                      instructorId: selectedInstructor.id,
                      instructorType: 'main'
                    });
                  }
                } catch (error) {
                  console.error('Error updating instructor assignment:', error);
                  // Don't fail the project update if instructor assignment fails
                }
              }

              // Refresh the projects list to show updated data
              dispatch(getProjects());
              
              dispatch(
                openSnackbar({
                  open: true,
                  message: result.message || "Project updated successfully.",
                  variant: "alert",
                  alert: {
                    color: "success",
                  },
                  close: false,
                })
              );
              onCancel(); // Close the modal after successful update
            } else {
              dispatch(
                openSnackbar({
                  open: true,
                  message: result.message || "Failed to update project.",
                  variant: "alert",
                  alert: {
                    color: "error",
                  },
                  close: false,
                })
              );
            }
            setSubmitting(false);
          });
        } else {
          // Create new project
          dispatch(setLoading({
            message: "Creating your project...",
            subtitle: "Setting up your workspace and redirecting you to the project page",
            type: "project-creation"
          }));
          
          const result = await dispatch(addProject(newProject, projects, isAdding));
          
          if (result.success) {
            // If an instructor was selected, assign them as the main project instructor
            if (selectedInstructor) {
              try {
                await axios.post(`/api/projects/instructors?projectId=${result.projectId}`, {
                  instructorId: selectedInstructor.id,
                  instructorType: 'main'
                });
              } catch (error) {
                console.error('Error assigning instructor to project:', error);
                // Don't fail the project creation if instructor assignment fails
              }
            }

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
            
            // Close modal but keep loading overlay during redirect
            onCancel();
            
            // Update loading message for navigation
            dispatch(setLoading({
              message: "Redirecting to project...",
              subtitle: "Opening your new project workspace",
              type: "navigation"
            }));
            
            // Small delay to show success message then redirect
            setTimeout(() => {
              router.push(`/projects/${result.projectId}`);
            }, 1000);
          } else {
            dispatch(clearLoading());
            dispatch(
              openSnackbar({
                open: true,
                message: result.error || "Failed to create project.",
                variant: "alert",
                alert: {
                  color: "error",
                },
                close: false,
              })
            );
            setSubmitting(false);
          }
        }
      } catch (error) {
        console.error(error);
        dispatch(clearLoading());
        setSubmitting(false);
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
    setFieldTouched,
  } = formik;

  function handleTopicsChange(topics) {
    const JSONTopics = JSON.stringify(topics);
    setProjectTopics(JSONTopics);
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
    if (location) {
      const JSONLocation = JSON.stringify(location);
      setProjectLocation(JSONLocation);
      
      // If location has an image URL, set it as the background image
      if (location.imageUrl) {
        setFieldValue('backgroundImg', location.imageUrl);
        
        dispatch(
          openSnackbar({
            open: true,
            message: `Location image has been set as project background: ${location.description}`,
            variant: "alert",
            alert: {
              color: "success",
            },
            close: false,
          })
        );
      }
    } else {
      setProjectLocation('');
    }
  }

  function handleTrainingRecipientChange(recipient) {
    setSelectedTrainingRecipient(recipient);
    // Update the form value with the recipient ID (convert to string for validation)
    setFieldValue("trainingRecipient", recipient && recipient.id ? recipient.id.toString() : "");
  }

  function handleInstructorChange(instructor) {
    console.log('Instructor changed:', instructor);
    setSelectedInstructor(instructor);
    // Update the form value with the instructor ID (convert to string for validation)
    setFieldValue("instructor", instructor && instructor.id ? instructor.id.toString() : "");
    
    // Force validation to ensure form recognizes the change
    if (instructor && instructor.id) {
      setFieldTouched('instructor', true, false);
    }
  }

  function handleCurriculumChange(curriculum) {
    setSelectedCurriculum(curriculum);
    // Update the form value with the curriculum ID (convert to string for validation)
    setFieldValue("curriculum", curriculum && curriculum.id ? curriculum.id.toString() : "");
  }

  // Step navigation functions
  const handleNext = (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Step 1: Basic Information - validate title, type, training recipient, curriculum
      if (!formik.values.title || !formik.values.type || !formik.values.trainingRecipient || !formik.values.curriculum) {
        dispatch(openSnackbar({
          open: true,
          message: 'Please complete all required fields in this step.',
          variant: 'alert',
          alert: { color: 'warning' }
        }));
        return;
      }
    }

    setCompletedSteps(prev => new Set([...prev, activeStep]));
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Custom form submit handler
  const handleFormSubmit = (e) => {
    // Only allow submission if we're on the final step
    if (activeStep !== steps.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // If we're on the final step, let Formik handle the submission
    handleSubmit(e);
  };

  const getStepIcon = (step, index) => {
    if (completedSteps.has(index)) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (index === activeStep) {
      return step.icon;
    }
    return step.icon;
  };

  // Step content renderers
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderContentAndTopics();
      case 2:
        return renderScheduleAndLocation();
      case 3:
        return renderReviewAndSubmit();
      default:
        return null;
    }
  };

  const renderBasicInformation = () => (
    <Fade in={activeStep === 0}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Enter the essential details for your project
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Project Title *"
              placeholder="Enter project name"
              {...getFieldProps("title")}
              error={Boolean(touched.title && errors.title)}
              helperText={touched.title && errors.title}
              onChange={(e) => {
                // Convert to camel case: capitalize first letter of each word
                const camelCaseValue = e.target.value
                  .toLowerCase()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                setFieldValue("title", camelCaseValue);
                setProjectTitle(camelCaseValue);
              }}
              inputProps={{ 
                style: { textTransform: 'none' } // Prevent any CSS text transform
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Project Type *</InputLabel>
              <Select
                {...getFieldProps("type")}
                onChange={(event) => {
                  setFieldValue("type", event.target.value);
                  setProjectType(event.target.value);
                }}
                error={Boolean(touched.type && errors.type)}
              >
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {touched.type && errors.type && (
                <FormHelperText error>{errors.type}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Training Recipient *
            </Typography>
            <TrainingRecipientPicker
              handleTrainingRecipientChange={handleTrainingRecipientChange}
              initialValue={selectedTrainingRecipient}
              error={Boolean(touched.trainingRecipient && errors.trainingRecipient)}
              helperText={touched.trainingRecipient && errors.trainingRecipient}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Curriculum *
            </Typography>
            <CurriculumPicker
              handleCurriculumChange={handleCurriculumChange}
              initialValue={selectedCurriculum}
              error={Boolean(touched.curriculum && errors.curriculum)}
              helperText={touched.curriculum && errors.curriculum}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Instructor
            </Typography>
            <InstructorPicker
              handleInstructorChange={handleInstructorChange}
              initialValue={selectedInstructor}
              error={Boolean(touched.instructor && errors.instructor)}
              helperText={touched.instructor && errors.instructor}
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderContentAndTopics = () => (
    <Fade in={activeStep === 1}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Content & Topics
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Define the content, topics, and language for your project
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Topics
            </Typography>
            <TagsPicker 
              handleTagsChange={handleTopicsChange} 
              initialValue={project?.tags || []}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Language
            </Typography>
            <RadioGroup
              row
              {...getFieldProps("language")}
            >
              <FormControlLabel
                value="English"
                control={<Radio />}
                label="English"
              />
              <FormControlLabel
                value="French"
                control={<Radio />}
                label="French"
              />
            </RadioGroup>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Background Image URL
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter image URL for project card (e.g., https://example.com/image.jpg)"
              {...getFieldProps("backgroundImg")}
              helperText="Optional: Add a custom image URL for your project card"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            <Box sx={{ 
              '& .quill': {
                bgcolor: theme.palette.mode === 'dark' ? 'dark.main' : 'grey.50',
                borderRadius: '4px',
                '& .ql-toolbar': {
                  bgcolor: theme.palette.mode === 'dark' ? 'dark.light' : 'grey.100',
                  borderColor: theme.palette.divider,
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                },
                '& .ql-container': {
                  borderColor: `${theme.palette.divider} !important`,
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px',
                  '& .ql-editor': {
                    minHeight: 200,
                  },
                },
              },
            }}>
              <SimpleEditor handleTextChange={handleTextChange} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderScheduleAndLocation = () => (
    <Fade in={activeStep === 2}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Schedule & Location
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Set the dates and location for your project
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Project Dates
            </Typography>
            <Date_Picker
              handleStartDateChange={handleStartDateChange}
              handleEndDateChange={handleEndDateChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Location
            </Typography>
            <GoogleMapAutocomplete
              handleLocationChange={handleLocationChange}
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderReviewAndSubmit = () => (
    <Fade in={activeStep === 3}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Review your project details and submit
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Project Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Title:</Typography>
                  <Typography variant="body1">{formik.values.title}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Type:</Typography>
                  <Typography variant="body1">{formik.values.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Language:</Typography>
                  <Typography variant="body1">{formik.values.language}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Training Recipient:</Typography>
                  <Typography variant="body1">{selectedTrainingRecipient?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Curriculum:</Typography>
                  <Typography variant="body1">{selectedCurriculum?.title || 'Not selected'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Instructor:</Typography>
                  <Typography variant="body1">
                    {selectedInstructor ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}` : 'Not selected'}
                  </Typography>
                </Grid>
                {formik.values.backgroundImg && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Background Image:</Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {formik.values.backgroundImg}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  {...getFieldProps("shared")}
                  checked={formik.values.shared}
                />
              }
              label="Make this project available to everyone in the organization"
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form
            autoComplete="off"
            noValidate
            onSubmit={handleFormSubmit}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MainCard
                  title={project ? "Edit Project" : "New Project"}
                  content={false}
                  sx={{ overflow: "visible" }}
                >
                  <Box sx={{ p: 4 }}>
                    {/* Horizontal Stepper */}
                    <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
                      {steps.map((step, index) => (
                        <Step key={step.label} completed={completedSteps.has(index)}>
                          <StepLabel 
                            icon={getStepIcon(step, index)}
                            onClick={() => handleStepClick(index)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <Typography variant="subtitle1">{step.label}</Typography>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>

                    {/* Step Content */}
                    <Box sx={{ minHeight: 400, px: 2, py: 3, maxWidth: 800, mx: 'auto' }}>
                      {renderStepContent(activeStep)}
                    </Box>

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                      <Box>
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
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                          type="button"
                          color="secondary" 
                          onClick={onCancel}
                          variant="outlined"
                        >
                          Cancel
                        </Button>
                        
                        {activeStep > 0 && (
                          <Button
                            type="button"
                            onClick={handleBack}
                            startIcon={<ArrowLeftOutlined />}
                            variant="outlined"
                          >
                            Back
                          </Button>
                        )}
                        
                        {activeStep < steps.length - 1 ? (
                          <Button
                            type="button"
                            onClick={handleNext}
                            endIcon={<ArrowRightOutlined />}
                            variant="contained"
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                          >
                            {project ? "Update Project" : "Create Project"}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
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
