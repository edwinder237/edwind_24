import { useRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// assets
import { CloseOutlined } from '@ant-design/icons';

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
    }
  }
};

// Common timezone list
const timezones = [
  { value: 'Pacific/Midway', label: '(GMT-11:00) Midway Island, Samoa' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Caracas', label: '(GMT-04:00) Caracas, La Paz' },
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) Brasilia, Buenos Aires' },
  { value: 'Atlantic/South_Georgia', label: '(GMT-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores', label: '(GMT-01:00) Azores' },
  { value: 'UTC', label: '(GMT+00:00) UTC, London, Dublin' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris, Berlin, Amsterdam' },
  { value: 'Europe/Helsinki', label: '(GMT+02:00) Helsinki, Cairo, Athens' },
  { value: 'Europe/Moscow', label: '(GMT+03:00) Moscow, Istanbul' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai, Abu Dhabi' },
  { value: 'Asia/Karachi', label: '(GMT+05:00) Karachi, Islamabad' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Mumbai, New Delhi' },
  { value: 'Asia/Dhaka', label: '(GMT+06:00) Dhaka, Almaty' },
  { value: 'Asia/Bangkok', label: '(GMT+07:00) Bangkok, Jakarta' },
  { value: 'Asia/Hong_Kong', label: '(GMT+08:00) Hong Kong, Singapore' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Seoul' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) Sydney, Melbourne' },
  { value: 'Pacific/Noumea', label: '(GMT+11:00) New Caledonia' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland, Wellington' }
];

const skillOptions = [
  'Adobe XD',
  'After Effect',
  'Angular',
  'Animation',
  'ASP.Net',
  'Bootstrap',
  'C#',
  'CC',
  'Corel Draw',
  'CSS',
  'DIV',
  'Dreamweaver',
  'Figma',
  'Graphics',
  'HTML',
  'Illustrator',
  'J2Ee',
  'Java',
  'Javascript',
  'JQuery',
  'Logo Design',
  'Material UI',
  'Motion',
  'MVC',
  'MySQL',
  'NodeJS',
  'npm',
  'Photoshop',
  'PHP',
  'React',
  'Redux',
  'Reduxjs & tooltit',
  'SASS',
  'SCSS',
  'SQL Server',
  'SVG',
  'UI/UX',
  'UI Designing',
  'Wordpress'
];

// ==============================|| TAB - PERSONAL ||============================== //

const TabPersonal = () => {
  const dispatch = useDispatch();
  const inputRef = useRef();
  const { user, fetchProfile, updateProfile, profileLoading } = useUser();
  const [initialValues, setInitialValues] = useState(null);

  // Fetch full profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Set initial values when user data is loaded
  useEffect(() => {
    if (user) {
      setInitialValues({
        firstname: user.firstName || '',
        lastname: user.lastName || '',
        email: user.email || '',
        countryCode: user.countryCode || '+1',
        contact: user.phone || '',
        designation: user.designation || '',
        timezone: user.timezone || 'America/New_York',
        skill: user.skills || [],
        note: user.bio || '',
        submit: null
      });
    }
  }, [user]);

  // Show loading state while fetching profile
  if (!initialValues) {
    return (
      <MainCard content={false} title="Personal Information">
        <Box sx={{ p: 5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard content={false} title="Personal Information" sx={{ '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={Yup.object().shape({
          firstname: Yup.string().max(255).required('First Name is required.'),
          lastname: Yup.string().max(255).required('Last Name is required.'),
          email: Yup.string().email('Invalid email address.').max(255).required('Email is required.'),
          contact: Yup.string(),
          designation: Yup.string(),
          timezone: Yup.string().required('Time zone is required'),
          note: Yup.string()
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            // Call the updateProfile API
            const result = await updateProfile({
              firstName: values.firstname,
              lastName: values.lastname,
              phone: values.contact,
              countryCode: values.countryCode,
              timezone: values.timezone,
              designation: values.designation,
              skills: values.skill,
              bio: values.note
            });

            if (result.error) {
              throw new Error(result.payload?.error || 'Failed to update profile');
            }

            dispatch(
              openSnackbar({
                open: true,
                message: 'Personal profile updated successfully.',
                variant: 'alert',
                alert: {
                  color: 'success'
                },
                close: false
              })
            );
            setStatus({ success: true });
            setSubmitting(false);
          } catch (err) {
            dispatch(
              openSnackbar({
                open: true,
                message: err.message || 'Failed to update profile',
                variant: 'alert',
                alert: {
                  color: 'error'
                },
                close: false
              })
            );
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-first-name">First Name</InputLabel>
                    <TextField
                      fullWidth
                      id="personal-first-name"
                      value={values.firstname}
                      name="firstname"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="First Name"
                      autoFocus
                      inputRef={inputRef}
                    />
                    {touched.firstname && errors.firstname && (
                      <FormHelperText error id="personal-first-name-helper">
                        {errors.firstname}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-last-name">Last Name</InputLabel>
                    <TextField
                      fullWidth
                      id="personal-last-name"
                      value={values.lastname}
                      name="lastname"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Last Name"
                    />
                    {touched.lastname && errors.lastname && (
                      <FormHelperText error id="personal-last-name-helper">
                        {errors.lastname}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-email">Email Address</InputLabel>
                    <TextField
                      type="email"
                      fullWidth
                      value={values.email}
                      name="email"
                      id="personal-email"
                      placeholder="Email Address"
                      disabled
                      helperText="Email is managed by your authentication provider"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-timezone">Time Zone</InputLabel>
                    <Select
                      fullWidth
                      id="personal-timezone"
                      value={values.timezone}
                      name="timezone"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      MenuProps={MenuProps}
                    >
                      {timezones.map((tz) => (
                        <MenuItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.timezone && errors.timezone && (
                      <FormHelperText error id="personal-timezone-helper">
                        {errors.timezone}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-phone">Phone Number</InputLabel>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Select value={values.countryCode} name="countryCode" onBlur={handleBlur} onChange={handleChange}>
                        <MenuItem value="+1">+1</MenuItem>
                        <MenuItem value="+91">+91</MenuItem>
                        <MenuItem value="+44">+44</MenuItem>
                        <MenuItem value="+61">+61</MenuItem>
                        <MenuItem value="+49">+49</MenuItem>
                        <MenuItem value="+33">+33</MenuItem>
                        <MenuItem value="+81">+81</MenuItem>
                        <MenuItem value="+86">+86</MenuItem>
                        <MenuItem value="+55">+55</MenuItem>
                        <MenuItem value="+52">+52</MenuItem>
                      </Select>
                      <TextField
                        fullWidth
                        id="personal-contact"
                        value={values.contact}
                        name="contact"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Contact Number"
                      />
                    </Stack>
                    {touched.contact && errors.contact && (
                      <FormHelperText error id="personal-contact-helper">
                        {errors.contact}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="personal-designation">Designation</InputLabel>
                    <TextField
                      fullWidth
                      id="personal-designation"
                      value={values.designation}
                      name="designation"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Designation"
                    />
                    {touched.designation && errors.designation && (
                      <FormHelperText error id="personal-designation-helper">
                        {errors.designation}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
            <CardHeader title="Skills" />
            <Divider />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', p: 2.5, m: 0 }} component="ul">
              <Autocomplete
                multiple
                fullWidth
                freeSolo
                id="tags-outlined"
                options={skillOptions}
                value={values.skill}
                onBlur={handleBlur}
                getOptionLabel={(label) => label}
                onChange={(_, newValue) => {
                  setFieldValue('skill', newValue);
                }}
                renderInput={(params) => <TextField {...params} name="skill" placeholder="Add Skills" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <span key={index}>
                      <Chip
                        {...getTagProps({ index })}
                        variant="combined"
                        label={option}
                        deleteIcon={<CloseOutlined style={{ fontSize: '0.75rem' }} />}
                        sx={{ color: 'text.primary' }}
                      />
                    </span>
                  ))
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    p: 0,
                    '& .MuiAutocomplete-tag': {
                      m: 1
                    },
                    '& fieldset': {
                      display: 'none'
                    },
                    '& .MuiAutocomplete-endAdornment': {
                      display: 'none'
                    },
                    '& .MuiAutocomplete-popupIndicator': {
                      display: 'none'
                    }
                  }
                }}
              />
            </Box>
            <CardHeader title="Bio" />
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <TextField
                multiline
                rows={5}
                fullWidth
                value={values.note}
                name="note"
                onBlur={handleBlur}
                onChange={handleChange}
                id="personal-note"
                placeholder="Tell us about yourself..."
              />
              {touched.note && errors.note && (
                <FormHelperText error id="personal-note-helper">
                  {errors.note}
                </FormHelperText>
              )}
              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
                <Button variant="outlined" color="secondary" onClick={() => fetchProfile()}>
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting || profileLoading}
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting || profileLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {isSubmitting || profileLoading ? 'Saving...' : 'Save'}
                </Button>
              </Stack>
            </Box>
          </form>
        )}
      </Formik>
    </MainCard>
  );
};

export default TabPersonal;
