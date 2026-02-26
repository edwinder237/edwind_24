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

const requiredCredentialFields = ['email', 'tool', 'username', 'accessCode'];

const BulkCredentialUploadDialog = ({
  open,
  onClose,
  participants = [],
  projectId,
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
        if (!row[field] || row[field].trim() === '') {
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
    const headers = ['email', 'firstName', 'lastName', 'externalId', 'tool', 'toolType', 'username', 'accessCode', 'toolUrl', 'toolDescription'];
    const rows = participants.map(p => [
      p.participant?.email || '',
      p.participant?.firstName || '',
      p.participant?.lastName || '',
      p.participant?.externalId || '',
      '', '', '', '', '', '' // Empty credential columns for user to fill
    ]);
    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 30 }, // email
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 15 }, // externalId
      { wch: 18 }, // tool
      { wch: 12 }, // toolType
      { wch: 20 }, // username
      { wch: 20 }, // accessCode
      { wch: 30 }, // toolUrl
      { wch: 30 }, // toolDescription
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'credentials_template');

    // Sheet 2: Instructions
    const instrData = [
      ['Bulk Credential Upload Instructions'],
      [''],
      ['Required columns: email, tool, username, accessCode'],
      ['Optional columns: toolType, toolUrl, toolDescription'],
      ['Reference columns (pre-filled): firstName, lastName, externalId'],
      [''],
      ['Notes:'],
      ['- email must match an existing participant in the project'],
      ['- Each row creates one tool access record'],
      ['- A participant can have multiple rows for multiple tools (duplicate the row)'],
      ['- Duplicates (same tool + username for same participant) will be skipped'],
      ['- If email is missing, externalId will be used as a fallback match key'],
      [''],
      ['Common Tool Types:'],
      ['crm, lms, dashboard, project, email, calendar, communication, storage']
    ];
    const instrSheet = XLSX.utils.aoa_to_sheet(instrData);
    instrSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

    XLSX.writeFile(wb, 'credentials_template.xlsx');
  }, [participants]);

  const handleUpload = async () => {
    if (csvErrors.length > 0 || csvData.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/participants/bulk-upload-credentials', {
        projectId,
        credentials: csvData.map(row => ({
          email: row.email?.trim() || '',
          externalId: row.externalId?.trim() || '',
          tool: row.tool?.trim() || '',
          toolType: row.toolType?.trim() || '',
          username: row.username?.trim() || '',
          accessCode: row.accessCode?.trim() || '',
          toolUrl: row.toolUrl?.trim() || null,
          toolDescription: row.toolDescription?.trim() || null
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
        title="Bulk Upload Credentials"
        secondary={
          <IconButton onClick={handleCloseDialog} size="large">
            <CloseOutlined />
          </IconButton>
        }
      >
        <Box sx={{ px: 1, py: 2 }}>
          <Stack spacing={3}>
            {/* Instructions */}
            {!showResults && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Upload tool access credentials for existing participants:
                </Typography>
                <Typography variant="body2" component="div">
                  1. Download the template (pre-filled with participant emails)<br/>
                  2. Fill in the credential columns: tool, username, accessCode<br/>
                  3. Optional columns: toolType, toolUrl, toolDescription<br/>
                  4. Each row creates one credential &mdash; duplicate rows for multiple tools per participant<br/>
                  5. Upload the completed file
                </Typography>
              </Alert>
            )}

            {/* Actions: Download + Upload */}
            {!showResults && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<FileTextOutlined />}
                  onClick={downloadTemplate}
                  size="small"
                >
                  Download Template
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
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
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
  onComplete: PropTypes.func
};

export default BulkCredentialUploadDialog;
