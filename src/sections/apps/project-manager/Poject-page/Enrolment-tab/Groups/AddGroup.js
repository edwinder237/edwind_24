import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'store';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  FormHelperText,
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
  Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// third-party
import _ from 'lodash';
import * as Yup from 'yup';
import { useFormik, Form, FormikProvider } from 'formik';

// project imports
import AlertCustomerDelete from '../AlertCustomerDelete';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import { openSnackbar } from 'store/reducers/snackbar';
import { addGroup } from 'store/reducers/projects';
import ColorPalette from '../ColorPalette';
import TransferLists from '../ParticipantsTable/transferLists';

// assets
import { CameraOutlined, DeleteFilled } from '@ant-design/icons';
import { yellow } from '@ant-design/colors';

/// REUSEABLE FORM CHECKLIST
// create formContext variable with string
// Update snackbar messages to formContext
// Update DialogTitle to formContext

const formContext = "Group"


// constant
const getInitialValues = (customer) => {
  const newCustomer = {
    groupName:'',
    participants: '',
    courses: ''
  };



  return newCustomer;
};



// ==============================|| CUSTOMER ADD / EDIT / DELETE ||============================== //

const AddGroup = ({ customer, onCancel,project_parentGroup,handleAddParticipant,groupsInState,participants }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {groups,employees} = useSelector((state)=>state.projects);
  const isCreating = !customer;
  const [selectedParticipants, setSelectedParticipants] = useState([]);


  const backgroundColor = [
    {
      value: theme.palette.primary.main,
      color: 'primary.main'
    },
    {
      value: theme.palette.error.main,
      color: 'error.main'
    },
    {
      value: theme.palette.success.main,
      color: 'success.main'
    },
    {
      value: theme.palette.secondary.main,
      color: 'secondary.main'
    },
    {
      value: theme.palette.warning.main,
      color: 'warning.main'
    },
    {
      value: theme.palette.primary.lighter,
      color: 'primary.lighter'
    },
    {
      value: theme.palette.error.lighter,
      color: 'error.lighter'
    },
    {
      value: theme.palette.success.lighter,
      color: 'success.lighter'
    },
    {
      value: theme.palette.secondary.lighter,
      color: 'secondary.lighter'
    },
    {
      value: theme.palette.warning.lighter,
      color: 'warning.lighter'
    }
  ];

  const textColor = [
    {
      value: '#fff',
      color: 'white'
    },
    {
      value: theme.palette.error.lighter,
      color: 'error.lighter'
    },
    {
      value: theme.palette.success.lighter,
      color: 'success.lighter'
    },
    {
      value: theme.palette.secondary.lighter,
      color: 'secondary.lighter'
    },
    {
      value: theme.palette.warning.lighter,
      color: 'warning.lighter'
    },
    {
      value: theme.palette.primary.lighter,
      color: 'primary.lighter'
    },
    {
      value: theme.palette.primary.main,
      color: 'primary.main'
    },
    {
      value: theme.palette.error.main,
      color: 'error.main'
    },
    {
      value: theme.palette.success.main,
      color: 'success.main'
    },
    {
      value: theme.palette.secondary.main,
      color: 'secondary.main'
    },
    {
      value: theme.palette.warning.main,
      color: 'warning.main'
    }
  ];


    // Callback function to update selected participants
    const handleSelectedParticipant = (selectedParticipants) => {
      setSelectedParticipants(selectedParticipants);
    };


  const [openAlert, setOpenAlert] = useState(false);

  const handleAlertClose = () => {
    setOpenAlert(!openAlert);
    onCancel();
  };

console.log(selectedParticipants)
  
  const formik = useFormik({
    initialValues: getInitialValues(customer),
    validationSchema: Yup.object().shape({
      groupName: Yup.string()
        .max(255)
        .test('unique-groupName', 'Group name already exists', function (value) {
          return !groupsInState.some(group => group.groupName === value);
        })
        .required("Mandatory field"),
    }),
    onSubmit: (values, { setSubmitting }) => {
      try {
        const newGroup = {
          groupName: values.groupName,
          employees: selectedParticipants.map((person)=>({...person.metaData})),
          courses: [],
          chipColor: values.chipColor
        };
        if (customer) {
          
          // dispatch(updateCustomer(customer.id, newGroup)); - update
          dispatch(
            openSnackbar({
              open: true,
              message: `${formContext} updated successfully.`,
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );
        } else {
          handleAddParticipant(newGroup)
          dispatch(
            openSnackbar({
              open: true,
              message: `${formContext} added successfully.`,
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );
        }

        setSubmitting(true);
        onCancel();
      } catch (error) {
        console.error(error);
      }
    }
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue } = formik;
  return (
    <>
      <FormikProvider value={formik}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <DialogTitle>{customer ? `Edit ${formContext}` : `New ${formContext}`}</DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 2.5 }}>
              <Grid container spacing={3} >

                <Grid  item xs={12} md={12}>
                  <Grid container spacing={3}>
                    <Grid  item xs={12}>
                      <Stack spacing={1.25}>
                        <InputLabel htmlFor="group-name">Group Name</InputLabel>
                        <TextField
                          fullWidth
                          id="group-name"
                          placeholder="Enter Group Name"
                          {...getFieldProps('groupName')}
                          error={Boolean(touched.groupName && errors.groupName)}
                          helperText={touched.groupName && errors.groupName}
                        />
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">Background Color</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl>
                            <RadioGroup
                              row
                              aria-label="chipColor"
                              {...getFieldProps('color')}
                              onChange={(e) => setFieldValue('chipColor', e.target.value)}
                              name="color-radio-buttons-group"
                              sx={{ '& .MuiFormControlLabel-root': { mr: 2 } }}
                            >
                              {backgroundColor.map((item, index) => (
                                <ColorPalette key={index} value={item.value} color={item.color} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <Stack spacing={1.25}>
                        <InputLabel htmlFor="group-participants">Participants</InputLabel>
                        <TransferLists participants={employees} handleSelectedParticipant={handleSelectedParticipant}/>

                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5 }}>
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                  {!isCreating && (
                    <Tooltip title="Delete Customer" placement="top">
                      <IconButton onClick={() => setOpenAlert(true)} size="large" color="error">
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
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {customer ? 'Edit' : 'Add'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </DialogActions>
          </Form>
        </LocalizationProvider>
      </FormikProvider>
      {!isCreating && <AlertCustomerDelete title={customer.fatherName} open={openAlert} handleClose={handleAlertClose} />}
    </>
  );
};

AddGroup.propTypes = {
  customer: PropTypes.any,
  onCancel: PropTypes.func
};

export default AddGroup;
