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
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';

// Project imports
import MainCard from 'components/MainCard';
import { PopupTransition } from 'components/@extended/Transitions';

const SendInviteDialog = ({
  open,
  onClose,
  participants = [],
  eventTitle = 'Event',
  onSend
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);

  // Filter participants with valid email addresses
  const validParticipants = useMemo(() => {
    return participants.filter(p => p.participant?.email);
  }, [participants]);

  // Handle individual participant selection
  const handleParticipantToggle = (participantId) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);

    // Update select all state
    setSelectAll(newSelected.size === validParticipants.length);
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedParticipants(new Set());
      setSelectAll(false);
    } else {
      const allIds = validParticipants.map(p => p.id);
      setSelectedParticipants(new Set(allIds));
      setSelectAll(true);
    }
  };

  // Handle send invites
  const handleSendInvites = async () => {
    setSending(true);
    try {
      const selected = validParticipants.filter(p =>
        selectedParticipants.has(p.id)
      );

      await onSend(selected);

      // Reset state and close dialog
      setSelectedParticipants(new Set());
      setSelectAll(false);
      onClose();
    } catch (error) {
      console.error('Failed to send invites:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSelectedParticipants(new Set());
      setSelectAll(false);
      onClose();
    }
  };

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 550 } }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarOutlined />
            <Typography variant="h5">Send Calendar Invites</Typography>
          </Stack>
        }
        content={false}
        sx={{ m: 0 }}
      >
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Event Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Event
              </Typography>
              <Typography variant="h6">
                {eventTitle}
              </Typography>
            </Box>

            <Divider />

            {/* Participant Selection */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Select Participants ({validParticipants.length} available)
                </Typography>
                {validParticipants.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAllToggle}
                        indeterminate={selectedParticipants.size > 0 && selectedParticipants.size < validParticipants.length}
                      />
                    }
                    label="Select All"
                  />
                )}
              </Stack>

              {validParticipants.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {validParticipants.map((attendee, index) => {
                      const participant = attendee.participant;
                      const isSelected = selectedParticipants.has(attendee.id);

                      return (
                        <React.Fragment key={attendee.id}>
                          <ListItem
                            onClick={() => handleParticipantToggle(attendee.id)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              },
                              backgroundColor: isSelected ? 'action.selected' : 'transparent'
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={participant?.profileImg}
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: isSelected ? 'primary.main' : 'grey.300',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {participant?.profileImg ? null : getInitials(participant?.firstName, participant?.lastName)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={500}>
                                  {participant?.firstName} {participant?.lastName}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {participant?.email}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleParticipantToggle(attendee.id)}
                                color="primary"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < validParticipants.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Paper>
              ) : (
                <Alert severity="info" icon={<UserOutlined />}>
                  No participants with email addresses found for this event.
                </Alert>
              )}
            </Box>

            {/* Selection Summary */}
            {selectedParticipants.size > 0 && (
              <Alert severity="success" icon={<CheckCircleOutlined />}>
                {selectedParticipants.size} participant{selectedParticipants.size !== 1 ? 's' : ''} selected
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
                onClick={handleSendInvites}
                variant="contained"
                color="primary"
                disabled={selectedParticipants.size === 0 || sending}
                startIcon={sending ? <CircularProgress size={16} /> : <MailOutlined />}
              >
                {sending ? 'Sending...' : `Send Invite${selectedParticipants.size > 1 ? 's' : ''} (${selectedParticipants.size})`}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </MainCard>
    </Dialog>
  );
};

SendInviteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  participants: PropTypes.array,
  eventTitle: PropTypes.string,
  onSend: PropTypes.func.isRequired,
};

export default SendInviteDialog;
