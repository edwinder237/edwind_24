import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Fade,
  Button,
  TextField,
  MenuItem,
  Stack,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { CloseOutlined, ArrowLeftOutlined, UploadOutlined, FileTextOutlined, DownOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import TransferLists from './transferLists';
import { useGetTrainingRecipientParticipantsQuery, useGetAvailableRolesQuery } from 'store/api/projectApi';
import { useSelector } from 'store';
import axios from 'utils/axios';

const AddParticipantOptionsDialog = ({
  open,
  onClose,
  groups = [],
  existingParticipants = [],
  onAddSingle,
  onAddMultiple,
  onImportCSV
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBulkParticipants, setSelectedBulkParticipants] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningData, setWarningData] = useState(null);

  // CSV Import state
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  // Get projectInfo from store (same as BulkParticipantsForm)
  const projectInfo = useSelector((state) => state.projectSettings?.projectInfo);

  // Fetch available roles (cached)
  const { data: availableRoles = [] } = useGetAvailableRolesQuery(projectInfo?.id, {
    skip: !projectInfo?.id
  });

  // Fetch training recipient participants (same pattern as BulkParticipantsForm)
  const {
    data: trainingRecipientParticipants = [],
    isLoading: loadingParticipants
  } = useGetTrainingRecipientParticipantsQuery(
    {
      trainingRecipientId: projectInfo?.trainingRecipientId,
      projectId: projectInfo?.id
    },
    {
      skip: !open || !projectInfo?.trainingRecipientId || selectedOption !== 'existing'
    }
  );


  const participantOptions = [
    {
      id: 'single',
      value: 'single',
      title: 'Create Single Participant',
      description: 'Manually create one participant at a time',
      icon: '👤',
      color: '#1976d2'
    },
    {
      id: 'existing',
      value: 'existing',
      title: 'Add Existing Participants',
      description: 'Add participants from training recipient',
      icon: '👥',
      color: '#388e3c'
    },
    {
      id: 'import',
      value: 'import',
      title: 'Import from CSV',
      description: 'Bulk import participants from CSV file',
      icon: '📄',
      color: '#f57c00'
    }
  ];

  // CSV field definitions
  const requiredFields = ['firstName', 'lastName', 'email'];
  const optionalFields = ['middleName', 'derpartement', 'roleId', 'participantType', 'participantStatus', 'notes', 'toolAccess_tool', 'toolAccess_username', 'toolAccess_accessCode', 'toolAccess_toolType', 'toolAccess_toolUrl', 'toolAccess_toolDescription'];

  // Get existing emails for validation
  const existingEmails = existingParticipants.map(p =>
    p.participant?.email?.toLowerCase().trim() || p.email?.toLowerCase().trim()
  ).filter(Boolean);

  // Form validation schema
  const validationSchema = Yup.object({
    firstName: Yup.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .required('First name is required'),
    lastName: Yup.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .required('Last name is required'),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required')
      .test('email-unique', 'This email is already registered in the project', function(value) {
        if (!value) return true;
        return !existingEmails.includes(value.toLowerCase().trim());
      }),
    roleId: Yup.number().required('Role is required'),
    group: Yup.string().optional(),
    notes: Yup.string().optional(),
  });

  // Get default role (prefer "Participant" role, otherwise first available)
  const defaultRoleId = availableRoles.find(r => r.title?.toLowerCase() === 'participant')?.id || availableRoles[0]?.id || '';

  // Formik setup
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleId: defaultRoleId,
      group: '',
      notes: ''
    },
    enableReinitialize: true, // Update when defaultRoleId or projectInfo changes
    validationSchema,
    onSubmit: async (values, { setErrors }) => {
      setIsSubmitting(true);
      try {
        // Check if participant with this email exists with different training recipient
        const response = await axios.get('/api/participants/check-training-recipient', {
          params: { email: values.email }
        });

        const existingParticipant = response.data?.participant;

        if (existingParticipant && existingParticipant.trainingRecipientId !== projectInfo?.trainingRecipientId) {
          // Show warning - participant belongs to different training recipient
          setWarningData({
            values,
            existingTrainingRecipient: existingParticipant.training_recipient?.name || 'Different Organization',
            projectTrainingRecipient: projectInfo?.training_recipient?.name || 'This Project'
          });
          setShowWarning(true);
          setIsSubmitting(false);
          return;
        }

        // No conflict - proceed
        const participantData = {
          participant: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            roleId: values.roleId,
            participantStatus: 'active',
            trainingRecipientId: projectInfo?.trainingRecipientId,
            profilePrefs: values.notes ? { notes: values.notes } : {}
          },
          group: values.group || ''
        };

        const result = await onAddSingle(participantData);
        if (result?.success) {
          handleCloseDialog();
        } else {
          setErrors({ submit: result?.error?.message || 'Failed to add participant' });
        }
      } catch (error) {
        setErrors({ submit: error.message || 'An error occurred' });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleOptionClick = (optionId) => {
    setSelectedOption(optionId);
    if (optionId === 'single') {
      formik.resetForm();
    } else if (optionId === 'existing') {
      setSelectedBulkParticipants([]);
    } else if (optionId === 'import') {
      resetCSVState();
    }
  };

  const resetCSVState = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setCsvErrors([]);
    setFileName('');
    setImportResult(null);
    setImportErrors([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = useCallback(() => {
    setSelectedOption(null);
    formik.resetForm();
    resetCSVState();
  }, [formik]);

  const handleCloseDialog = useCallback(() => {
    setSelectedOption(null);
    formik.resetForm();
    resetCSVState();
    setShowWarning(false);
    setWarningData(null);
    onClose();
  }, [onClose, formik]);

  const handleConfirmAdd = async () => {
    if (!warningData) return;

    setShowWarning(false);
    setIsSubmitting(true);

    try {
      const participantData = {
        participant: {
          firstName: warningData.values.firstName,
          lastName: warningData.values.lastName,
          email: warningData.values.email,
          roleId: warningData.values.roleId,
          participantStatus: 'active',
          trainingRecipientId: projectInfo?.trainingRecipientId,
          profilePrefs: warningData.values.notes ? { notes: warningData.values.notes } : {}
        },
        group: warningData.values.group || ''
      };

      const result = await onAddSingle(participantData);
      if (result?.success) {
        handleCloseDialog();
      } else {
        formik.setErrors({ submit: result?.error?.message || 'Failed to add participant' });
      }
    } catch (error) {
      formik.setErrors({ submit: error.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
      setWarningData(null);
    }
  };

  const handleCancelAdd = () => {
    setShowWarning(false);
    setWarningData(null);
    setIsSubmitting(false);
  };

  // CSV handling functions
  const validateCsvData = (headers, rows) => {
    const errors = [];

    // Check required headers
    const missingHeaders = requiredFields.filter(field => !headers.includes(field));
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Check for duplicate emails
    const emails = rows.map(row => row.email).filter(Boolean);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      errors.push(`Duplicate emails found: ${[...new Set(duplicateEmails)].join(', ')}`);
    }

    // Validate each row
    rows.forEach((row) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`Row ${row._rowIndex}: Missing required field '${field}'`);
        }
      });

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${row._rowIndex}: Invalid email format '${row.email}'`);
      }
    });

    return errors;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvErrors(['Please select a CSV file']);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setCsvErrors(['CSV file must contain at least a header row and one data row']);
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);

        // Parse data rows
        const rows = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          row._rowIndex = index + 2;
          return row;
        });

        // Validate data
        const validationErrors = validateCsvData(headers, rows);
        setCsvErrors(validationErrors);
        setCsvData(rows);

      } catch (error) {
        setCsvErrors(['Error parsing CSV file: ' + error.message]);
      }
    };

    reader.readAsText(file);
  };

  const getSampleCSV = () => {
    const headers = ['firstName', 'lastName', 'email', 'middleName', 'derpartement', 'roleId', 'participantType', 'participantStatus', 'notes'];
    const sampleRow = ['John', 'Doe', 'john.doe@example.com', 'Michael', 'Engineering', 'participant', 'student', 'active', 'Sample participant'];
    return [headers.join(','), sampleRow.join(',')].join('\n');
  };

  const downloadSampleCSV = () => {
    const csvContent = getSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'participant_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVImport = async () => {
    if (csvErrors.length > 0) return;

    setIsSubmitting(true);
    try {
      // Transform data to match the expected format for CSV import API
      const participantsData = csvData.map(row => ({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        middleName: row.middleName || '',
        derpartement: row.derpartement || '',
        roleId: row.roleId || 'participant',
        participantType: row.participantType || 'student',
        participantStatus: row.participantStatus || 'active',
        notes: row.notes || '',
        profilePrefs: {},
        credentials: {},
        toolAccess: (row.toolAccess_tool && row.toolAccess_username && row.toolAccess_accessCode) ? {
          tool: row.toolAccess_tool,
          username: row.toolAccess_username,
          accessCode: row.toolAccess_accessCode,
          toolType: row.toolAccess_toolType || row.toolAccess_tool?.toLowerCase(),
          toolUrl: row.toolAccess_toolUrl || '',
          toolDescription: row.toolAccess_toolDescription || ''
        } : null,
      }));

      // Use the dedicated CSV import handler
      const result = await onImportCSV(participantsData);

      if (result && result.data) {
        setImportResult(result.data.summary);
        setImportErrors(result.data.errors || []);
        setShowResults(true);

        if (!result.data.errors || result.data.errors.length === 0) {
          setTimeout(() => {
            handleCloseDialog();
          }, 2000);
        }
      } else if (result?.success) {
        // Success without detailed result
        setShowResults(true);
        setImportResult({
          total: participantsData.length,
          successful: participantsData.length,
          failed: 0,
          newParticipants: participantsData.length,
          existingParticipants: 0
        });
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportErrors([{
        email: 'System Error',
        error: error.message || 'Import failed unexpectedly'
      }]);
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the options selection view
  const renderOptionsView = () => (
    <Fade in={!selectedOption}>
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 400 }}>
        <Grid container spacing={2} sx={{ px: 2 }}>
          {participantOptions.map((type) => (
            <Grid item xs={12} sm={6} md={4} key={type.value}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: type.color,
                    bgcolor: `${type.color}08`,
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleOptionClick(type.id)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h2" sx={{ fontSize: '2rem', mb: 1 }}>
                    {type.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: type.color, fontWeight: 600 }}
                  >
                    {type.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {type.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Fade>
  );

  // Render the built-in simple form
  const renderSingleParticipantForm = () => (
    <Fade in={selectedOption === 'single'}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        px: 3,
        py: 3
      }}>
        <Box sx={{ maxWidth: 600, width: '100%' }}>
          <form onSubmit={formik.handleSubmit} id="participant-form">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="roleId"
                  name="roleId"
                  label="Role"
                  value={formik.values.roleId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.roleId && Boolean(formik.errors.roleId)}
                  helperText={formik.touched.roleId && formik.errors.roleId}
                  required
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="group"
                  name="group"
                  label="Group (Optional)"
                  value={formik.values.group}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.group && Boolean(formik.errors.group)}
                  helperText={formik.touched.group && formik.errors.group}
                  SelectProps={{
                    renderValue: (selected) => {
                      if (!selected) return 'No Group';
                      const selectedGroup = groups.find(g => g.groupName === selected);
                      if (selectedGroup) {
                        return (
                          <Chip
                            style={{
                              backgroundColor: selectedGroup.chipColor || "#1976d2",
                              color: "#fff"
                            }}
                            label={selectedGroup.groupName}
                            size="small"
                            variant="filled"
                          />
                        );
                      }
                      return selected;
                    }
                  }}
                >
                  <MenuItem value="">No Group</MenuItem>
                  {groups?.map((group, index) => (
                    <MenuItem key={group?.id || index} value={group?.groupName || ''}>
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
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="notes"
                  name="notes"
                  label="Notes (Optional)"
                  placeholder="Add any additional notes about this participant..."
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                />
              </Grid>

              {formik.errors.submit && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">
                    {formik.errors.submit}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </form>
        </Box>
      </Box>
    </Fade>
  );

  // Render the existing participants form with transfer list
  const renderExistingParticipantsForm = () => {
    return (
      <Fade in={selectedOption === 'existing'}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          px: 3,
          py: 3
        }}>
          {loadingParticipants ? (
            <Typography>Loading participants...</Typography>
          ) : (
            <TransferLists
              learners={trainingRecipientParticipants}
              enrolled={existingParticipants}
              handleSelectedEnrollee={setSelectedBulkParticipants}
            />
          )}
        </Box>
      </Fade>
    );
  };

  // Render CSV Import form
  const renderCSVImportForm = () => {
    return (
      <Fade in={selectedOption === 'import'}>
        <Box sx={{ px: 3, py: 2 }}>
          <Stack spacing={3}>
            {/* Instructions */}
            {!showResults && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  CSV Import Instructions:
                </Typography>
                <Typography variant="body2" component="div">
                  • Required columns: firstName, lastName, email<br/>
                  • Optional columns: middleName, derpartement, roleId, participantType, participantStatus, notes<br/>
                  • Make sure each participant has a unique email address<br/>
                  • Download the template below for the correct format
                </Typography>
              </Alert>
            )}

            {/* Sample Template Download */}
            {!showResults && (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<FileTextOutlined />}
                  onClick={downloadSampleCSV}
                  size="small"
                >
                  Download CSV Template
                </Button>
              </Box>
            )}

            {/* File Upload */}
            {!showResults && (
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  Select CSV File
                </Button>
                {fileName && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {fileName}
                  </Typography>
                )}
              </Box>
            )}

            {/* Errors */}
            {csvErrors.length > 0 && !showResults && (
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>
                  Please fix the following issues:
                </Typography>
                {csvErrors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Preview */}
            {csvData.length > 0 && csvErrors.length === 0 && !showResults && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Preview ({csvData.length} participants will be imported):
                </Typography>
                <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {csvHeaders.map((header) => (
                          <TableCell key={header}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">{header}</Typography>
                              {requiredFields.includes(header) && (
                                <Chip label="Required" size="small" color="primary" />
                              )}
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          {csvHeaders.map((header) => (
                            <TableCell key={header}>
                              <Typography variant="body2">
                                {row[header] || '-'}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {csvData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={csvHeaders.length} align="center">
                            <Typography variant="body2" color="text.secondary">
                              ... and {csvData.length - 5} more participants
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}

            {/* Import Results */}
            {showResults && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Import Results:
                </Typography>

                {importResult && (
                  <Alert
                    severity={importErrors.length > 0 ? "warning" : "success"}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      <strong>Total processed:</strong> {importResult.total}<br/>
                      <strong>Successful:</strong> {importResult.successful}<br/>
                      <strong>Failed:</strong> {importResult.failed}<br/>
                      {importResult.newParticipants !== undefined && (
                        <>
                          <strong>New participants:</strong> {importResult.newParticipants}<br/>
                          <strong>Existing participants:</strong> {importResult.existingParticipants}
                        </>
                      )}
                    </Typography>
                  </Alert>
                )}

                {importErrors.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<DownOutlined />}>
                      <Typography variant="subtitle2" color="error">
                        Errors ({importErrors.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {importErrors.map((error, index) => (
                          <Box key={index}>
                            <ListItem>
                              <ListItemText
                                primary={error.email}
                                secondary={error.error}
                              />
                            </ListItem>
                            {index < importErrors.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </Fade>
    );
  };

  // Handle bulk participant submission
  const handleBulkSubmit = async () => {
    if (selectedBulkParticipants.length === 0) return;

    setIsSubmitting(true);
    try {
      // Transform participants to include only id (API expects array of { id: number })
      const participantsWithIds = selectedBulkParticipants
        .map(p => ({ id: p.id }))
        .filter(p => p.id !== undefined); // Filter out any without id

      if (participantsWithIds.length === 0) {
        console.error('No valid participant IDs found');
        return;
      }

      const result = await onAddMultiple({
        participants: participantsWithIds
      });

      if (result?.success) {
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error adding bulk participants:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render footer with action buttons (only for form view)
  const renderFooter = () => {
    if (!selectedOption) return null;

    if (selectedOption === 'existing') {
      return (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkSubmit}
            disabled={isSubmitting || selectedBulkParticipants.length === 0}
          >
            {isSubmitting ? 'Adding...' : `Add ${selectedBulkParticipants.length} Participant${selectedBulkParticipants.length !== 1 ? 's' : ''}`}
          </Button>
        </Stack>
      );
    }

    if (selectedOption === 'import') {
      if (showResults) {
        return (
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="contained"
              color={importErrors.length === 0 ? "success" : "primary"}
              onClick={handleCloseDialog}
            >
              {importErrors.length === 0 ? 'Done' : 'Close'}
            </Button>
          </Stack>
        );
      }

      return (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleCSVImport}
            disabled={csvData.length === 0 || csvErrors.length > 0 || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <UploadOutlined />}
          >
            {isSubmitting ? 'Importing...' : `Import ${csvData.length} Participants`}
          </Button>
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          variant="contained"
          type="submit"
          form="participant-form"
          disabled={isSubmitting || !formik.isValid}
        >
          {isSubmitting ? 'Adding...' : 'Add Participant'}
        </Button>
      </Stack>
    );
  };

  const getDialogTitle = () => {
    if (!selectedOption) {
      return {
        title: 'Add Participants',
        subtitle: 'Choose how you want to add participants to this project'
      };
    }

    if (selectedOption === 'single') {
      return {
        title: 'Create Single Participant',
        subtitle: 'Enter participant details below'
      };
    }

    if (selectedOption === 'existing') {
      return {
        title: 'Add Existing Participants',
        subtitle: 'Select participants from training recipient'
      };
    }

    if (selectedOption === 'import') {
      return {
        title: 'Import from CSV',
        subtitle: showResults ? 'Import complete' : 'Upload a CSV file to bulk import participants'
      };
    }

    return {
      title: 'Add Participants',
      subtitle: ''
    };
  };

  // Render the appropriate form based on selected option
  const renderFormContent = () => {
    if (!selectedOption) return renderOptionsView();
    if (selectedOption === 'single') return renderSingleParticipantForm();
    if (selectedOption === 'existing') return renderExistingParticipantsForm();
    if (selectedOption === 'import') return renderCSVImportForm();
    return null;
  };

  const { title, subtitle } = getDialogTitle();

  const getDialogMaxWidth = () => {
    if (selectedOption === 'existing' || selectedOption === 'import') return 'lg';
    return 'sm';
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth={getDialogMaxWidth()}
      fullWidth
      PaperProps={{
        sx: { p: 0, minHeight: 550 }
      }}
    >
      <MainCard
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedOption && (
                <IconButton onClick={handleBack} size="large">
                  <ArrowLeftOutlined />
                </IconButton>
              )}
              <Box>
                <Typography variant="h5" component="div">
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={handleCloseDialog} size="large">
              <CloseOutlined />
            </IconButton>
          </Box>
        }
        content={false}
        divider={true}
        sx={{ minHeight: 550, display: 'flex', flexDirection: 'column' }}
      >
        <Box sx={{ p: selectedOption ? 0 : 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderFormContent()}
        </Box>

        {/* Footer with action buttons */}
        {selectedOption && (
          <>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {renderFooter()}
            </Box>
          </>
        )}
      </MainCard>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onClose={handleCancelAdd} maxWidth="sm">
        <MainCard title="Warning: Different Training Recipient" content={false}>
          <Box sx={{ p: 3 }}>
            <Alert severity="warning">
              This participant is already assigned to <strong>{warningData?.existingTrainingRecipient}</strong> but you're adding them to <strong>{warningData?.projectTrainingRecipient}</strong>.
            </Alert>
            <Typography sx={{ mt: 2 }}>
              Do you want to continue?
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCancelAdd} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleConfirmAdd} variant="contained" color="warning" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Add Anyway'}
            </Button>
          </Box>
        </MainCard>
      </Dialog>
    </Dialog>
  );
};

AddParticipantOptionsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  groups: PropTypes.array,
  existingParticipants: PropTypes.array,
  onAddSingle: PropTypes.func.isRequired,
  onAddMultiple: PropTypes.func.isRequired,
  onImportCSV: PropTypes.func.isRequired
};

export default AddParticipantOptionsDialog;
