import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  CircularProgress,
  TextField,
  ClickAwayListener
} from '@mui/material';
import {
  BankOutlined,
  EditTwoTone,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteTwoTone,
  EnvironmentOutlined,
  CheckOutlined,
  CloseOutlined,
  CameraOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'store';
import { getSingleTrainingRecipient, updateTrainingRecipient } from 'store/reducers/trainingRecipients';
import { openSnackbar } from 'store/reducers/snackbar';
import axios from 'utils/axios';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import GoogleMaps from 'sections/apps/project-manager/projects-list/google-map-autocomplete/GoogleMap';

// ==============================|| TRAINING RECIPIENT DETAIL PAGE ||============================== //

const TrainingRecipientDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch();
  
  const [tabValue, setTabValue] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState(null);
  const [selectedLocationValue, setSelectedLocationValue] = useState(null);
  const [locationInputKey, setLocationInputKey] = useState(0); // Key to force re-render
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Redux state
  const {
    singleRecipient: recipient,
    recipientParticipants: participants,
    recipientProjects: projects,
    singleLoading: loading,
    error
  } = useSelector((state) => state.trainingRecipients);

  // Fetch training recipient data
  useEffect(() => {
    if (id && !loading && (!recipient || recipient.id !== parseInt(id))) {
      dispatch(getSingleTrainingRecipient(id));
    }
  }, [id, dispatch, recipient, loading]);

  // Initialize edited title when recipient loads
  useEffect(() => {
    if (recipient?.name) {
      setEditedTitle(recipient.name);
    }
  }, [recipient?.name]);

  // Handle errors
  useEffect(() => {
    if (error) {
      dispatch(openSnackbar({
        open: true,
        message: error,
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  }, [error, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle custom image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      dispatch(openSnackbar({
        open: true,
        message: 'Image size must be less than 10MB',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please upload a valid image file (JPEG, PNG, or WebP)',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        
        // Upload to R2 via API
        const response = await axios.post('/api/images/upload', {
          image: base64Data,
          fileName: file.name,
          prefix: 'training-recipients'
        });

        if (response.data.success) {
          const imageUrl = response.data.data.r2Url;
          
          // Update training recipient with new image
          await dispatch(updateTrainingRecipient({
            id: recipient.id,
            name: recipient.name,
            contactPerson: recipient.contactPerson,
            description: recipient.description || '',
            email: recipient.email || '',
            phone: recipient.phone || '',
            address: recipient.address || '',
            website: recipient.website || '',
            industry: recipient.industry || '',
            taxId: recipient.taxId || '',
            notes: recipient.notes || '',
            location: recipient.location,
            img: imageUrl
          }));

          dispatch(openSnackbar({
            open: true,
            message: 'Image uploaded successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: false,
          }));

          // Refresh the data
          await dispatch(getSingleTrainingRecipient(id));
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to upload image',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditRecipient = () => {
    // Navigate back to main page with edit dialog open
    router.push('/project-manager/training-recipients?edit=' + id);
  };

  const handleBackToList = () => {
    router.push('/project-manager/training-recipients');
  };

  const handleStartEditingTitle = () => {
    setEditedTitle(recipient.name);
    setIsEditingTitle(true);
  };

  const handleCancelEditingTitle = () => {
    setEditedTitle(recipient.name);
    setIsEditingTitle(false);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Organization name cannot be empty',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    if (editedTitle === recipient.name) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await dispatch(updateTrainingRecipient({
        id: recipient.id,
        name: editedTitle.trim()
      }));
      setIsEditingTitle(false);
      dispatch(openSnackbar({
        open: true,
        message: 'Organization name updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false,
      }));
      // Refresh the data
      dispatch(getSingleTrainingRecipient(id));
    } catch (error) {
      console.error('Error updating title:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update organization name',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  };

  const handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditingTitle();
    }
  };

  // Location editing functions
  const handleStartEditingLocation = () => {
    // Clear previous state and force component refresh
    setSelectedLocationValue(null);
    setEditedLocation(null);
    setLocationInputKey(prev => prev + 1); // Force GoogleMaps to remount
    setIsEditingLocation(true);
  };

  const handleCancelEditingLocation = () => {
    setSelectedLocationValue(null);
    setEditedLocation(null);
    setIsEditingLocation(false);
  };

  const handleLocationChange = (locationData) => {
    console.log('Location changed:', locationData);
    // Set the location data immediately when selected
    if (locationData) {
      // The GoogleMaps component already handles R2 upload and provides imageUrl
      setEditedLocation(locationData);
      setSelectedLocationValue(locationData);
      console.log('Location with R2 image:', {
        address: locationData.description,
        r2ImageUrl: locationData.imageUrl,
        originalGoogleImageUrl: locationData.originalGoogleImageUrl
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!recipient || !recipient.id || !recipient.name) {
      dispatch(openSnackbar({
        open: true,
        message: 'Missing recipient data. Please refresh the page.',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
      return;
    }

    if (!editedLocation) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a location first',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
      }));
      return;
    }

    try {
      // Get the address from the location data
      const addressValue = editedLocation?.description || 
                          editedLocation?.formatted_address || 
                          '';

      // Create location object with required fields
      const locationObject = {
        place_id: editedLocation.place_id || null,
        description: addressValue,
        formatted_address: addressValue,
        imageUrl: editedLocation.imageUrl || null,
        originalGoogleImageUrl: editedLocation.originalGoogleImageUrl || null,
        photos: editedLocation.photos || []
      };

      // Include all required fields for the update
      const updateData = {
        id: recipient.id,
        name: recipient.name,
        contactPerson: recipient.contactPerson,
        description: recipient.description || '',
        email: recipient.email || '',
        phone: recipient.phone || '',
        address: addressValue,
        website: recipient.website || '',
        industry: recipient.industry || '',
        taxId: recipient.taxId || '',
        notes: recipient.notes || '',
        location: locationObject,
        img: editedLocation.imageUrl || null // Add the R2 image URL to the img field
      };

      console.log('Update data being sent:', updateData);
      console.log('Required fields check:', {
        id: updateData.id,
        name: updateData.name,
        contactPerson: updateData.contactPerson
      });

      await dispatch(updateTrainingRecipient(updateData));
      
      // Close the edit mode
      setIsEditingLocation(false);
      setSelectedLocationValue(null);
      setEditedLocation(null);
      
      // Show success message
      dispatch(openSnackbar({
        open: true,
        message: 'Location updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false,
      }));
      
      // Refresh the data to get the updated information
      await dispatch(getSingleTrainingRecipient(id));
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update location',
        variant: 'alert',
        alert: { color: 'error' },
        close: false,
      }));
    }
  };

  if (loading) {
    return (
      <Page title="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading training recipient details...</Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  if (!recipient && !loading) {
    return (
      <Page title="Not Found">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Training recipient not found</Typography>
            <Button variant="outlined" onClick={handleBackToList}>
              Back to List
            </Button>
          </Stack>
        </Box>
      </Page>
    );
  }

  return (
    <Page 
      title={recipient?.name || 'Training Recipient'} 
      breadcrumbs={[
        { title: 'Home', to: '/' },
        { title: 'Training Recipients', to: '/project-manager/training-recipients' },
        { title: recipient?.name || 'Loading...' }
      ]}
    >
      {/* Header Section */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="flex-start">
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 160,
                height: 120,
                borderRadius: 2,
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'grey.400',
                overflow: 'hidden',
                backgroundImage: recipient.img ? `url(${recipient.img})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative'
              }}
            >
              {!recipient.img && !isUploadingImage && (
                <Stack alignItems="center" spacing={1}>
                  <CameraOutlined style={{ fontSize: 24, color: '#999' }} />
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    No Image
                  </Typography>
                </Stack>
              )}
              {isUploadingImage && (
                <CircularProgress size={24} />
              )}
            </Box>
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                position: 'absolute', 
                bottom: -8, 
                right: -8,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                p: 0.5
              }}
            >
              <Tooltip title="Upload custom image">
                <IconButton 
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    width: 28,
                    height: 28
                  }}
                >
                  <UploadOutlined style={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BankOutlined style={{ fontSize: '16px', color: '#666' }} />
                  {isEditingTitle ? (
                    <ClickAwayListener onClickAway={handleCancelEditingTitle}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TextField
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onKeyDown={handleTitleKeyPress}
                          variant="standard"
                          autoFocus
                          sx={{
                            '& .MuiInput-input': {
                              fontSize: '2.125rem',
                              fontWeight: 400,
                              fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                              lineHeight: 1.235,
                              letterSpacing: '0.00735em',
                            }
                          }}
                        />
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={handleSaveTitle}
                          sx={{ ml: 0.5 }}
                        >
                          <CheckOutlined />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={handleCancelEditingTitle}
                        >
                          <CloseOutlined />
                        </IconButton>
                      </Stack>
                    </ClickAwayListener>
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h3" gutterBottom sx={{ mb: 0 }}>
                        {recipient.name}
                      </Typography>
                      <Tooltip title="Click to edit">
                        <IconButton 
                          size="small" 
                          onClick={handleStartEditingTitle}
                          sx={{ 
                            opacity: 0.5,
                            '&:hover': { opacity: 1 }
                          }}
                        >
                          <EditOutlined style={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
                <Box component="div" sx={{ fontSize: '1.25rem', fontWeight: 400, color: 'text.secondary', marginBottom: 1 }}>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {recipient.contactPerson && (
                      <span>{recipient.contactPerson} • </span>
                    )}
                    <EnvironmentOutlined style={{ fontSize: '16px', color: '#666', marginRight: '4px' }} />
                    <span>{recipient.address || 'N/A'}</span>
                    {recipient.industry && (
                      <span> • {recipient.industry}</span>
                    )}
                  </Box>
                </Box>
                
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip 
                    label={`${recipient.stats?.activeProjects || 0} Active Projects`} 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${recipient.stats?.totalParticipants || 0} Total Participants`} 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={recipient.industry || 'N/A'} 
                    color="info" 
                    variant="outlined"
                  />
                </Stack>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <Tooltip title="Back to List">
                  <IconButton onClick={handleBackToList} color="default">
                    <ArrowLeftOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Recipient">
                  <IconButton onClick={handleEditRecipient} color="primary">
                    <EditTwoTone />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </MainCard>


      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="recipient detail tabs">
          <Tab label="Overview" />
          <Tab label="Projects" />
          <Tab label="Participants" />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <MainCard title="Contact Information">
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <MailOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email Address"
                    secondary={recipient.email || 'Not provided'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.light' }}>
                      <PhoneOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone Number"
                    secondary={recipient.phone || 'Not provided'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <GlobalOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Website"
                    secondary={
                      recipient.website ? (
                        <Box 
                          component="a" 
                          href={recipient.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none' }}
                        >
                          {recipient.website}
                        </Box>
                      ) : 'Not provided'
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>
                      <EnvironmentOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  {isEditingLocation ? (
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <Box component="div" sx={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 1 }}>
                        Address
                      </Box>
                      <ClickAwayListener onClickAway={handleCancelEditingLocation}>
                        <Stack direction="column" spacing={1}>
                          <GoogleMaps
                            key={locationInputKey}
                            handleLocationChange={handleLocationChange}
                            disabled={false}
                          />
                          <Stack direction="row" spacing={1}>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={handleSaveLocation}
                              data-location-save="true"
                              disabled={!editedLocation}
                            >
                              <CheckOutlined />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={handleCancelEditingLocation}
                            >
                              <CloseOutlined />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </ClickAwayListener>
                    </Box>
                  ) : (
                    <ListItemText
                      primary="Address"
                      secondary={
                        <Box component="div">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box component="span">
                              {recipient.address || 'Not provided'}
                            </Box>
                            <Tooltip title="Click to edit">
                              <IconButton 
                                size="small" 
                                onClick={handleStartEditingLocation}
                                sx={{ 
                                  opacity: 0.5,
                                  '&:hover': { opacity: 1 }
                                }}
                              >
                                <EditOutlined style={{ fontSize: '14px' }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      }
                    />
                  )}
                </ListItem>
              </List>
            </MainCard>
          </Grid>

          {/* Organization Details */}
          <Grid item xs={12} md={6}>
            <MainCard title="Organization Details">
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recipient.description || 'No description provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tax ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                    {recipient.taxId || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recipient.notes || 'No notes available'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Registration Date
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recipient.createdAt ? new Date(recipient.createdAt).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </Box>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <MainCard title={`Projects (${projects?.length || 0})`}>
          {projects && projects.length > 0 ? (
            <Grid container spacing={2}>
              {projects.map((project) => (
                <Grid item xs={12} md={6} lg={4} key={project.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                            {project.title}
                          </Typography>
                          <Chip 
                            label={project.status || 'active'} 
                            size="small" 
                            color={project.status === 'active' ? 'success' : 'default'}
                          />
                        </Stack>
                        
                        {project.description && (
                          <Typography variant="body2" color="text.secondary" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {project.description}
                          </Typography>
                        )}
                        
                        <Stack direction="row" spacing={2}>
                          <Stack alignItems="center">
                            <Typography variant="h6">{project.participantCount}</Typography>
                            <Typography variant="caption" color="text.secondary">Participants</Typography>
                          </Stack>
                          <Stack alignItems="center">
                            <Typography variant="h6">{project.groupCount}</Typography>
                            <Typography variant="caption" color="text.secondary">Groups</Typography>
                          </Stack>
                          <Stack alignItems="center">
                            <Typography variant="h6">{project.eventCount}</Typography>
                            <Typography variant="caption" color="text.secondary">Events</Typography>
                          </Stack>
                        </Stack>
                        
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ProjectOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                No Projects Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recipient.name} is not currently associated with any training projects.
              </Typography>
            </Paper>
          )}
        </MainCard>
      )}

      {tabValue === 2 && (
        <MainCard title={`Participants (${participants?.length || 0})`}>
          {participants && participants.length > 0 ? (
            <List>
              {participants.map((participant) => (
                <ListItem key={participant.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <UserOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="div" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                        {participant.firstName} {participant.lastName}
                      </Box>
                    }
                    secondary={
                      <Box component="div">
                        <Stack spacing={0.5}>
                          {participant.email && (
                            <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                              <MailOutlined style={{ fontSize: 12, marginRight: 4 }} />
                              {participant.email}
                            </Box>
                          )}
                          {participant.phone && (
                            <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                              <PhoneOutlined style={{ fontSize: 12, marginRight: 4 }} />
                              {participant.phone}
                            </Box>
                          )}
                          {participant.projects && participant.projects.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Projects:
                              </Box>
                              {participant.projects.map((project, index) => (
                                <Chip
                                  key={project.id}
                                  label={`${project.title} (${project.role})`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Participant">
                        <IconButton edge="end" size="small">
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                No Participants Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recipient.name} doesn't have any participants enrolled in training projects yet.
              </Typography>
            </Paper>
          )}
        </MainCard>
      )}

      {tabValue === 3 && (
        <MainCard title="Activity History">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CalendarOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Activity Timeline Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will show the activity history and timeline for {recipient.name}
            </Typography>
          </Paper>
        </MainCard>
      )}
    </Page>
  );
};

TrainingRecipientDetail.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TrainingRecipientDetail;