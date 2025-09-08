import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'store';
import axios from 'utils/axios';
import { openSnackbar } from 'store/reducers/snackbar';
import { getGroupsDetails, getSingleProject } from 'store/reducers/projects';

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
  Autocomplete,
  TextField,
  Checkbox,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

//components
import ScrollX from "components/ScrollX";

// project import
import MainCard from "components/MainCard";
import GroupEnrolledTable from "./GroupEnrolledTable";
import CurriculmWidget from "../CurriculmWidget";
import GroupCurriculumWidget from "./GroupCurriculumWidget";
import CurriculumManageDialog from "./CurriculumManageDialog";

import GroupCurriculumTable from "./GroupCurriculumTable";

// assets
import { PlusCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import IconButton from "components/@extended/IconButton";

// ==============================|| EXPANDING TABLE - USER DETAILS ||============================== //

const GroupDetails = ({ Group }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentAction, setAssignmentAction] = useState('add'); // 'add' or 'move'
  
  const { singleProject, project_participants } = useSelector((state) => state.projects);

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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAddParticipant = () => {
    setSelectedParticipants([]); // Clear any previous selections
    setAssignmentAction('add'); // Reset action
    setAddParticipantDialogOpen(true);
  };

  const handleAddParticipantDialogClose = () => {
    setAddParticipantDialogOpen(false);
    setSelectedParticipants([]);
    setAssignmentAction('add');
  };

  // Get all project participants with their group information
  const { groups } = useSelector((state) => state.projects);
  
  const availableParticipants = project_participants?.map(pp => {
    // Find which group this participant is in
    const participantGroup = groups?.find(g => 
      g.participants?.some(gp => gp.participantId === pp.id)
    );
    
    return {
      ...pp,
      currentGroup: participantGroup
    };
  }).filter(pp => {
    // Only show participants not in this specific group
    const isInThisGroup = Group?.participants?.some(gp => {
      // Check both participantId and participant.id for safety
      return gp.participantId === pp.id || gp.participantId === pp.participant?.id;
    });
    
    return !isInThisGroup;
  }).reduce((unique, participant) => {
    // Remove duplicates based on participant ID
    if (!unique.some(p => p.id === participant.id)) {
      unique.push(participant);
    }
    return unique;
  }, []) || [];

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
      
      // Process each selected participant
      for (const participant of selectedParticipants) {
        try {
          const currentGroup = participant.currentGroup;
          
          // If moving and participant is in another group, remove from current group first
          if (assignmentAction === 'move' && currentGroup?.id) {
            await axios.post('/api/projects/remove-participant-from-group', {
              groupId: currentGroup.id,
              participantId: parseInt(participant.id)
            });
          }
          
          // Add to new group  
          const response = await axios.post('/api/projects/add-participant-to-group', {
            projectId: singleProject?.id,
            groupId: Group.id,
            participantId: parseInt(participant.id)
          });
          
          if (response.data.success) {
            successCount++;
          } else {
            errors.push(`${participant.participant?.firstName} ${participant.participant?.lastName}: ${response.data.error || 'Failed to assign'}`);
          }
        } catch (error) {
          errors.push(`${participant.participant?.firstName} ${participant.participant?.lastName}: ${error.response?.data?.error || error.message}`);
        }
      }
      
      // Show results
      if (successCount > 0) {
        const actionText = assignmentAction === 'move' ? 'moved to' : 'added to';
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} participant${successCount > 1 ? 's' : ''} ${actionText} group successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        // Refresh data
        handleRefresh();
        await dispatch(getGroupsDetails(singleProject.id));
        await dispatch(getSingleProject(singleProject.id));
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
                <Tooltip title="Add Participants to Group">
                  <IconButton onClick={handleAddParticipant}>
                    <UserAddOutlined />
                  </IconButton>
                </Tooltip>
              }
              sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
            >
              <ScrollX>
                {true && <GroupEnrolledTable Enrolled={participants} onRefresh={handleRefresh} currentGroup={Group} />}
              </ScrollX>
            </MainCard>
          </Grid>
        </Grid>

        {/* Curriculum Management Dialog */}
        <CurriculumManageDialog
          open={curriculumDialogOpen}
          onClose={handleCurriculumDialogClose}
          group={Group}
          onRefresh={handleRefresh}
        />

        {/* Add Participant Dialog */}
        <Dialog open={addParticipantDialogOpen} onClose={handleAddParticipantDialogClose} maxWidth="sm" fullWidth>
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
            sx={{ m: 0 }}
          >
            <Box sx={{ p: 3 }}>
              {availableParticipants.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  All project participants are already assigned to this group
                </Typography>
              ) : (
                <Stack spacing={3}>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={availableParticipants}
                    value={selectedParticipants}
                    onChange={(event, newValue) => {
                      // Ensure no duplicates in the selected values
                      const uniqueValues = newValue.reduce((unique, participant) => {
                        if (!unique.some(p => p.id === participant.id)) {
                          unique.push(participant);
                        }
                        return unique;
                      }, []);
                      
                      setSelectedParticipants(uniqueValues);
                      setAssignmentAction('add'); // Reset to default when selection changes
                    }}
                    disableCloseOnSelect
                    getOptionLabel={(option) => 
                      `${option.participant?.firstName} ${option.participant?.lastName}`.trim()
                    }
                    filterOptions={(options, { inputValue }) => {
                      const normalizedInput = normalizeText(inputValue);
                      return options.filter((option) => {
                        const fullName = `${option.participant?.firstName} ${option.participant?.lastName}`;
                        const roleName = option.participant?.role?.title || '';
                        const groupName = option.currentGroup?.groupName || '';
                        
                        return normalizeText(fullName).includes(normalizedInput) ||
                               normalizeText(roleName).includes(normalizedInput) ||
                               normalizeText(groupName).includes(normalizedInput);
                      });
                    }}
                    renderOption={(props, option, { selected }) => (
                      <Box component="li" {...props}>
                        <Checkbox
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                          <Typography>
                            {option.participant?.firstName} {option.participant?.lastName}
                          </Typography>
                          <Chip 
                            label={option.participant?.role?.title || 'No Role'} 
                            size="small" 
                            variant="outlined" 
                          />
                          {option.currentGroup && (
                            <Chip 
                              label={`In ${option.currentGroup.groupName}`}
                              size="small" 
                              variant="filled"
                              style={{ 
                                backgroundColor: option.currentGroup.chipColor || '#1976d2',
                                color: '#fff'
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and Select Participants"
                        placeholder="Type to search by name, role, or current group..."
                      />
                    )}
                    noOptionsText="No participants found"
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionKey={(option) => option.id}
                  />

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
            
            <Box sx={{ p: 3, pt: 0 }}>
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
  data: PropTypes.object,
};

export default GroupDetails;
