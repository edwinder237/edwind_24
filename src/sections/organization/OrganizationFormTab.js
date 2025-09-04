import { useRef, useState, useEffect } from 'react';
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
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [organization, setOrganization] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch organization data on mount
  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization/get-organization');
      if (response.ok) {
        const data = await response.json();
        if (data.organization) {
          setOrganization(data.organization);
          setLogoUrl(data.organization.logo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please upload a valid image file (JPEG, PNG, WebP, or SVG)',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Image size must be less than 2MB',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
      return;
    }

    setUploadingLogo(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        
        const response = await fetch('/api/organization/upload-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64String,
            contentType: file.type,
            organizationId: organization?.id
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload logo');
        }

        const data = await response.json();
        setLogoUrl(data.logoUrl);
        
        dispatch(
          openSnackbar({
            open: true,
            message: 'Logo uploaded successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: false
          })
        );
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: error.message || 'Failed to upload logo',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setUploadingLogo(false);
    }
  };


  return (
    <MainCard content={false} title="Organization Settings" sx={{ '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}>
      <Formik
        initialValues={{
          organizationName: organization?.title || 'EDWIND Learning Solutions',
          subOrganizationName: organization?.sub_organizations?.title || 'Training Division',
          description: organization?.description || 'A comprehensive training division focused on delivering high-quality educational programs and professional development courses.',
          address: organization?.info?.address || '123 Learning Street, Education City, EC 12345',
          phone: organization?.info?.phone || '+1-555-0123',
          email: organization?.info?.email || 'info@edwind.com',
          website: organization?.info?.website || 'https://www.edwind.com',
          logo: '',
          submit: null
        }}
        enableReinitialize
        validationSchema={Yup.object().shape({
          organizationName: Yup.string().max(100).required('Organization name is required.'),
          subOrganizationName: Yup.string().max(100).required('Sub-organization name is required.'),
          description: Yup.string().max(500, 'Description should not exceed 500 characters.').required('Description is required.'),
          address: Yup.string().max(200).required('Address is required.'),
          phone: Yup.string().required('Phone number is required.'),
          email: Yup.string().email('Invalid email address.').required('Email is required.'),
          website: Yup.string().url('Invalid website URL.')
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            const response = await fetch('/api/organization/update-organization', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                organizationId: organization?.id,
                organizationName: values.organizationName,
                subOrganizationName: values.subOrganizationName,
                description: values.description,
                address: values.address,
                phone: values.phone,
                email: values.email,
                website: values.website
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to update organization');
            }

            const data = await response.json();
            setOrganization(data.organization);
            
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
            dispatch(
              openSnackbar({
                open: true,
                message: err.message || 'Failed to update organization settings',
                variant: 'alert',
                alert: {
                  color: 'error'
                },
                close: false
              })
            );
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
                        bgcolor: logoUrl ? 'transparent' : theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        border: logoUrl ? `1px solid ${theme.palette.divider}` : 'none',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                        '&:hover': {
                          '& .upload-overlay': {
                            opacity: 1
                          }
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoUrl ? (
                        <>
                          <img 
                            src={logoUrl} 
                            alt="Organization Logo" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
                          <Box
                            className="upload-overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              bgcolor: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s',
                              color: 'white'
                            }}
                          >
                            <CameraOutlined style={{ fontSize: '1.5rem' }} />
                          </Box>
                        </>
                      ) : (
                        <BankOutlined style={{ fontSize: '2.5rem' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                      {logoUrl 
                        ? 'Click to upload a new logo'
                        : 'Current logo displays organization icon. Upload a custom logo to replace it.'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Stack spacing={1.25}>
                    <InputLabel>Logo Upload</InputLabel>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleLogoUpload(file);
                          setFieldValue('logo', file);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      startIcon={uploadingLogo ? null : <CameraOutlined />}
                    >
                      {uploadingLogo ? 'Uploading...' : 'Choose File'}
                    </Button>
                    <Typography variant="caption" color="textSecondary">
                      Recommended: 200x200px, PNG or JPEG format, max 2MB
                    </Typography>
                    {logoUrl && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() => {
                          setLogoUrl(null);
                          // You may want to add logic to remove logo from database
                        }}
                      >
                        Remove Logo
                      </Button>
                    )}
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