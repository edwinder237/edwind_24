import PropTypes from "prop-types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { groupCommands } from 'store/commands/groupCommands';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { selectAllGroups } from 'store/entities/groupsSlice';
import eventBus from 'store/events/EventBus';

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  useMediaQuery,
  Grid,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  TextField,
  Checkbox,
  Switch,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

//components
import ScrollX from "components/ScrollX";

// project import
import MainCard from "components/MainCard";
import GroupEnrolledTable from "./GroupEnrolledTable";
import CurriculmWidget from "../shared/CurriculmWidget";
import GroupCurriculumWidget from "./GroupCurriculumWidget";
import CurriculumManageDialog from "./CurriculumManageDialog";
import GroupCurriculumTable from "./GroupCurriculumTable";

// assets
import { PlusCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import IconButton from "components/@extended/IconButton";

// ==============================|| EXPANDING TABLE - USER DETAILS ||============================== //

const GroupDetails = ({ Group, onProgressLoad, projectId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentAction, setAssignmentAction] = useState('add'); // 'add' or 'move'
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignedParticipants, setShowAssignedParticipants] = useState(false); // Toggle to show/hide participants already in a group

  // Get participants from normalized entity store (CQRS pattern)
  const normalizedParticipants = useSelector(selectAllParticipants);

  // Map normalized participants to the format expected by this component
  const project_participants = useMemo(() => {
    return normalizedParticipants.map(p => ({
      id: p.id, // project_participants.id
      participant: p.participant,
      participantId: p.participantId,
      ...p
    }));
  }, [normalizedParticipants]);

  // Trigger progress loading when component mounts
  useEffect(() => {
    if (Group?.id && !Group?.progressData && onProgressLoad) {
      onProgressLoad(Group.id);
    }
  }, [Group?.id, Group?.progressData, onProgressLoad]);

  const backColor = alpha(theme.palette.primary.lighter, 0.1);

  // Function to normalize accents for search
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, ''); // Remove accent marks
  };

  const handleCurriculumManage = () => {
    setCurriculumDialogOpen(true);
  };

  const handleCurriculumDialogClose = () => {
    setCurriculumDialogOpen(false);
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    // Publish event to trigger parent component refresh (CQRS pattern)
    eventBus.publish('groups:refresh-needed', {
      projectId,
      source: 'GroupDetails'
    });
  }, [projectId]);

  const handleAddParticipant = () => {
    setSelectedParticipants([]); // Clear any previous selections
    setAssignmentAction('add'); // Reset action
    setAddParticipantDialogOpen(true);
  };

  const handleAddParticipantDialogClose = () => {
    setAddParticipantDialogOpen(false);
    setSelectedParticipants([]);
    setAssignmentAction('add');
    setSearchTerm('');
  };

  // Get all project participants with their group information - memoized for performance
  // Use normalized groups from entity store (CQRS pattern)
  const groups = useSelector(selectAllGroups);

  const availableParticipants = useMemo(() => {
    if (!project_participants || !groups || groups.length === 0) {
      console.log('[GroupDetails] No data for availableParticipants:', {
        hasParticipants: !!project_participants,
        participantCount: project_participants?.length,
        hasGroups: !!groups,
        groupCount: groups?.length
      });
      return [];
    }

    console.log('[GroupDetails] Computing available participants:', {
      totalParticipants: project_participants.length,
      totalGroups: groups.length,
      currentGroup: Group?.id,
      currentGroupParticipants: Group?.participants?.length
    });

    const result = project_participants.map(pp => {
      // Find which group this participant is in
      // Check multiple possible ID fields for compatibility
      const participantGroup = groups.find(g =>
        g.participants?.some(gp => {
          const gpParticipantId = gp.participantId || gp.participant?.id;
          const ppId = pp.id || pp.participantId;
          return gpParticipantId === ppId;
        })
      );

      return {
        ...pp,
        currentGroup: participantGroup
      };
    }).filter(pp => {
      // Only show participants not in this specific group
      const ppId = pp.id || pp.participantId || pp.participant?.id;

      const isInThisGroup = Group?.participants?.some(gp => {
        const gpParticipantId = gp.participantId || gp.participant?.id || gp.id;
        return gpParticipantId === ppId;
      });

      return !isInThisGroup;
    }).reduce((unique, participant) => {
      // Remove duplicates based on participant ID
      const pId = participant.id || participant.participantId;
      if (!unique.some(p => (p.id || p.participantId) === pId)) {
        unique.push(participant);
      }
      return unique;
    }, []);

    console.log('[GroupDetails] Available participants result:', {
      count: result.length,
      participants: result.map(p => ({
        id: p.id,
        name: `${p.participant?.firstName} ${p.participant?.lastName}`,
        currentGroup: p.currentGroup?.groupName
      }))
    });

    return result;
  }, [project_participants?.length, groups?.length, Group?.participants?.length, Group?.id]);

  // Clear selected participants when they're no longer available (after assignment)
  useEffect(() => {
    if (selectedParticipants.length > 0) {
      const stillAvailable = selectedParticipants.filter(selected => 
        availableParticipants.some(available => available.id === selected.id)
      );
      
      if (stillAvailable.length !== selectedParticipants.length) {
        setSelectedParticipants(stillAvailable);
      }
    }
  }, [availableParticipants.length]); // Only trigger when the count changes

  const handleAssignParticipants = async () => {
    if (!selectedParticipants.length || !Group?.id) return;

    setIsAssigning(true);
    try {
      let successCount = 0;
      const errors = [];

      // Process each selected participant using CQRS commands
      for (const participant of selectedParticipants) {
        try {
          const currentGroup = participant.currentGroup;

          // If moving and participant is in another group, remove from current group first
          if (assignmentAction === 'move' && currentGroup?.id) {
            await dispatch(groupCommands.removeParticipantFromGroup({
              groupId: currentGroup.id,
              participantId: parseInt(participant.id)
            })).unwrap();
          }

          // Add to new group using CQRS command
          await dispatch(groupCommands.addParticipantToGroup({
            groupId: Group.id,
            participantId: parseInt(participant.id),
            projectId
          })).unwrap();

          successCount++;
        } catch (error) {
          errors.push(`${participant.participant?.firstName} ${participant.participant?.lastName}: ${error.error || error.message || 'Failed to assign'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        const actionText = assignmentAction === 'move' ? 'moved to' : 'added to';

        // Publish event to trigger parent component refresh (CQRS pattern)
        eventBus.publish('groups:refresh-needed', {
          projectId,
          source: 'GroupDetails',
          action: assignmentAction
        });

        // Clear selections after successful assignment
        setSelectedParticipants([]);
      }

      if (errors.length > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to assign ${errors.length} participant${errors.length > 1 ? 's' : ''}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      if (successCount === selectedParticipants.length) {
        handleAddParticipantDialogClose();
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to assign participants',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setIsAssigning(false);
    }
  };

  const { courses, participants } = Group || {};

  return (
    <TableRow
      sx={{
        bgcolor: backColor,
        "&:hover": { bgcolor: `${backColor} !important` },
      }}
    >
      <TableCell colSpan={8} sx={{ p: 2.5, position: 'relative' }}>
        <Grid
          container
          spacing={2.5}
          justifyContent="center"
          sx={{ pl: { xs: 0, sm: 2, md: 2, lg: 2, xl: 2 }, minHeight: '200px' }}
        >
          <Grid
            item
            xs={12}
            sm={4}
            md={4}
            lg={4}
            xl={4}
            sx={{ order: { xs: 1, sm: 0, md: 0, lg: 0, xl: 0 } }}
          >
            <MainCard
              title="Curriculum"
              content={false}
              secondary={
                <Tooltip title="Manage Group Curriculums">
                  <IconButton onClick={handleCurriculumManage}>
                    <PlusCircleOutlined />
                  </IconButton>
                </Tooltip>
              }
              sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
            >
              <GroupCurriculumWidget
                groupId={Group?.id}
                projectId={projectId}
                onManageCurriculums={handleCurriculumManage}
                refreshTrigger={refreshKey}
              />
            </MainCard>
          </Grid>
          <Grid item xs={12} sm={8} md={8} lg={8} xl={8}>
            <MainCard 
              title="Enrolled" 
              content={false}
              secondary={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UserAddOutlined />}
                  onClick={handleAddParticipant}
                >
                  Add Participants
                </Button>
              }
              sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
            >
              <ScrollX>
                {true && <GroupEnrolledTable
                  Enrolled={participants}
                  onRefresh={handleRefresh}
                  currentGroup={Group}
                  progressData={Group?.progressData}
                  projectId={projectId}
                />}
              </ScrollX>
            </MainCard>
          </Grid>
        </Grid>

        {/* Curriculum Management Dialog */}
        <CurriculumManageDialog
          open={curriculumDialogOpen}
          onClose={handleCurriculumDialogClose}
          group={Group}
          projectId={projectId}
          onRefresh={handleRefresh}
        />

        {/* Add Participant Dialog */}
        <Dialog 
          open={addParticipantDialogOpen} 
          onClose={handleAddParticipantDialogClose} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { height: '70vh', maxHeight: '600px' }
          }}
        >
          <MainCard
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <UserAddOutlined />
                <Typography variant="h6">
                  Add Participant to {Group?.groupName}
                </Typography>
              </Stack>
            }
            content={false}
            sx={{ m: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
              {availableParticipants.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  All project participants are already assigned to this group
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {/* Search Field and Filter Toggle */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by name, role, or current group..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Stack>

                  {/* Toggle to show/hide participants already in a group */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={showAssignedParticipants}
                          onChange={(e) => setShowAssignedParticipants(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          Show participants already in a group
                        </Typography>
                      }
                    />
                  </Stack>

                  {/* Selected Participants Summary */}
                  {selectedParticipants.length > 0 && (
                    <Box sx={{
                      p: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'primary.main'
                    }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                          {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setSelectedParticipants([])}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Clear All
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  {/* Scrollable Participants List */}
                  <Box sx={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                      }
                    }
                  }}>
                    {(() => {
                      const normalizedSearch = normalizeText(searchTerm);
                      const filteredParticipants = availableParticipants.filter((option) => {
                        // Filter by assigned status first
                        if (!showAssignedParticipants && option.currentGroup) {
                          return false;
                        }

                        // Then filter by search term
                        if (!searchTerm.trim()) return true;
                        const fullName = `${option.participant?.firstName} ${option.participant?.lastName}`;
                        const roleName = option.participant?.role?.title || '';
                        const groupName = option.currentGroup?.groupName || '';

                        return normalizeText(fullName).includes(normalizedSearch) ||
                               normalizeText(roleName).includes(normalizedSearch) ||
                               normalizeText(groupName).includes(normalizedSearch);
                      });

                      if (filteredParticipants.length === 0) {
                        return (
                          <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                            {searchTerm.trim() ? `No participants found matching "${searchTerm}"` : 'No available participants'}
                          </Typography>
                        );
                      }

                      return filteredParticipants.map((option) => {
                        const isSelected = selectedParticipants.some(p => p.id === option.id);
                        return (
                          <Box
                            key={option.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedParticipants(prev => prev.filter(p => p.id !== option.id));
                              } else {
                                setSelectedParticipants(prev => [...prev, option]);
                              }
                              setAssignmentAction('add');
                            }}
                            sx={{
                              p: 1.5,
                              cursor: 'pointer',
                              borderBottom: 1,
                              borderColor: 'divider',
                              backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                              },
                              '&:last-child': {
                                borderBottom: 'none'
                              }
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Checkbox
                                checked={isSelected}
                                size="small"
                                sx={{ p: 0 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="body2" fontWeight={500}>
                                    {option.participant?.firstName} {option.participant?.lastName}
                                  </Typography>
                                  <Chip
                                    label={option.participant?.role?.title || 'No Role'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: '20px', fontSize: '0.7rem' }}
                                  />
                                  {option.currentGroup && (
                                    <Chip
                                      label={`In ${option.currentGroup.groupName}`}
                                      size="small"
                                      variant="filled"
                                      sx={{
                                        height: '20px',
                                        fontSize: '0.7rem',
                                        backgroundColor: option.currentGroup.chipColor || '#1976d2',
                                        color: '#fff'
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      });
                    })()}
                  </Box>

                  {/* Show action selection if any participant is in another group */}
                  {selectedParticipants.some(p => p.currentGroup) && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {(() => {
                          const participantsWithGroups = selectedParticipants.filter(p => p.currentGroup);
                          const count = participantsWithGroups.length;
                          if (count === 1) {
                            return `${participantsWithGroups[0].participant?.firstName} ${participantsWithGroups[0].participant?.lastName} is currently in ${participantsWithGroups[0].currentGroup.groupName} group.`;
                          } else {
                            return `${count} selected participants are currently in other groups.`;
                          }
                        })()}
                      </Alert>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Choose an action:
                      </Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          value={assignmentAction}
                          onChange={(e) => setAssignmentAction(e.target.value)}
                        >
                          <FormControlLabel
                            value="add"
                            control={<Radio />}
                            label="Add to additional group (participants will be in both groups)"
                          />
                          <FormControlLabel
                            value="move"
                            control={<Radio />}
                            label="Move to this group (remove from current groups)"
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
            
            <Box sx={{ p: 3, pt: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button color="error" onClick={handleAddParticipantDialogClose}>
                  Cancel
                </Button>
                {availableParticipants.length > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleAssignParticipants}
                    disabled={!selectedParticipants.length || isAssigning}
                  >
                    {isAssigning 
                      ? (assignmentAction === 'move' ? 'Moving...' : 'Adding...') 
                      : selectedParticipants.length > 1
                        ? (assignmentAction === 'move' ? `Move ${selectedParticipants.length} to Group` : `Add ${selectedParticipants.length} to Group`)
                        : (assignmentAction === 'move' ? 'Move to Group' : 'Add to Group')
                    }
                  </Button>
                )}
              </Stack>
            </Box>
          </MainCard>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};

GroupDetails.propTypes = {
  Group: PropTypes.object,
  onProgressLoad: PropTypes.func,
  projectId: PropTypes.number,
};

export default GroupDetails;
