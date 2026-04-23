import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Typography,
  IconButton,
  Box,
  Button,
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
import { CloseOutlined, UploadOutlined, FileTextOutlined, DownOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import axios from 'utils/axios';
import * as XLSX from 'xlsx';

const requiredCredentialFields = ['email', 'toolId', 'username', 'accessCode'];

const BulkCredentialUploadDialog = ({
  open,
  onClose,
  participants = [],
  projectId,
  projectTitle,
  onComplete
}) => {
  // CSV state
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importSkipped, setImportSkipped] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Organization tools
  const [orgTools, setOrgTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setToolsLoading(true);
      axios.get('/api/organization-tools')
        .then(res => setOrgTools(res.data || []))
        .catch((err) => {
          console.error('Failed to fetch organization tools:', err);
          setOrgTools([]);
        })
        .finally(() => setToolsLoading(false));
    }
  }, [open]);

  const resetState = useCallback(() => {
    setCsvData([]);
    setCsvHeaders([]);
    setCsvErrors([]);
    setFileName('');
    setImportResult(null);
    setImportErrors([]);
    setImportSkipped([]);
    setShowResults(false);
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleCloseDialog = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // Build participant email map for client-side validation
  const participantEmailMap = React.useMemo(() => {
    const map = new Map();
    participants.forEach(p => {
      const email = (p.participant?.email || '').toLowerCase().trim();
      if (email) map.set(email, true);
    });
    return map;
  }, [participants]);

  // Build org tool ID set for client-side validation
  const orgToolIdSet = React.useMemo(() => {
    return new Set(orgTools.map(t => t.id));
  }, [orgTools]);

  const validateCredentialData = useCallback((headers, rows) => {
    const errors = [];

    // Check required headers
    const missingHeaders = requiredCredentialFields.filter(field => !headers.includes(field));
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Validate each row
    rows.forEach((row) => {
      // Check required fields
      requiredCredentialFields.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push(`Row ${row._rowIndex}: Missing required field '${field}'`);
        }
      });

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${row._rowIndex}: Invalid email format '${row.email}'`);
      }

      // Check email matches an existing participant
      if (row.email && !participantEmailMap.has(row.email.toLowerCase().trim())) {
        errors.push(`Row ${row._rowIndex}: No participant found with email '${row.email}'`);
      }

      // Validate toolId is a number and matches an org tool
      if (row.toolId) {
        const parsedId = parseInt(row.toolId, 10);
        if (isNaN(parsedId)) {
          errors.push(`Row ${row._rowIndex}: toolId '${row.toolId}' is not a valid number`);
        } else if (orgToolIdSet.size > 0 && !orgToolIdSet.has(parsedId)) {
          errors.push(`Row ${row._rowIndex}: toolId '${row.toolId}' does not match any saved tool template`);
        }
      }
    });

    return errors;
  }, [participantEmailMap]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.numbers');

    if (!isCSV && !isExcel) {
      setCsvErrors(['Please select a CSV or Excel file (.csv, .xlsx, .xls, .numbers)']);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let headers, rows;

        if (isExcel) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            setCsvErrors(['File must contain at least a header row and one data row']);
            return;
          }

          headers = jsonData[0].map(h => String(h || '').trim());
          setCsvHeaders(headers);

          rows = jsonData.slice(1)
            .filter(row => row.some(cell => cell !== undefined && cell !== ''))
            .map((row, index) => {
              const rowObj = {};
              headers.forEach((header, i) => {
                rowObj[header] = row[i] !== undefined ? String(row[i]).trim() : '';
              });
              rowObj._rowIndex = index + 2;
              return rowObj;
            });
        } else {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length < 2) {
            setCsvErrors(['CSV file must contain at least a header row and one data row']);
            return;
          }

          headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          setCsvHeaders(headers);

          rows = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            row._rowIndex = index + 2;
            return row;
          });
        }

        const validationErrors = validateCredentialData(headers, rows);
        setCsvErrors(validationErrors);
        setCsvData(rows);

      } catch (error) {
        setCsvErrors(['Error parsing file: ' + error.message]);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const downloadTemplate = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Credentials template pre-populated with participant data
    const headers = ['email', 'externalId', 'firstName', 'lastName', 'toolId', 'username', 'accessCode'];
    const rows = participants.map(p => [
      p.participant?.email || '',
      p.participant?.externalId || '',
      p.participant?.firstName || '',
      p.participant?.lastName || '',
      '', '', '' // Empty credential columns for user to fill
    ]);
    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 30 }, // email
      { wch: 15 }, // externalId
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 10 }, // toolId
      { wch: 20 }, // username
      { wch: 20 }, // accessCode
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'credentials_template');

    // Sheet 2: Instructions
    const instrData = [
      ['Bulk Credential Upload Instructions'],
      [''],
      ['Required columns: email, toolId, username, accessCode'],
      ['Optional columns: externalId'],
      ['Reference columns (pre-filled): firstName, lastName'],
      [''],
      ['Notes:'],
      ['- email must match an existing participant in the project'],
      ['- toolId must match an ID from the "Tool Templates" sheet'],
      ['- Each row creates one tool access record'],
      ['- A participant can have multiple rows for multiple tools (duplicate the row)'],
      ['- Duplicates (same tool + username for same participant) will be skipped'],
      ['- If email is missing, externalId will be used as a fallback match key'],
    ];
    const instrSheet = XLSX.utils.aoa_to_sheet(instrData);
    instrSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

    // Sheet 3: Tool Templates - saved org tools with IDs for reference
    const toolHeaders = ['id', 'name', 'toolType', 'toolUrl', 'toolDescription'];
    const toolRows = orgTools.length > 0
      ? orgTools.map(t => [
          t.id,
          t.name || '',
          t.toolType || '',
          t.toolUrl || '',
          t.toolDescription || ''
        ])
      : [['No tools configured. Add tools in Resources > Tool Templates first.']];
    const toolSheetData = [toolHeaders, ...toolRows];
    const toolSheet = XLSX.utils.aoa_to_sheet(toolSheetData);
    toolSheet['!cols'] = [
      { wch: 8 },  // id
      { wch: 25 }, // name
      { wch: 15 }, // toolType
      { wch: 35 }, // toolUrl
      { wch: 35 }, // toolDescription
    ];
    XLSX.utils.book_append_sheet(wb, toolSheet, 'Tool Templates');

    const safeName = (projectTitle || 'project').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `${safeName}_credentials_template.xlsx`);
  }, [participants, projectTitle, orgTools]);

  const handleUpload = async () => {
    if (csvErrors.length > 0 || csvData.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/participants/bulk-upload-credentials', {
        projectId,
        credentials: csvData.map(row => ({
          email: row.email?.trim() || '',
          externalId: row.externalId?.trim() || '',
          toolId: row.toolId ? parseInt(row.toolId, 10) : null,
          username: row.username?.trim() || '',
          accessCode: row.accessCode?.trim() || '',
        }))
      });

      const data = response.data?.data || response.data;
      setImportResult(data.summary);
      setImportErrors(data.errors || []);
      setImportSkipped(data.skipped || []);
      setShowResults(true);

      // Refresh participant data to show new credentials
      if (onComplete) onComplete();

      // Auto-close after 2s if no errors
      if ((!data.errors || data.errors.length === 0) && (!data.skipped || data.skipped.length === 0)) {
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      }
    } catch (error) {
      console.error('Credential upload failed:', error);
      setImportErrors([{
        email: 'System Error',
        error: error.message || 'Upload failed unexpectedly'
      }]);
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      open={open}
      onClose={handleCloseDialog}
      sx={{ '& .MuiDialog-paper': { p: 0 } }}
    >
      <MainCard
        modal
        title="Bulk Upload Credentials"
        secondary={
          <IconButton onClick={handleCloseDialog} size="large">
            <CloseOutlined />
          </IconButton>
        }
      >
        <Box sx={{ px: 1, py: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Stack spacing={3}>
            {/* Instructions */}
            {!showResults && (
              <Stack spacing={2}>
                {orgTools.length === 0 && (
                  <Alert severity="warning">
                    <Typography variant="subtitle2" gutterBottom>
                      No tool templates found
                    </Typography>
                    <Typography variant="body2">
                      Before uploading credentials, set up your tools in{' '}
                      <strong>Resources &rarr; Tool Templates</strong>.
                      Each tool (e.g. CRM, LMS) needs to be created once with its name, URL, and description.
                      You can then reference it by its ID when uploading credentials.
                    </Typography>
                  </Alert>
                )}
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Upload tool access credentials for existing participants:
                  </Typography>
                  <Typography variant="body2" component="div">
                    1. Set up your tools in <strong>Resources &rarr; Tool Templates</strong> (if not done already)<br/>
                    2. Download the template below (pre-filled with participant emails)<br/>
                    3. Check the &ldquo;Tool Templates&rdquo; sheet for available tool IDs<br/>
                    4. Fill in: toolId, username, accessCode<br/>
                    5. Each row creates one credential &mdash; duplicate rows for multiple tools per participant<br/>
                    6. Upload the completed file
                  </Typography>
                </Alert>
              </Stack>
            )}

            {/* Actions: Download + Upload */}
            {!showResults && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={toolsLoading ? <CircularProgress size={16} /> : <FileTextOutlined />}
                  onClick={downloadTemplate}
                  size="small"
                  disabled={toolsLoading}
                >
                  {toolsLoading ? 'Loading Tools...' : 'Download Template'}
                </Button>

                <Divider orientation="vertical" flexItem />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.numbers"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  Select File
                </Button>
                {fileName && (
                  <Typography variant="body2" color="text.secondary">
                    {fileName}
                  </Typography>
                )}
              </Stack>
            )}

            {/* Validation Errors */}
            {csvErrors.length > 0 && !showResults && (
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>
                  Please fix the following issues:
                </Typography>
                {csvErrors.slice(0, 20).map((error, index) => (
                  <Typography key={index} variant="body2">
                    &bull; {error}
                  </Typography>
                ))}
                {csvErrors.length > 20 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    ... and {csvErrors.length - 20} more errors
                  </Typography>
                )}
              </Alert>
            )}

            {/* Preview Table */}
            {csvData.length > 0 && csvErrors.length === 0 && !showResults && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Preview ({csvData.length} credential{csvData.length !== 1 ? 's' : ''} to upload):
                </Typography>
                <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {csvHeaders.filter(h => h !== '_rowIndex').map((header) => (
                          <TableCell key={header}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">{header}</Typography>
                              {requiredCredentialFields.includes(header) && (
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
                          {csvHeaders.filter(h => h !== '_rowIndex').map((header) => (
                            <TableCell key={header}>
                              <Typography variant="body2">
                                {header === 'accessCode' ? '****' : (row[header] || '-')}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {csvData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={csvHeaders.length} align="center">
                            <Typography variant="body2" color="text.secondary">
                              ... and {csvData.length - 5} more credentials
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
                  Upload Results:
                </Typography>

                {importResult && (
                  <Alert
                    severity={importErrors.length > 0 ? 'warning' : 'success'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      <strong>Total processed:</strong> {importResult.total}<br/>
                      <strong>Created:</strong> {importResult.created}<br/>
                      <strong>Skipped (duplicates):</strong> {importResult.skipped}<br/>
                      <strong>Failed:</strong> {importResult.failed}
                    </Typography>
                  </Alert>
                )}

                {importSkipped.length > 0 && (
                  <Accordion sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<DownOutlined />}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Skipped ({importSkipped.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {importSkipped.map((item, index) => (
                          <Box key={index}>
                            <ListItem>
                              <ListItemText
                                primary={`${item.email} - ${item.tool} (${item.username})`}
                                secondary={item.reason}
                              />
                            </ListItem>
                            {index < importSkipped.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
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

        {/* Footer Actions */}
        <Divider />
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2, flexShrink: 0 }}>
          <Button onClick={handleCloseDialog} color="secondary">
            {showResults ? 'Close' : 'Cancel'}
          </Button>
          {!showResults && (
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={csvData.length === 0 || csvErrors.length > 0 || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <UploadOutlined />}
            >
              {isSubmitting ? 'Uploading...' : `Upload ${csvData.length} Credential${csvData.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </Stack>
      </MainCard>
    </Dialog>
  );
};

BulkCredentialUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  participants: PropTypes.array,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  projectTitle: PropTypes.string,
  onComplete: PropTypes.func
};

export default BulkCredentialUploadDialog;
