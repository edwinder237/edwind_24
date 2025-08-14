import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

// assets
import { UploadOutlined, FileTextOutlined, DownOutlined } from '@ant-design/icons';

const CSVImport = ({ open, onClose, onImport, loading = false }) => {
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  const requiredFields = ['firstName', 'lastName', 'email'];
  const optionalFields = ['middleName', 'derpartement', 'roleId', 'participantType', 'participantStatus', 'notes', 'toolAccess_tool', 'toolAccess_username', 'toolAccess_accessCode', 'toolAccess_toolType', 'toolAccess_toolUrl', 'toolAccess_toolDescription'];

  const resetState = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setErrors([]);
    setFileName('');
    setImportResult(null);
    setImportErrors([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setErrors(['CSV file must contain at least a header row and one data row']);
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
          row._rowIndex = index + 2; // +2 because we start from row 2 in Excel/CSV
          return row;
        });

        // Validate data
        const validationErrors = validateCsvData(headers, rows);
        setErrors(validationErrors);
        setCsvData(rows);

      } catch (error) {
        setErrors(['Error parsing CSV file: ' + error.message]);
      }
    };

    reader.readAsText(file);
  };

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
    rows.forEach((row, index) => {
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

  const handleImport = async () => {
    if (errors.length > 0) return;
    
    try {
      // Transform data to match the expected format
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
        // Tool access data
        toolAccess: (row.toolAccess_tool && row.toolAccess_username && row.toolAccess_accessCode) ? {
          tool: row.toolAccess_tool,
          username: row.toolAccess_username,
          accessCode: row.toolAccess_accessCode,
          toolType: row.toolAccess_toolType || row.toolAccess_tool?.toLowerCase(),
          toolUrl: row.toolAccess_toolUrl || '',
          toolDescription: row.toolAccess_toolDescription || ''
        } : null,
        // trainingRecipientId will be set by the backend API based on the project
      }));

      const result = await onImport(participantsData);
      
      if (result && result.data) {
        setImportResult(result.data.summary);
        setImportErrors(result.data.errors || []);
        setShowResults(true);
        
        // If there are errors, don't close the dialog so user can see them
        if (!result.data.errors || result.data.errors.length === 0) {
          // Only close if no errors
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportErrors([{
        email: 'System Error',
        error: error.message || 'Import failed unexpectedly'
      }]);
      setShowResults(true);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getSampleCSV = () => {
    const headers = ['firstName', 'lastName', 'email', 'middleName', 'derpartement', 'roleId', 'participantType', 'participantStatus', 'notes', 'toolAccess_tool', 'toolAccess_username', 'toolAccess_accessCode', 'toolAccess_toolType', 'toolAccess_toolUrl', 'toolAccess_toolDescription'];
    const sampleRow = ['John', 'Doe', 'john.doe@example.com', 'Michael', 'Engineering', 'participant', 'student', 'active', 'Sample participant', 'CRM', 'johndoe123', 'pass123abc', 'crm', 'https://crm.example.com', 'Customer Relationship Management System'];
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <UploadOutlined />
          <Typography variant="h6">Import Participants from CSV</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Instructions */}
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              CSV Import Instructions:
            </Typography>
            <Typography variant="body2" component="div">
              • Required columns: firstName, lastName, email<br/>
              • Optional columns: middleName, derpartement, roleId, participantType, participantStatus, notes<br/>
              • Tool access columns: toolAccess_tool, toolAccess_username, toolAccess_accessCode, toolAccess_toolType, toolAccess_toolUrl, toolAccess_toolDescription<br/>
              • Make sure each participant has a unique email address<br/>
              • Download the template below for the correct format
            </Typography>
          </Alert>

          {/* Sample Template Download */}
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

          {/* File Upload */}
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
              disabled={loading}
            >
              Select CSV File
            </Button>
            {fileName && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {fileName}
              </Typography>
            )}
          </Box>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>
                Please fix the following issues:
              </Typography>
              {errors.map((error, index) => (
                <Typography key={index} variant="body2">
                  • {error}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Preview */}
          {csvData.length > 0 && errors.length === 0 && !showResults && (
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
                    <strong>New participants:</strong> {importResult.newParticipants}<br/>
                    <strong>Existing participants:</strong> {importResult.existingParticipants}
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
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {showResults ? 'Close' : 'Cancel'}
        </Button>
        {!showResults && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={csvData.length === 0 || errors.length > 0 || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <UploadOutlined />}
          >
            {loading ? 'Importing...' : `Import ${csvData.length} Participants`}
          </Button>
        )}
        {showResults && importErrors.length === 0 && (
          <Button
            onClick={handleClose}
            variant="contained"
            color="success"
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

CSVImport.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default CSVImport;