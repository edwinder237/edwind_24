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
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add, Person, Search } from '@mui/icons-material';
import { TeamOutlined } from '@ant-design/icons';
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
  courseRoleIds,
  courseEvents = [],
  allGroups = [] // All project groups for participant group lookup
}) => {
  // State for session action (add to additional session or move)
  const [sessionAction, setSessionAction] = useState('add'); // 'add' or 'move'
  // State for hiding already scheduled participants
  const [hideScheduled, setHideScheduled] = useState(true);
  // State for role filter
  const [selectedRole, setSelectedRole] = useState(null);
  // State for required filter
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);

  // Helper function to check if participant's role is required for this course
  const isParticipantRequired = (participant) => {
    const roleId = participant.participant?.role?.id;
    return roleId && courseRoleIds?.includes(roleId);
  };

  // Helper function to get the group(s) a participant belongs to
  // participantId is the project_participant ID (numeric)
  const getParticipantGroups = (participantId) => {
    if (!allGroups.length) return [];
    return allGroups.filter(group =>
      group.participants?.some(gp =>
        // gp.participant.id is the project_participant ID
        gp.participant?.id === participantId
      )
    );
  };

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

  // Filter available participants based on hideScheduled toggle, role filter, and required filter
  const filteredParticipants = useMemo(() => {
    let filtered = availableParticipants;
    if (hideScheduled) {
      filtered = filtered.filter(p => getParticipantCourseEvents(p.id).length === 0);
    }
    if (selectedRole) {
      filtered = filtered.filter(p => p.participant?.role?.title === selectedRole);
    }
    if (showRequiredOnly) {
      filtered = filtered.filter(p => isParticipantRequired(p));
    }
    return filtered;
  }, [availableParticipants, hideScheduled, courseEvents, selectedRole, showRequiredOnly, courseRoleIds]);

  // Count of scheduled participants (for display)
  const scheduledParticipantsCount = useMemo(() => {
    return availableParticipants.filter(p => getParticipantCourseEvents(p.id).length > 0).length;
  }, [availableParticipants, courseEvents]);

  // Count of required participants (for display)
  const requiredParticipantsCount = useMemo(() => {
    return availableParticipants.filter(p => isParticipantRequired(p)).length;
  }, [availableParticipants, courseRoleIds]);

  // Get unique roles from available participants
  const uniqueRoles = useMemo(() => {
    const roles = new Map();
    availableParticipants.forEach(p => {
      const roleTitle = p.participant?.role?.title;
      if (roleTitle && !roles.has(roleTitle)) {
        roles.set(roleTitle, {
          title: roleTitle,
          count: availableParticipants.filter(
            participant => participant.participant?.role?.title === roleTitle
          ).length
        });
      }
    });
    return Array.from(roles.values()).sort((a, b) => b.count - a.count);
  }, [availableParticipants]);

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

      {/* Hide Scheduled Switch */}
      {scheduledParticipantsCount > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Hide already scheduled ({scheduledParticipantsCount})
          </Typography>
          <Switch
            checked={hideScheduled}
            onChange={(e) => setHideScheduled(e.target.checked)}
            size="small"
            color="primary"
          />
        </Stack>
      )}

      {/* Role Quick Filters */}
      {(uniqueRoles.length > 1 || requiredParticipantsCount > 0) && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All"
            size="small"
            variant={selectedRole === null && !showRequiredOnly ? 'filled' : 'outlined'}
            color={selectedRole === null && !showRequiredOnly ? 'primary' : 'default'}
            onClick={() => {
              setSelectedRole(null);
              setShowRequiredOnly(false);
            }}
            sx={{ cursor: 'pointer' }}
          />
          {requiredParticipantsCount > 0 && (
            <Chip
              label={`Required (${requiredParticipantsCount})`}
              size="small"
              variant={showRequiredOnly ? 'filled' : 'outlined'}
              color={showRequiredOnly ? 'warning' : 'default'}
              onClick={() => {
                setShowRequiredOnly(!showRequiredOnly);
                if (!showRequiredOnly) setSelectedRole(null);
              }}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {uniqueRoles.map((role) => (
            <Chip
              key={role.title}
              label={role.title}
              size="small"
              variant={selectedRole === role.title ? 'filled' : 'outlined'}
              color={selectedRole === role.title ? 'primary' : 'default'}
              onClick={() => {
                setSelectedRole(selectedRole === role.title ? null : role.title);
                if (selectedRole !== role.title) setShowRequiredOnly(false);
              }}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      )}

      {filteredParticipants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Search sx={{ fontSize: '2rem', color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {searchTerm.trim()
              ? `No participants found matching "${searchTerm}"`
              : selectedRole
                ? `No ${selectedRole} participants available`
                : hideScheduled && scheduledParticipantsCount > 0
                  ? 'All participants are already scheduled for this course'
                  : 'No available participants to add'
            }
          </Typography>
          {searchTerm.trim() && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try adjusting your search terms
            </Typography>
          )}
          {(selectedRole || (hideScheduled && scheduledParticipantsCount > 0)) && !searchTerm.trim() && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try adjusting the filters above
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
                Available Participants ({filteredParticipants.length})
              </Typography>
              {filteredParticipants.length > 1 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const allSelected = filteredParticipants.every(participant =>
                      selectedParticipants.some(sp => sp.id === participant.id)
                    );
                    if (allSelected) {
                      onDeselectAllParticipants();
                    } else {
                      onSelectAllParticipants(filteredParticipants);
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
                  {filteredParticipants.every(participant => selectedParticipants.some(sp => sp.id === participant.id))
                    ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </Stack>
            <Stack spacing={1}>
              {filteredParticipants.map((participant) => {
                const isSelected = selectedParticipants.some(sp => sp.id === participant.id);
                const assignedEvents = getParticipantCourseEvents(participant.id);
                const isRequired = isParticipantRequired(participant);
                const participantGroups = getParticipantGroups(participant.id);
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
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {participant.participant ?
                              `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
                              'Unknown Participant'
                            }
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              • {participant.participant?.role?.title || 'Participant'}
                            </Typography>
                          </Typography>
                          {isRequired && (
                            <Chip
                              label="Required"
                              size="small"
                              color="warning"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                '& .MuiChip-label': { px: 0.75 }
                              }}
                            />
                          )}
                        </Stack>
                        {participantGroups.length > 0 && (
                          <Typography variant="caption" sx={{ color: participantGroups[0]?.chipColor || 'text.disabled', mt: 0.25 }}>
                            {participantGroups.map(g => g.groupName).join(', ')}
                          </Typography>
                        )}
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