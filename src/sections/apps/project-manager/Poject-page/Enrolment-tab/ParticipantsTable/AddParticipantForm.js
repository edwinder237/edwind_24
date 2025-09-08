import PropTypes from "prop-types";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "store";
import { v4 as uuidv4 } from "uuid";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  createFilterOptions,
  Dialog,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";

// project imports
import AlertCustomerDelete from "../AlertCustomerDelete";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import { openSnackbar } from "store/reducers/snackbar";
import ColorPalette from "../ColorPalette";
import TransferLists from "./transferLists";
import { PARTICIPANT_STATUS } from "constants/index";

// assets
import {
  CameraOutlined,
  DeleteFilled,
  CloseOutlined,
  DownOutlined,
} from "@ant-design/icons";

// constant
const getInitialValues = (customer) => {
  const newCustomer = {
    firstName: "",
    lastName: "",
    email: "",
    group: "",
    role: "",
  };

  if (customer) {
    newCustomer.group = customer.address;
    return { ...newCustomer, ...customer };
  }

  return newCustomer;
};
// Removed hardcoded roles - will fetch from API
const filter = createFilterOptions();
const allStatus = [PARTICIPANT_STATUS.ACTIVE, PARTICIPANT_STATUS.LOA, PARTICIPANT_STATUS.TERMINATED];




// ==============================|| CUSTOMER ADD / EDIT / DELETE ||============================== //

const AddParticipantForm = ({
  customer,
  onCancel,
  title,
  handleCRUD,
  groups,
  error,
  open = false,
}) => {
  const { handleAddParticipant, handleAddMany } = handleCRUD;
  const theme = useTheme();
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.projects);
  const { project_participants:enrolled } = useSelector((state) => state.projects);
  const isCreating = !customer;

  const [selectedEnrollees, setSelectedEnrollees] = useState([]);
  
  // Update selectedEnrollees when enrolled changes
  useEffect(() => {
    setSelectedEnrollees(enrolled || []);
  }, [enrolled]);
  
  const handleSelectedEnrollee = (selected) => {
    setSelectedEnrollees(selected);
  };
  const enrolledIds = enrolled.map(enrollment => enrollment.participantId);

  const filteredSelectedEnrollees = selectedEnrollees.filter(selectedEnrollee => {
    return (
        !enrolledIds.includes(selectedEnrollee.id) &&
        typeof selectedEnrollee.projectId === 'undefined'
    );
});

  

  const [singleParticipant, setSingleParticipant] = useState(false);
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [avatar, setAvatar] = useState(
    `/assets/images/users/avatar-${
      isCreating && !customer?.avatar ? 1 : customer.avatar
    }.png`
  );
  const [isNewGroup, setIsNewGroup] = useState(false); // State variable for checkbox
  const [participantRoles, setParticipantRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  function handleAddMultiple() {
    setSingleParticipant((pre) => !pre);
  }

  const backgroundColor = [
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

  useEffect(() => {
    if (selectedImage) {
      setAvatar(URL.createObjectURL(selectedImage));
    }
  }, [selectedImage]);

  // Fetch participant roles on component mount
  useEffect(() => {
    const fetchParticipantRoles = async () => {
      if (!open) return;
      
      setLoadingRoles(true);
      try {
        const response = await fetch('/api/participant-roles/for-dropdown');
        if (response.ok) {
          const roles = await response.json();
          setParticipantRoles(roles);
        } else {
          console.error('Failed to fetch participant roles');
          dispatch(
            openSnackbar({
              open: true,
              message: 'Failed to load participant roles',
              variant: 'alert',
              alert: { color: 'warning' }
            })
          );
          // Fallback to default roles
          setParticipantRoles([
            { id: 1, title: 'User', description: 'Standard user role' },
            { id: 2, title: 'Manager', description: 'Management role' },
            { id: 3, title: 'Admin', description: 'Administrative role' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching participant roles:', error);
        // Fallback to default roles
        setParticipantRoles([
          { id: 1, title: 'User', description: 'Standard user role' },
          { id: 2, title: 'Manager', description: 'Management role' },
          { id: 3, title: 'Admin', description: 'Administrative role' }
        ]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchParticipantRoles();
  }, [open, dispatch]);

  const EnrolleeSchema = Yup.object().shape({
    firstName: Yup.string().max(255).required("Mandatory feild"),
    lastName: Yup.string().max(255).required("Mandatory feild"),
    group: Yup.string().required("group is required"),
    email: Yup.string()
      .max(255)
      .required("Email is required")
      .email("Must be a valid email"),
    role: Yup.number().required("role is required"),
  });

  const [openAlert, setOpenAlert] = useState(false);

  const handleAlertClose = () => {
    setOpenAlert(!openAlert);
    onCancel();
  };

  // Memoize initial values to prevent infinite re-renders
  const initialValues = useMemo(() => getInitialValues(customer), [customer]);

  const formik = useFormik({
    initialValues,
    validationSchema: singleParticipant ? EnrolleeSchema : null,
    onSubmit: async (values, { setSubmitting }) => {
      const FirstName =
        values.firstName.charAt(0).toUpperCase() + values.firstName.slice(1);
      const LastName =
        values.lastName.charAt(0).toUpperCase() + values.lastName.slice(1);
      const getChipColor = () => {
        const filteredGroups = groups.filter(
          (group) => group.groupName === values.group
        );
        if (
          filteredGroups.length > 0 &&
          filteredGroups[0].chipColor !== undefined
        ) {
          return filteredGroups[0].chipColor;
        } else return "#d13c31";
      };
      const chipColor = getChipColor();
      try {
        const newParticipants = filteredSelectedEnrollees;
        const newParticipant = {
          participant: {
            id: uuidv4(),
            firstName: FirstName,
            lastName: LastName,
            derpartement: "Active",
            participantStatus: "Active",
            email: values.email,
            roleId: values.role,
            profilePrefs: { key1: "value1" },
            credentials: { username: "bob" },
          },
        };
        if (customer) {
          // dispatch(updateCustomer(customer.id, newCustomer)); - update
          dispatch(
            openSnackbar({
              open: true,
              message: "Customer updated successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else if (singleParticipant) {
          handleAddParticipant(newParticipant);
          // dispatch(createCustomer(newCustomer)); - add
          dispatch(
            openSnackbar({
              open: true,
              message: error,
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );
        } else {
          handleAddMany(newParticipants);
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

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <MainCard 
        title={
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Typography variant="h6">
              {customer
                ? "Edit Participant"
                : singleParticipant
                ? "New Participant"
                : "New Participants"}
            </Typography>
            <FormControlLabel
              control={<Switch onChange={handleAddMultiple} />}
              label="Add Single Participant"
            />
          </Stack>
        }
        sx={{ m: 0, height: '100%' }}
      >
        <FormikProvider value={formik}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
              {singleParticipant ? (
                <Grid container spacing={3}>
                  {/* avatar section */}
                  <Grid item xs={12} md={3}>
                    <Stack
                      direction="row"
                      justifyContent="center"
                      sx={{ mt: 3 }}
                    >
                      <FormLabel
                        htmlFor="change-avtar"
                        sx={{
                          position: "relative",
                          borderRadius: "50%",
                          overflow: "hidden",
                          "&:hover .MuiBox-root": { opacity: 1 },
                          cursor: "pointer",
                        }}
                      >
                        <Avatar
                          alt="Avatar 1"
                          src={avatar}
                          sx={{ width: 72, height: 72, border: "1px dashed" }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, .75)"
                                : "rgba(0,0,0,.65)",
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Stack spacing={0.5} alignItems="center">
                            <CameraOutlined
                              style={{
                                color: theme.palette.secondary.lighter,
                                fontSize: "2rem",
                              }}
                            />
                            <Typography sx={{ color: "secondary.lighter" }}>
                              Upload
                            </Typography>
                          </Stack>
                        </Box>
                      </FormLabel>
                      <TextField
                        type="file"
                        id="change-avtar"
                        placeholder="Outlined"
                        variant="outlined"
                        sx={{ display: "none" }}
                        onChange={(e) =>
                          setSelectedImage(e.target.files?.[0])
                        }
                      />
                    </Stack>
                  </Grid>
                  {/* Form section */}
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          <InputLabel htmlFor="employee-firstName">
                            First Name
                          </InputLabel>
                          <TextField
                            fullWidth
                            id="employee-firstName"
                            placeholder="Enter Employee First Name"
                            {...getFieldProps("firstName")}
                            error={Boolean(
                              touched.firstName && errors.firstName
                            )}
                            helperText={touched.firstName && errors.firstName}
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          <InputLabel htmlFor="employee-lastName">
                            Last Name
                          </InputLabel>
                          <TextField
                            fullWidth
                            id="employee-lastName"
                            placeholder="Enter Employee Last Name"
                            {...getFieldProps("lastName")}
                            error={Boolean(
                              touched.lastName && errors.lastName
                            )}
                            helperText={touched.lastName && errors.lastName}
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          <InputLabel htmlFor="employee-email">
                            Email
                          </InputLabel>
                          <TextField
                            fullWidth
                            id="employee-email"
                            placeholder="Enter Employee Email"
                            {...getFieldProps("email")}
                            error={Boolean(touched.email && errors.email)}
                            helperText={touched.email && errors.email}
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          <InputLabel htmlFor="employee-role">
                            Role
                          </InputLabel>
                          <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                            <Select
                              name="role"
                              value={formik.values.role || ''}
                              onChange={(event) => formik.setFieldValue('role', event.target.value)}
                              onBlur={formik.handleBlur}
                              disabled={loadingRoles}
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <em>Select Role</em>;
                                }
                                const selectedRole = participantRoles.find(role => role.id === selected);
                                return selectedRole ? selectedRole.title : 'Unknown Role';
                              }}
                            >
                              <MenuItem disabled value="">
                                <em>Select Role</em>
                              </MenuItem>
                              {loadingRoles ? (
                                <MenuItem disabled>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography>Loading roles...</Typography>
                                  </Stack>
                                </MenuItem>
                              ) : (
                                participantRoles.map((role) => (
                                  <MenuItem key={role.id} value={role.id}>
                                    <Stack>
                                      <Typography variant="body1">{role.title}</Typography>
                                      {role.description && (
                                        <Typography variant="caption" color="text.secondary">
                                          {role.description}
                                        </Typography>
                                      )}
                                    </Stack>
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                            {formik.touched.role && formik.errors.role && (
                              <FormHelperText>{formik.errors.role}</FormHelperText>
                            )}
                          </FormControl>
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack spacing={1.25}>
                          {!isNewGroup ? (
                            <>
                              <InputLabel htmlFor="employee-group">
                                Add to Group
                              </InputLabel>
                              <FormControl fullWidth>
                                <Select
                                  id="column-hiding"
                                  displayEmpty
                                  value={formik.values.group || ''}
                                  onChange={(event) =>
                                    setFieldValue("group", event.target.value)
                                  }
                                  input={
                                    <OutlinedInput
                                      id="select-column-hiding"
                                      placeholder="Sort by"
                                    />
                                  }
                                  // Disable based on checkbox state
                                  disabled={isNewGroup}
                                  renderValue={(selected) => {
                                    if (!selected) {
                                      return (
                                        <Chip
                                          style={{
                                            backgroundColor: "#d13c31",
                                            color: "#fff",
                                          }}
                                          label="Individual"
                                          size="small"
                                          variant="filled"
                                        />
                                      );
                                    }
                                    const selectedGroup = groups && groups.find(
                                      (group) => group && group.groupName === selected
                                    );
                                    const chipcolor = selectedGroup?.chipColor || "#d13c31";
                                    return (
                                      <Chip
                                        style={{
                                          backgroundColor: chipcolor,
                                          color: "#fff",
                                        }}
                                        label={selected}
                                        size="small"
                                        variant="filled"
                                      />
                                    );
                                  }}
                                >
                                  <MenuItem value="">
                                    <Chip
                                      style={{
                                        backgroundColor: "#d13c31",
                                        color: "#fff",
                                      }}
                                      label="Individual"
                                      size="small"
                                      variant="filled"
                                    />
                                  </MenuItem>
                                  {groups && groups.map((group, index) => (
                                    <MenuItem
                                      key={group?.id || index}
                                      value={group?.groupName || ''}
                                    >
                                      <Chip
                                        style={{
                                          backgroundColor: group?.chipColor || "#1976d2",
                                          color: "#fff",
                                        }}
                                        label={group?.groupName || 'Unknown Group'}
                                        size="small"
                                        variant="filled"
                                      />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              {touched.group && errors.group && (
                                <FormHelperText
                                  error
                                  id="standard-weight-helper-text-email-login"
                                  sx={{ pl: 1.75 }}
                                >
                                  {errors.group}
                                </FormHelperText>
                              )}
                            </>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <Stack spacing={1.25}>
                                  <InputLabel htmlFor="employee-group">
                                    New Group
                                  </InputLabel>
                                  <TextField
                                    fullWidth
                                    id="employee-group"
                                    multiline
                                    rows={1}
                                    placeholder="Enter Group name"
                                    {...getFieldProps("group")}
                                    // Disable based on checkbox state
                                    disabled={!isNewGroup}
                                    error={Boolean(
                                      touched.group && errors.group
                                    )}
                                    helperText={touched.group && errors.group}
                                  />
                                </Stack>
                              </Grid>

                              <Grid item xs={12}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle1">
                                      Background Color
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <FormControl>
                                      <RadioGroup
                                        row
                                        aria-label="color"
                                        {...getFieldProps("color")}
                                        onChange={(e) =>
                                          setFieldValue(
                                            "color",
                                            e.target.value
                                          )
                                        }
                                        name="color-radio-buttons-group"
                                        sx={{
                                          "& .MuiFormControlLabel-root": {
                                            mr: 2,
                                          },
                                        }}
                                      >
                                        {backgroundColor.map(
                                          (item, index) => (
                                            <ColorPalette
                                              key={index}
                                              value={item.value}
                                              color={item.color}
                                            />
                                          )
                                        )}
                                      </RadioGroup>
                                    </FormControl>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </>
                          )}

                          {/* Checkbox for enabling/disabling the input */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isNewGroup}
                                onChange={() => setIsNewGroup(!isNewGroup)}
                              />
                            }
                            label="Create New"
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>

                      <Grid item xs={12}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle1">
                              Increment starting from the previous group name.
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                            >
                              The auto-increment button is like a magic button
                              that makes numbers go up by themselves.
                            </Typography>
                          </Stack>
                          <FormControlLabel
                            control={<Switch defaultChecked sx={{ mt: 0 }} />}
                            label=""
                            labelPlacement="start"
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                          {!isCreating && (
                            <Tooltip title="Delete Customer" placement="top">
                              <IconButton
                                onClick={() => setOpenAlert(true)}
                                size="large"
                                color="error"
                              >
                                <DeleteFilled />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Button color="error" onClick={onCancel}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                          >
                            {customer ? "Edit" : "Add"}
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Stack spacing={1.25}>
                      <InputLabel htmlFor="group-participants">
                        Enroll existing learners
                      </InputLabel>
                      {employees && (
                        <TransferLists
                          learners={employees}
                          enrolled={enrolled}
                          handleSelectedEnrollee={
                            handleSelectedEnrollee
                          }
                        />
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button color="error" onClick={onCancel}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        {customer ? "Edit" : "Add"}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </Form>
          </LocalizationProvider>
        </FormikProvider>
      </MainCard>
      
      {!isCreating && (
        <AlertCustomerDelete
          title={customer.fatherName}
          open={openAlert}
          handleClose={handleAlertClose}
        />
      )}
    </Dialog>
  );
};

AddParticipantForm.propTypes = {
  customer: PropTypes.any,
  onCancel: PropTypes.func,
  title: PropTypes.string,
  handleCRUD: PropTypes.object,
  groups: PropTypes.array,
  error: PropTypes.any,
  open: PropTypes.bool,
};

export default AddParticipantForm;