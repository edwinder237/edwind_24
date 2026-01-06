import React, { useState, useMemo } from 'react';
import {
  Dialog,
  Stack,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Checkbox,
  Chip,
  alpha,
  Alert,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel
} from '@mui/material';
import { Add, Person, Search } from '@mui/icons-material';
import { TeamOutlined, BulbOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

/**
 * AddParticipantsDialog - Modal dialog for adding participants and groups to events
 * Handles tabbed interface with groups, individual participants, and suggested participants
 */
const AddParticipantsDialog = ({
  isOpen,
  onClose,
  selectedEvent,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  selectedGroups,
  selectedParticipants,
  onToggleGroup,
  onToggleParticipant,
  onSelectAllGroups,
  onDeselectAllGroups,
  onSelectAllParticipants,
  onDeselectAllParticipants,
  onApplySelections,
  isLoading,
  availableGroups,
  availableParticipants,
  suggestedParticipants,
  courseRoleIds,
  courseEvents = []
}) => {
  // State for session action (add to additional session or move)
  const [sessionAction, setSessionAction] = useState('add'); // 'add' or 'move'

  // Helper function to get events a participant is assigned to (for this course)
  const getParticipantCourseEvents = (participantId) => {
    if (!courseEvents.length) return [];
    return courseEvents.filter(event =>
      event.event_attendees?.some(attendee => attendee.enrolleeId === participantId)
    );
  };

  // Check which selected participants are already in other sessions
  const selectedParticipantsWithSessions = useMemo(() => {
    return selectedParticipants.filter(p => getParticipantCourseEvents(p.id).length > 0);
  }, [selectedParticipants, courseEvents]);

  // Handle apply with session action
  const handleApplyWithAction = () => {
    onApplySelections(sessionAction, selectedParticipantsWithSessions, courseEvents);
  };
  // Groups tab content
  const groupsTabContent = (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Select multiple groups to add to this event.
      </Typography>

      {availableGroups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No available groups to add
        </Typography>
      ) : (
        <Stack spacing={3}>
          {/* Selection Summary */}
          {selectedGroups.length > 0 && (
            <Box sx={{
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              borderRadius: 1,
              border: 1,
              borderColor: 'primary.main'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="primary.main" fontWeight={500}>
                  {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''} selected
                </Typography>
                <Chip
                  label={`${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  variant="filled"
                />
              </Stack>
            </Box>
          )}

          {/* Available Groups */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Available Groups ({availableGroups.length})
              </Typography>
              {availableGroups.length > 1 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const allSelected = availableGroups.every(group =>
                      selectedGroups.some(sg => sg.id === group.id)
                    );
                    if (allSelected) {
                      onDeselectAllGroups();
                    } else {
                      onSelectAllGroups(availableGroups);
                    }
                  }}
                  sx={{
                    color: 'primary.main',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: 'primary.lighter'
                    }
                  }}
                >
                  {availableGroups.every(group => selectedGroups.some(sg => sg.id === group.id))
                    ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </Stack>
            <Stack spacing={1}>
              {availableGroups.map((group) => {
                const isSelected = selectedGroups.some(sg => sg.id === group.id);
                return (
                  <Box
                    key={group.id}
                    onClick={() => onToggleGroup(group)}
                    sx={{
                      p: 1,
                      border: 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Checkbox
                        checked={isSelected}
                        color="primary"
                        size="small"
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: group.chipColor || 'primary.main'
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {group.groupName}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • {group.participants?.length || 0} members
                          </Typography>
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      )}
    </Stack>
  );

  // Participants tab content
  const participantsTabContent = (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Select individual participants to add to this event.
      </Typography>

      {/* Search Field */}
      <TextField
        size="medium"
        placeholder="Search participants..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        autoComplete="off"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'text.secondary', fontSize: '1.5rem' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            fontSize: '1rem',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '1rem',
            padding: '12px 14px',
          },
        }}
      />

      {availableParticipants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Search sx={{ fontSize: '2rem', color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {searchTerm.trim()
              ? `No participants found matching "${searchTerm}"`
              : 'No available participants to add'
            }
          </Typography>
          {searchTerm.trim() && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try adjusting your search terms
            </Typography>
          )}
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Selection Summary */}
          {selectedParticipants.length > 0 && (
            <Box sx={{
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
              borderRadius: 1,
              border: 1,
              borderColor: 'secondary.main'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="secondary.main" fontWeight={500}>
                  {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                </Typography>
                <Chip
                  label={`${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`}
                  size="small"
                  color="secondary"
                  variant="filled"
                />
              </Stack>
            </Box>
          )}

          {/* Available Participants List */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                Available Participants ({availableParticipants.length})
              </Typography>
              {availableParticipants.length > 1 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const allSelected = availableParticipants.every(participant =>
                      selectedParticipants.some(sp => sp.id === participant.id)
                    );
                    if (allSelected) {
                      onDeselectAllParticipants();
                    } else {
                      onSelectAllParticipants(availableParticipants);
                    }
                  }}
                  sx={{
                    color: 'secondary.main',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: 'secondary.lighter'
                    }
                  }}
                >
                  {availableParticipants.every(participant => selectedParticipants.some(sp => sp.id === participant.id))
                    ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </Stack>
            <Stack spacing={1}>
              {availableParticipants.map((participant) => {
                const isSelected = selectedParticipants.some(sp => sp.id === participant.id);
                const assignedEvents = getParticipantCourseEvents(participant.id);
                return (
                  <Box
                    key={participant.id}
                    onClick={() => onToggleParticipant(participant)}
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: isSelected ? 'secondary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? (theme) => alpha(theme.palette.secondary.main, 0.08) : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? (theme) => alpha(theme.palette.secondary.main, 0.12) : 'action.hover',
                        borderColor: 'secondary.main'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                      <Checkbox
                        checked={isSelected}
                        color="secondary"
                        size="small"
                        sx={{ mt: -0.5 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {participant.participant ?
                            `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
                            'Unknown Participant'
                          }
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • {participant.participant?.role?.title || 'Participant'}
                          </Typography>
                        </Typography>
                        {assignedEvents.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {assignedEvents.map(event => {
                              const eventDate = event.start ? new Date(event.start) : null;
                              const dateStr = eventDate ? eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                              const timeStr = eventDate ? eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                              return (
                                <Chip
                                  key={event.id}
                                  label={`${dateStr}${timeStr ? ` ${timeStr}` : ''}`}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.7rem',
                                    backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
                                    color: 'info.dark',
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      )}
    </Stack>
  );

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          maxHeight: '90vh',
          height: 'auto',
          maxWidth: '480px'
        }
      }}
    >
      <MainCard
        title={
          <Stack direction="column" spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Add color="primary" />
              <Typography variant="h6">Add Attendee(s)</Typography>
            </Stack>
            {selectedEvent?.title && (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                {selectedEvent.title}
              </Typography>
            )}
          </Stack>
        }
        content={false}
        sx={{ m: 0, boxShadow: 'none' }}
      >
        <Stack spacing={0}>
          {/* Tab Navigation */}
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => onTabChange(newValue)}
            aria-label="add participant tabs"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
          >
            <Tab 
              label="Groups" 
              icon={<TeamOutlined />} 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              label="Participants" 
              icon={<Person />} 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              label="Suggested" 
              icon={<BulbOutlined />} 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ 
            maxHeight: 'calc(90vh - 220px)', 
            overflowY: 'auto',
            p: 3,
            pb: 1
          }}>
            {activeTab === 0 && groupsTabContent}
            {activeTab === 1 && participantsTabContent}
            {activeTab === 2 && (
              <Typography variant="body2" color="text.secondary">
                Suggested participants tab - TODO: Implement based on course requirements
              </Typography>
            )}
          </Box>

          {/* Session Conflict Warning */}
          {selectedParticipantsWithSessions.length > 0 && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                {selectedParticipantsWithSessions.length === 1 ? (
                  <>
                    <strong>
                      {selectedParticipantsWithSessions[0].participant?.firstName} {selectedParticipantsWithSessions[0].participant?.lastName}
                    </strong>{' '}
                    is already assigned to another session of this course.
                  </>
                ) : (
                  <>{selectedParticipantsWithSessions.length} selected participants are already assigned to other sessions of this course.</>
                )}
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                Choose an action:
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={sessionAction}
                  onChange={(e) => setSessionAction(e.target.value)}
                >
                  <FormControlLabel
                    value="add"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        Add to additional session (participants will be in multiple sessions)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="move"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        Move to this session (remove from current sessions)
                      </Typography>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {/* Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{
              p: 3,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outlined"
              sx={{
                borderColor: 'grey.300',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'grey.400',
                  backgroundColor: 'grey.50'
                },
                textTransform: 'none',
                px: 3,
                py: 1
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyWithAction}
              disabled={(selectedGroups.length === 0 && selectedParticipants.length === 0) || isLoading}
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500'
                },
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 500
              }}
            >
              {isLoading
                ? (sessionAction === 'move' ? 'Moving...' : 'Adding...')
                : sessionAction === 'move' && selectedParticipantsWithSessions.length > 0
                  ? `Move ${selectedGroups.length + selectedParticipants.length} Attendee(s)`
                  : `Add ${selectedGroups.length + selectedParticipants.length} Attendee(s)`
              }
            </Button>
          </Stack>
        </Stack>
      </MainCard>
    </Dialog>
  );
};

export default AddParticipantsDialog;