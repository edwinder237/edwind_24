import { useRef } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import {
  Box,
  Button,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  InputLabel,
  Stack,
  TextField,
  Typography,
  FormLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';

// assets
import { CameraOutlined, BankOutlined } from '@ant-design/icons';

// ==============================|| ORGANIZATION SETTINGS - FORM ||============================== //

const OrganizationFormTab = ({ inputRef }) => {
  const theme = useTheme();
  const dispatch = useDispatch();


  return (
    <MainCard content={false} title="Organization Settings" sx={{ '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}>
      <Formik
        initialValues={{
          organizationName: 'EDWIND Learning Solutions',
          subOrganizationName: 'Training Division',
          description: 'A comprehensive training division focused on delivering high-quality educational programs and professional development courses.',
          address: '123 Learning Street, Education City, EC 12345',
          phone: '+1-555-0123',
          email: 'info@edwind.com',
          website: 'https://www.edwind.com',
          logo: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          organizationName: Yup.string().max(100).required('Organization name is required.'),
          subOrganizationName: Yup.string().max(100).required('Sub-organization name is required.'),
          description: Yup.string().max(500, 'Description should not exceed 500 characters.').required('Description is required.'),
          address: Yup.string().max(200).required('Address is required.'),
          phone: Yup.string().required('Phone number is required.'),
          email: Yup.string().email('Invalid email address.').required('Email is required.'),
          website: Yup.string().url('Invalid website URL.')
        })}
        onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
          try {
            dispatch(
              openSnackbar({
                open: true,
                message: 'Organization settings updated successfully.',
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
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            {/* Logo Section */}
            <CardHeader title="Organization Logo" />
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Stack spacing={2.5} alignItems="center">
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        bgcolor: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <BankOutlined style={{ fontSize: '2.5rem' }} />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                      Current logo displays organization icon. Upload a custom logo to replace it.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Stack spacing={1.25}>
                    <InputLabel>Logo Upload</InputLabel>
                    <TextField
                      type="file"
                      fullWidth
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFieldValue('logo', file);
                        }
                      }}
                      inputProps={{
                        accept: '.png,.jpg,.jpeg,.svg'
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Recommended: 200x200px, PNG or JPEG format, max 2MB
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Basic Information */}
            <CardHeader title="Basic Information" />
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-name">Organization Name</InputLabel>
                    <TextField
                      fullWidth
                      id="org-name"
                      value={values.organizationName}
                      name="organizationName"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Organization Name"
                      autoFocus
                      inputRef={inputRef}
                    />
                    {touched.organizationName && errors.organizationName && (
                      <FormHelperText error id="org-name-helper">
                        {errors.organizationName}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="sub-org-name">Sub-Organization Name</InputLabel>
                    <TextField
                      fullWidth
                      id="sub-org-name"
                      value={values.subOrganizationName}
                      name="subOrganizationName"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Sub-Organization Name"
                    />
                    {touched.subOrganizationName && errors.subOrganizationName && (
                      <FormHelperText error id="sub-org-name-helper">
                        {errors.subOrganizationName}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-description">Description</InputLabel>
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      id="org-description"
                      value={values.description}
                      name="description"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Organization Description"
                    />
                    {touched.description && errors.description && (
                      <FormHelperText error id="org-description-helper">
                        {errors.description}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Contact Information */}
            <CardHeader title="Contact Information" />
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-address">Address</InputLabel>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      id="org-address"
                      value={values.address}
                      name="address"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Organization Address"
                    />
                    {touched.address && errors.address && (
                      <FormHelperText error id="org-address-helper">
                        {errors.address}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-phone">Phone Number</InputLabel>
                    <TextField
                      fullWidth
                      id="org-phone"
                      value={values.phone}
                      name="phone"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Phone Number"
                    />
                    {touched.phone && errors.phone && (
                      <FormHelperText error id="org-phone-helper">
                        {errors.phone}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-email">Email Address</InputLabel>
                    <TextField
                      type="email"
                      fullWidth
                      id="org-email"
                      value={values.email}
                      name="email"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Email Address"
                    />
                    {touched.email && errors.email && (
                      <FormHelperText error id="org-email-helper">
                        {errors.email}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.25}>
                    <InputLabel htmlFor="org-website">Website (Optional)</InputLabel>
                    <TextField
                      fullWidth
                      id="org-website"
                      value={values.website}
                      name="website"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                    />
                    {touched.website && errors.website && (
                      <FormHelperText error id="org-website-helper">
                        {errors.website}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
                <Button variant="outlined" color="secondary">
                  Reset
                </Button>
                <Button disabled={isSubmitting || Object.keys(errors).length !== 0} type="submit" variant="contained">
                  Save Changes
                </Button>
              </Stack>
            </Box>
          </form>
        )}
      </Formik>
    </MainCard>
  );
};

export default OrganizationFormTab;