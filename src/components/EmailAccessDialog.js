import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  FormGroup,
  Paper,
} from '@mui/material';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';

// Project imports
import MainCard from 'components/MainCard';
import { PopupTransition } from 'components/@extended/Transitions';

const EmailAccessDialog = ({ 
  open, 
  onClose, 
  selectedParticipants = [], 
  onSend 
}) => {
  const [selectedCredentials, setSelectedCredentials] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);

  // Collect all unique tool accesses from selected participants
  const allToolAccesses = useMemo(() => {
    const toolMap = new Map();
    
    selectedParticipants.forEach(participant => {
      if (participant?.participant?.toolAccesses) {
        participant.participant.toolAccesses.forEach(toolAccess => {
          const key = `${toolAccess.tool}-${toolAccess.toolType}`;
          if (!toolMap.has(key)) {
            toolMap.set(key, {
              id: toolAccess.id,
              tool: toolAccess.tool,
              toolType: toolAccess.toolType || 'Tool',
              toolUrl: toolAccess.toolUrl,
              toolDescription: toolAccess.toolDescription,
              // Count how many participants have this tool
              participantCount: 0
            });
          }
          toolMap.get(key).participantCount += 1;
        });
      }
    });
    
    return Array.from(toolMap.values()).sort((a, b) => a.tool.localeCompare(b.tool));
  }, [selectedParticipants]);

  // Handle individual credential selection
  const handleCredentialToggle = (toolKey) => {
    const newSelected = new Set(selectedCredentials);
    if (newSelected.has(toolKey)) {
      newSelected.delete(toolKey);
    } else {
      newSelected.add(toolKey);
    }
    setSelectedCredentials(newSelected);
    
    // Update select all state
    setSelectAll(newSelected.size === allToolAccesses.length);
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedCredentials(new Set());
      setSelectAll(false);
    } else {
      const allKeys = allToolAccesses.map(tool => `${tool.tool}-${tool.toolType}`);
      setSelectedCredentials(new Set(allKeys));
      setSelectAll(true);
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    setSending(true);
    try {
      const selectedTools = allToolAccesses.filter(tool => 
        selectedCredentials.has(`${tool.tool}-${tool.toolType}`)
      );
      
      await onSend({
        participants: selectedParticipants,
        credentials: selectedTools
      });
      
      // Reset state and close dialog
      setSelectedCredentials(new Set());
      setSelectAll(false);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSelectedCredentials(new Set());
      setSelectAll(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 600 } }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <MailOutlined />
            <Typography variant="h5">Email Access Credentials</Typography>
          </Stack>
        }
        content={false}
        sx={{ m: 0 }}
      >
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Participants Summary */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Selected Participants ({selectedParticipants.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedParticipants.map((participant, index) => (
                  <Chip
                    key={participant.id || index}
                    label={`${participant.participant?.firstName} ${participant.participant?.lastName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Credential Selection */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Select Credentials to Send
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAllToggle}
                      indeterminate={selectedCredentials.size > 0 && selectedCredentials.size < allToolAccesses.length}
                    />
                  }
                  label="Select All"
                />
              </Stack>

              {allToolAccesses.length > 0 ? (
                <Paper variant="outlined">
                  <List>
                    {allToolAccesses.map((tool, index) => {
                      const toolKey = `${tool.tool}-${tool.toolType}`;
                      const isSelected = selectedCredentials.has(toolKey);
                      
                      return (
                        <React.Fragment key={toolKey}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <ToolOutlined />
                                  <Typography variant="subtitle2">
                                    {tool.tool}
                                  </Typography>
                                  <Chip
                                    label={tool.toolType}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ({tool.participantCount} participants)
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Box mt={1}>
                                  {tool.toolDescription && (
                                    <Typography variant="body2" color="text.secondary">
                                      {tool.toolDescription}
                                    </Typography>
                                  )}
                                  {tool.toolUrl && (
                                    <Typography
                                      variant="caption"
                                      color="primary"
                                      component="a"
                                      href={tool.toolUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ display: 'block', mt: 0.5 }}
                                    >
                                      {tool.toolUrl}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleCredentialToggle(toolKey)}
                                color="primary"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < allToolAccesses.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Paper>
              ) : (
                <Alert severity="info">
                  No tool access credentials found for the selected participants.
                </Alert>
              )}
            </Box>

            {/* Selection Summary */}
            {selectedCredentials.size > 0 && (
              <Alert severity="success" icon={<CheckCircleOutlined />}>
                {selectedCredentials.size} credential{selectedCredentials.size !== 1 ? 's' : ''} selected
                for {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''}
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack 
              direction="row" 
              justifyContent="flex-end" 
              spacing={2}
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button
                onClick={handleClose}
                disabled={sending}
                startIcon={<CloseCircleOutlined />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                variant="contained"
                color="primary"
                disabled={selectedCredentials.size === 0 || sending}
                startIcon={sending ? <CircularProgress size={16} /> : <MailOutlined />}
              >
                {sending ? 'Sending...' : `Send Email${selectedCredentials.size > 0 ? ` (${selectedCredentials.size})` : ''}`}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </MainCard>
    </Dialog>
  );
};

EmailAccessDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedParticipants: PropTypes.array,
  onSend: PropTypes.func.isRequired,
};

export default EmailAccessDialog;