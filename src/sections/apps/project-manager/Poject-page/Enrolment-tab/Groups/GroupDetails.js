import PropTypes from "prop-types";
import { useState } from "react";
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
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentAction, setAssignmentAction] = useState('add'); // 'add' or 'move'
  
  const { singleProject, project_participants } = useSelector((state) => state.projects);

  const backColor = alpha(theme.palette.primary.lighter, 0.1);

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
    setAddParticipantDialogOpen(true);
  };

  const handleAddParticipantDialogClose = () => {
    setAddParticipantDialogOpen(false);
    setSelectedParticipant('');
    setAssignmentAction('add');
  };

  // Get all project participants with their group information
  const { groups } = useSelector((state) => state.projects);
  
  console.log('All project_participants:', project_participants);
  console.log('All groups:', groups);
  
  const availableParticipants = project_participants?.map(pp => {
    // Find which group this participant is in
    const participantGroup = groups?.find(g => 
      g.participants?.some(gp => gp.participantId === pp.id)
    );
    
    console.log(`Participant ${pp.id} (${pp.participant?.firstName}):`, {
      projectParticipantId: pp.id,
      participantId: pp.participant?.id,
      inGroup: participantGroup?.groupName
    });
    
    return {
      ...pp,
      currentGroup: participantGroup
    };
  }).filter(pp => {
    // Only show participants not in this specific group
    const isInThisGroup = Group?.participants?.some(gp => gp.participantId === pp.id);
    return !isInThisGroup;
  }) || [];

  const handleAssignParticipant = async () => {
    if (!selectedParticipant || !Group?.id) return;
    
    const selectedParticipantData = availableParticipants.find(p => p.id === parseInt(selectedParticipant));
    const currentGroup = selectedParticipantData?.currentGroup;
    
    console.log('Selected participant data:', selectedParticipantData);
    console.log('Selected participant ID:', selectedParticipant);
    console.log('Current group:', currentGroup);
    
    setIsAssigning(true);
    try {
      // If moving and participant is in another group, remove from current group first
      if (assignmentAction === 'move' && currentGroup?.id) {
        await axios.post('/api/projects/remove-participant-from-group', {
          groupId: currentGroup.id,
          participantId: parseInt(selectedParticipant)
        });
      }
      
      // Add to new group  
      const response = await axios.post('/api/projects/add-participant-to-group', {
        projectId: singleProject?.id,
        groupId: Group.id,
        participantId: parseInt(selectedParticipant)
      });
      
      if (response.data.success) {
        const actionText = assignmentAction === 'move' ? 'moved to' : 'added to';
        dispatch(openSnackbar({
          open: true,
          message: `Participant ${actionText} group successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        // Refresh both local state and global groups data
        handleRefresh();
        await dispatch(getGroupsDetails(singleProject.id));
        await dispatch(getSingleProject(singleProject.id));
        handleAddParticipantDialogClose();
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update participant group',
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
      <TableCell colSpan={8} sx={{ p: 2.5 }}>
        <Grid
          container
          spacing={2.5}
          justifyContent="center"
          sx={{ pl: { xs: 0, sm: 2, md: 2, lg: 2, xl: 2 } }}
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
                  <FormControl fullWidth>
                    <InputLabel>Select Participant</InputLabel>
                    <Select
                      value={selectedParticipant}
                      onChange={(e) => {
                        setSelectedParticipant(e.target.value);
                        setAssignmentAction('add'); // Reset to default when selection changes
                      }}
                      label="Select Participant"
                    >
                      {availableParticipants.map((pp) => (
                        <MenuItem key={pp.id} value={pp.id}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                            <Typography>
                              {pp.participant?.firstName} {pp.participant?.lastName}
                            </Typography>
                            <Chip 
                              label={pp.participant?.role?.title || 'No Role'} 
                              size="small" 
                              variant="outlined" 
                            />
                            {pp.currentGroup && (
                              <Chip 
                                label={`In ${pp.currentGroup.groupName}`}
                                size="small" 
                                variant="filled"
                                style={{ 
                                  backgroundColor: pp.currentGroup.chipColor || '#1976d2',
                                  color: '#fff'
                                }}
                              />
                            )}
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Show action selection if participant is in another group */}
                  {selectedParticipant && (() => {
                    const selectedParticipantData = availableParticipants.find(p => p.id === parseInt(selectedParticipant));
                    return selectedParticipantData?.currentGroup;
                  })() && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        This participant is currently in {(() => {
                          const selectedParticipantData = availableParticipants.find(p => p.id === parseInt(selectedParticipant));
                          return selectedParticipantData?.currentGroup?.groupName;
                        })()} group.
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
                            label="Add to additional group (participant will be in both groups)"
                          />
                          <FormControlLabel
                            value="move"
                            control={<Radio />}
                            label="Move to this group (remove from current group)"
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
                    onClick={handleAssignParticipant}
                    disabled={!selectedParticipant || isAssigning}
                  >
                    {isAssigning 
                      ? (assignmentAction === 'move' ? 'Moving...' : 'Adding...') 
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
