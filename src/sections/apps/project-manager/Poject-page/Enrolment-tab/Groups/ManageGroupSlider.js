import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';

// assets
import {
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const ManageGroupSlider = ({ 
  open, 
  onClose, 
  groups = [], 
  participants = [], 
  onUpdateGroup,
  error = null,
  onRetry,
  loading = false
}) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [availableParticipants, setAvailableParticipants] = useState([]);

  useEffect(() => {

    // Safety check: if selectedGroup is set but not found in groups, reset it
    if (selectedGroup && groups.length > 0) {
      const group = groups.find(g => g && g.id === selectedGroup);
      if (!group) {
        setSelectedGroup('');
        setSelectedGroupData(null);
        return;
      }
      
      setSelectedGroupData(group);
      
      // Get participants not in ANY group (to prevent multiple group assignments)
      const allGroupParticipantIds = groups.reduce((acc, g) => {
        if (g && g.participants) {
          const participantIds = g.participants.map(p => p.participantId);
          return [...acc, ...participantIds];
        }
        return acc;
      }, []);
      
      console.log('All participants in any group:', allGroupParticipantIds);
      console.log('All participants received:', participants);
      console.log('Participants structure:', participants.map(p => ({ id: p.id, projectParticipantId: p.projectParticipantId, name: `${p.firstName} ${p.lastName}` })));
      
      const available = participants.filter(p => !allGroupParticipantIds.includes(p.projectParticipantId));
      console.log('Available participants (not in any group):', available);
      setAvailableParticipants(available);
    } else {
      setSelectedGroupData(null);
      
      // Even when no group is selected, only show participants not in any group
      const allGroupParticipantIds = groups.reduce((acc, g) => {
        if (g && g.participants) {
          const participantIds = g.participants.map(p => p.participantId);
          return [...acc, ...participantIds];
        }
        return acc;
      }, []);
      
      const unassignedParticipants = participants.filter(p => !allGroupParticipantIds.includes(p.projectParticipantId));
      setAvailableParticipants(unassignedParticipants || []);
    }
  }, [selectedGroup, groups, participants]);

  const handleGroupChange = (event) => {
    const value = event.target.value;
    // Ensure we never set undefined or invalid values
    setSelectedGroup(value || '');
  };

  const handleAddParticipant = (projectParticipantId) => {
    if (selectedGroupData && onUpdateGroup) {
      onUpdateGroup(selectedGroupData.id, 'add', projectParticipantId);
    }
  };

  const handleRemoveParticipant = (projectParticipantId) => {
    if (selectedGroupData && onUpdateGroup) {
      onUpdateGroup(selectedGroupData.id, 'remove', projectParticipantId);
    }
  };

  const drawerHeight = 500;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          height: drawerHeight,
          boxSizing: 'border-box',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ mb: 2 }}
        >
          <Typography variant="h5">Manage Group Participants</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Group Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Group</InputLabel>
          <Select
            value={selectedGroup || ''}
            onChange={handleGroupChange}
            label="Select Group"
            size="small"
          >
            <MenuItem value="">
              <Typography variant="body2" color="text.secondary">
                Select a group...
              </Typography>
            </MenuItem>
            {groups && groups.map((group) => (
              <MenuItem key={group?.id || Math.random()} value={group?.id || ''}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Chip
                    size="small"
                    label={group?.groupName || 'Unknown Group'}
                    style={{ 
                      backgroundColor: group?.chipColor || '#1976d2', 
                      color: '#fff' 
                    }}
                  />
                  <Typography variant="body2">
                    ({group?.participants?.length || 0} members)
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedGroupData && (
          <Stack direction="row" spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
            {/* Available Participants */}
            <Box sx={{ flex: 1 }}>
              <MainCard title="Unassigned Participants" sx={{ height: '100%' }}>
                <Box sx={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
                  {availableParticipants.length > 0 ? (
                    <List dense>
                      {availableParticipants.map((participant) => {
                        console.log('Rendering available participant:', participant);
                        return (
                          <ListItem key={participant.id || participant.projectParticipantId}>
                            <Avatar sx={{ mr: 2 }}>
                              <UserOutlined />
                            </Avatar>
                            <ListItemText
                              primary={`${participant.firstName} ${participant.lastName}`}
                              secondary={participant.derpartement || participant.role || 'No role specified'}
                            />
                            <ListItemSecondaryAction>
                              <Button
                                size="small"
                                startIcon={<PlusOutlined />}
                                onClick={() => handleAddParticipant(participant.projectParticipantId)}
                              >
                                Add
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : selectedGroup ? (
                    <Alert severity="info">
                      No unassigned participants available. All participants have been assigned to groups.
                    </Alert>
                  ) : (
                    <Alert severity="info">
                      {participants.length === 0 
                        ? 'No participants available in this project.' 
                        : 'No unassigned participants. All participants have been assigned to groups.'}
                    </Alert>
                  )}
                </Box>
              </MainCard>
            </Box>

            {/* Current Group Members */}
            <Box sx={{ flex: 1 }}>
              <MainCard title="Current Members" sx={{ height: '100%' }}>
                <Box sx={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
                  {selectedGroupData.participants && selectedGroupData.participants.length > 0 ? (
                    <List dense>
                      {selectedGroupData.participants.map((groupParticipant) => {
                        // Handle different possible data structures
                        let participant = null;
                        
                        // Try different possible structures
                        if (groupParticipant.participant?.participant) {
                          // Structure: groupParticipant.participant.participant
                          participant = groupParticipant.participant.participant;
                        } else if (groupParticipant.participant) {
                          // Structure: groupParticipant.participant
                          participant = groupParticipant.participant;
                        } else if (groupParticipant.firstName) {
                          // Direct structure: groupParticipant is the participant
                          participant = groupParticipant;
                        }
                        
                        console.log('Rendering group participant:', groupParticipant);
                        console.log('Full participant structure:', JSON.stringify(groupParticipant, null, 2));
                        console.log('Resolved participant data:', participant);
                        
                        if (!participant || !participant.firstName || !participant.lastName) {
                          console.error('No valid participant data found for groupParticipant:', groupParticipant);
                          return (
                            <ListItem key={groupParticipant.id || Math.random()}>
                              <Avatar sx={{ mr: 2 }}>
                                <UserOutlined />
                              </Avatar>
                              <ListItemText
                                primary="Unknown Participant"
                                secondary="Data structure issue"
                              />
                            </ListItem>
                          );
                        }
                        
                        return (
                          <ListItem key={groupParticipant.id}>
                            <Avatar sx={{ mr: 2 }}>
                              <UserOutlined />
                            </Avatar>
                            <ListItemText
                              primary={`${participant.firstName} ${participant.lastName}`}
                              secondary={participant.derpartement || participant.role || 'No department specified'}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                onClick={() => handleRemoveParticipant(groupParticipant.participantId)}
                              >
                                <DeleteOutlined />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Alert severity="info">No participants in this group yet.</Alert>
                  )}
                </Box>
              </MainCard>
            </Box>
          </Stack>
        )}

        {error && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert 
              severity="error" 
              sx={{ width: 'fit-content' }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={onRetry}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined />}
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {!error && !selectedGroup && groups.length === 0 && loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={40} />
              <Typography variant="body2">Loading groups...</Typography>
            </Stack>
          </Box>
        )}

        {!error && !selectedGroup && !loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert severity="info" sx={{ width: 'fit-content' }}>
              Please select a group to manage its participants.
            </Alert>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

ManageGroupSlider.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  groups: PropTypes.array,
  participants: PropTypes.array,
  onUpdateGroup: PropTypes.func,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  loading: PropTypes.bool,
};

export default ManageGroupSlider;