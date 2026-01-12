import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, Box, Typography, IconButton, Stack, Avatar, Divider, Chip,
  Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Paper, Grid, Tab, Tabs, Alert, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Tooltip,
  Menu, MenuItem
} from '@mui/material';
import {
  Close, Email, Phone, School, CheckCircle, RadioButtonUnchecked,
  AccessTime, CalendarMonth, Grade, EmojiEvents, Quiz, Event, SwapHoriz,
  Schedule, Group as GroupIcon, PlaylistAddCheck, Edit, Delete, Person,
  Notes as NotesIcon, Send, ExpandMore
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import {
  useUpdateParticipantChecklistProgressMutation,
  useGetProjectAgendaQuery,
  useGetParticipantAssessmentsQuery,
  useRecordAssessmentScoreMutation,
  useToggleAssessmentForProjectMutation,
  projectApi
} from 'store/api/projectApi';
import { recordAssessmentScore } from 'store/commands/assessmentCommands';
import { participantUpdated } from 'store/entities/participantsSlice';
import AttendanceHistory from './AttendanceHistory';
import AttendanceSummary from './AttendanceSummary';
import { PARTICIPANT_STATUS_CONFIG } from 'constants/index';
// getProjectChecklist removed - RTK Query handles cache updates via invalidation

const ParticipantDrawer = ({ open, onClose, participant, projectId }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [courseChecklists, setCourseChecklists] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Learning activities state
  const [learningActivities, setLearningActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Note state
  const [note, setNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Send invite state - tracks which event is currently sending
  const [sendingInviteEventId, setSendingInviteEventId] = useState(null);

  // Assessment score recording state
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    scoreEarned: '',
    feedback: '',
    assessmentDate: new Date().toISOString().split('T')[0]
  });

  // Participant status state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(participant?.participantStatus || null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const dispatch = useDispatch();

  // CQRS: RTK Query for participant assessments
  // Note: Using projectParticipantId (numeric ID from project_participants table)
  // not the UUID from participants table
  const {
    data: assessmentData,
    isLoading: assessmentsLoading,
    refetch: refetchAssessments
  } = useGetParticipantAssessmentsQuery(
    { participantId: participant?.projectParticipantId, currentOnly: false },
    {
      skip: !participant?.projectParticipantId || !open,
      refetchOnMountOrArgChange: true
    }
  );

  // RTK Query mutation for toggling assessment status
  const [toggleAssessmentForProject, { isLoading: isTogglingAssessment }] = useToggleAssessmentForProjectMutation();

  // Transform assessment data to match expected format
  const assessments = useMemo(() => {
    if (!assessmentData?.groupedByAssessment) {
      return [];
    }

    return assessmentData.groupedByAssessment.map(group => {
      const current = group.currentScore || group.statistics?.latestAttempt;
      const assessment = group.assessment;

      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.title.includes('Quiz') ? 'Quiz' :
              assessment.title.includes('Practical') ? 'Practical' :
              assessment.title.includes('Exam') ? 'Exam' : 'Assessment',
        score: current ? current.scoreEarned : 0,
        maxScore: assessment.maxScore || 100,
        status: current
          ? (current.passed ? 'Passed' : 'Failed')
          : (group.statistics.totalAttempts > 0 ? 'Pending' : 'Not Started'),
        date: current ? new Date(current.assessmentDate).toISOString().split('T')[0] : null,
        attempts: group.statistics.totalAttempts || 0,
        // Additional data for score recording
        assessment: assessment,
        allAttempts: group.attempts || [],
        statistics: group.statistics
      };
    });
  }, [assessmentData]);

  // CQRS: RTK Query for project agenda data
  const {
    data: agendaData,
    isLoading: isAgendaLoading,
  } = useGetProjectAgendaQuery(projectId, {
    skip: !projectId || !open, // Skip if no projectId or drawer is closed
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  // Create project structure for backward compatibility
  const singleProject = agendaData ? {
    ...agendaData.projectInfo,
    events: agendaData.events || [],
    groups: agendaData.groups || [],
    id: projectId
  } : { events: [], groups: [], id: projectId };

  // CQRS: RTK Query mutation for updating participant checklist
  const [updateParticipantProgress] = useUpdateParticipantChecklistProgressMutation();

  const fetchChecklistItems = async (participantId) => {
    if (!participantId) return;
    
    setChecklistLoading(true);
    try {
      const response = await fetch(`/api/participants/checklist-items?participantId=${participantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourseChecklists(data);
      } else {
        console.error('Failed to fetch checklist items');
        setCourseChecklists([]);
      }
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      setCourseChecklists([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const fetchLearningActivities = async (participantId, projectId) => {
    if (!participantId || !projectId) return;
    
    setActivitiesLoading(true);
    try {
      const response = await fetch(`/api/participants/learning-activities?participantId=${participantId}&projectId=${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLearningActivities(data.activities || []);
      } else {
        console.error('Failed to fetch learning activities');
        setLearningActivities([]);
      }
    } catch (error) {
      console.error('Error fetching learning activities:', error);
      setLearningActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const toggleItemCompletion = async (itemId, currentStatus) => {
    if (updatingItems.has(itemId)) return;

    setUpdatingItems(prev => new Set([...prev, itemId]));

    try {
      // CQRS: Use RTK Query mutation instead of direct fetch
      // This ensures RTK Query cache is invalidated and dashboard updates
      const result = await updateParticipantProgress({
        participantId: participant.id,
        checklistItemId: itemId,
        completed: !currentStatus,
        projectId: singleProject?.id // Required for tag invalidation
      }).unwrap();

      if (result.success) {
        // Update local state optimistically
        setCourseChecklists(prevChecklists =>
          prevChecklists.map(checklist => ({
            ...checklist,
            items: checklist.items.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    completed: !currentStatus,
                    completedAt: !currentStatus ? new Date().toISOString() : null
                  }
                : item
            )
          }))
        );

        // RTK Query will automatically invalidate Checklist tag and update dashboard
        // No manual refresh needed

        dispatch(openSnackbar({
          open: true,
          message: `Item ${!currentStatus ? 'completed' : 'uncompleted'} successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Error updating completion status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle opening the score recording dialog
  const handleOpenScoreDialog = (assessment) => {
    setSelectedAssessment(assessment);
    setScoreForm({
      scoreEarned: '',
      feedback: '',
      assessmentDate: new Date().toISOString().split('T')[0]
    });
    setScoreDialogOpen(true);
  };

  // Handle closing the score recording dialog
  const handleCloseScoreDialog = () => {
    setScoreDialogOpen(false);
    setSelectedAssessment(null);
    setScoreForm({
      scoreEarned: '',
      feedback: '',
      assessmentDate: new Date().toISOString().split('T')[0]
    });
  };

  // Handle score form submission
  const handleSubmitScore = async () => {
    if (!selectedAssessment || !participant?.projectParticipantId) return;

    // Validation
    const scoreEarned = parseFloat(scoreForm.scoreEarned);
    if (isNaN(scoreEarned) || scoreEarned < 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a valid score',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    if (scoreEarned > selectedAssessment.maxScore) {
      dispatch(openSnackbar({
        open: true,
        message: `Score cannot exceed maximum score of ${selectedAssessment.maxScore}`,
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    try {
      // CQRS: Use the command to record assessment score
      // Note: Using projectParticipantId (numeric ID from project_participants table)
      await dispatch(recordAssessmentScore({
        assessmentId: selectedAssessment.assessment.id,
        participantId: participant.projectParticipantId,
        scoreData: {
          courseAssessmentId: selectedAssessment.assessment.id, // API expects courseAssessmentId
          participantId: participant.projectParticipantId,
          scoreEarned: scoreEarned,
          scoreMaximum: selectedAssessment.maxScore,
          feedback: scoreForm.feedback || '',
          assessmentDate: scoreForm.assessmentDate,
          instructorId: null // TODO: Get from auth context if needed
        }
      })).unwrap();

      // Close dialog and refetch assessments
      handleCloseScoreDialog();
      refetchAssessments();

    } catch (error) {
      // Error handling is done in the command
      console.error('Failed to record score:', error);
    }
  };

  // Handle toggling assessment enable/disable for project
  const handleToggleAssessment = async (assessmentId, currentStatus) => {
    if (!projectId) {
      dispatch(openSnackbar({
        open: true,
        message: 'Project ID is required to toggle assessment',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    try {
      const result = await toggleAssessmentForProject({
        projectId: projectId,
        courseAssessmentId: assessmentId,
        isActive: !currentStatus, // Toggle the status
        createdBy: 'system' // TODO: Get from auth context
      }).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: result.message || `Assessment ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
        variant: 'alert',
        alert: { color: 'success' }
      }));

      // Refetch assessments to show updated list
      refetchAssessments();

    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error?.data?.message || 'Failed to toggle assessment status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      console.error('Failed to toggle assessment:', error);
    }
  };

  useEffect(() => {
    if (participant?.id && activeTab === 3) {
      fetchChecklistItems(participant.id);
    }
  }, [participant?.id, activeTab]);

  // Fetch learning activities when drawer opens and learning progress tab is active
  useEffect(() => {
    if (participant?.id && singleProject?.id && activeTab === 0 && open) {
      fetchLearningActivities(participant.id, singleProject.id);
    }
  }, [participant?.id, singleProject?.id, activeTab, open]);

  useEffect(() => {
    if (!open) {
      setCourseChecklists([]);
      setUpdatingItems(new Set());
      setLearningActivities([]);
      setActivitiesLoading(false);
      setActiveTab(0);
      setNote('');
      setStatusMenuAnchor(null);
    }
  }, [open]);

  // Fetch participant status from API when drawer opens (bypasses stale cache)
  useEffect(() => {
    const fetchStatus = async () => {
      if (!open || !participant?.id) return;

      try {
        // Fetch fresh participant data to get current status
        const response = await fetch(`/api/participants/get-status?participantId=${participant.id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentStatus(data.participantStatus || null);
        } else {
          // Fallback to prop if API fails
          setCurrentStatus(participant.participantStatus || null);
        }
      } catch (error) {
        console.error('Error fetching participant status:', error);
        setCurrentStatus(participant.participantStatus || null);
      }
    };

    fetchStatus();
  }, [open, participant?.id]);

  // Fetch note directly from API when drawer opens (bypasses stale cache)
  useEffect(() => {
    const fetchNote = async () => {
      if (!open || !participant?.projectParticipantId) return;

      try {
        const response = await fetch(`/api/participants/get-note?projectParticipantId=${participant.projectParticipantId}`);
        if (response.ok) {
          const data = await response.json();
          setNote(data.note || '');
        } else {
          // Fallback to prop if API fails
          setNote(participant.note || '');
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        setNote(participant.note || '');
      }
    };

    fetchNote();
  }, [open, participant?.projectParticipantId]);

  const participantEvents = useMemo(() => {
    if (!singleProject?.events || !participant) return [];
    
    return singleProject.events.filter(event => {
      const isDirectAttendee = event.event_attendees?.some(attendee => 
        attendee.enrollee?.participant?.id === participant.id
      );
      
      const isInGroupAttendee = event.event_groups?.some(eventGroup => {
        const group = singleProject.groups?.find(g => g.id === eventGroup.groupId);
        return group?.participants?.some(gp => 
          gp.participant?.participant?.id === participant.id
        );
      });
      
      return isDirectAttendee || isInGroupAttendee;
    }).map(event => {
      const attendeeRecord = event.event_attendees?.find(attendee => 
        attendee.enrollee?.participant?.id === participant.id
      );
      
      const assignedGroup = event.event_groups?.find(eventGroup => {
        const group = singleProject.groups?.find(g => g.id === eventGroup.groupId);
        return group?.participants?.some(gp => 
          gp.participant?.participant?.id === participant.id
        );
      });
      
      return {
        ...event,
        attendanceStatus: attendeeRecord?.attendance_status || 'scheduled',
        assignmentType: attendeeRecord ? 'direct' : 'group',
        assignedGroupName: assignedGroup ? singleProject.groups?.find(g => g.id === assignedGroup.groupId)?.groupName : null
      };
    });
  }, [singleProject?.events, singleProject?.groups, participant]);

  const availableEvents = useMemo(() => {
    if (!singleProject?.events) return [];
    return singleProject.events.filter(event => 
      !participantEvents.some(pe => pe.id === event.id)
    );
  }, [singleProject?.events, participantEvents]);

  // Calculate progress based on module-level completion (more granular than course completion)
  const { completedModulesTotal, totalModulesTotal, completedCourses, totalCourses } = useMemo(() => {
    let completedModules = 0;
    let totalModules = 0;
    let completed = 0;

    learningActivities.forEach(activity => {
      if (activity.totalModules && activity.totalModules > 0) {
        // Use module-level progress if available
        completedModules += activity.completedModules || 0;
        totalModules += activity.totalModules;
      } else if (activity.totalModules === 0) {
        // Course has no modules with activities - counts as 1 complete unit if marked complete
        totalModules += 1;
        if (activity.completed) {
          completedModules += 1;
        }
      } else {
        // Fallback: count course as 1 module
        totalModules += 1;
        if (activity.completed) {
          completedModules += 1;
        }
      }
      if (activity.completed) {
        completed += 1;
      }
    });

    return {
      completedModulesTotal: completedModules,
      totalModulesTotal: totalModules,
      completedCourses: completed,
      totalCourses: learningActivities.length
    };
  }, [learningActivities]);

  const progressPercentage = totalModulesTotal > 0 ? (completedModulesTotal / totalModulesTotal) * 100 : 0;

  const averageScore = learningActivities
    .filter(a => a.score !== null)
    .reduce((acc, curr, _, arr) => acc + curr.score / arr.length, 0) || 0;

  // Calculate attendance statistics from participantEvents
  const attendanceStats = useMemo(() => {
    if (!participantEvents || participantEvents.length === 0) {
      return { present: 0, late: 0, absent: 0, total: 0 };
    }

    return {
      present: participantEvents.filter(e => e.attendanceStatus === 'present').length,
      late: participantEvents.filter(e => e.attendanceStatus === 'late').length,
      absent: participantEvents.filter(e => e.attendanceStatus === 'absent').length,
      total: participantEvents.length
    };
  }, [participantEvents]);

  const attendanceRate = attendanceStats.total > 0
    ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100
    : 0;

  // Create attendance history from participantEvents (sorted by date, most recent first)
  const attendanceHistory = useMemo(() => {
    if (!participantEvents || participantEvents.length === 0) return [];

    return participantEvents
      .filter(event => event.start) // Only events with dates
      .sort((a, b) => new Date(b.start) - new Date(a.start)) // Most recent first
      .map(event => ({
        date: new Date(event.start).toISOString().split('T')[0],
        status: event.attendanceStatus || 'scheduled',
        checkIn: event.checkInTime || null,
        checkOut: event.checkOutTime || null,
        eventTitle: event.title,
        eventId: event.id
      }));
  }, [participantEvents]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue !== 3) {
      setCourseChecklists([]);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'scheduled': return 'info';
      default: return 'info';
    }
  };

  // Send individual calendar invite for a specific event
  const handleSendEventInvite = async (event) => {
    if (!participant?.email || !participant?.firstName || !participant?.lastName) {
      dispatch(openSnackbar({
        open: true,
        message: 'Participant email or name is missing',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    setSendingInviteEventId(event.id);

    try {
      const response = await fetch('/api/projects/send-single-calendar-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          eventId: event.id,
          participantEmail: participant.email,
          participantFirstName: participant.firstName,
          participantLastName: participant.lastName,
          projectTitle: singleProject?.title || 'Training Project',
          includeMeetingLink: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        dispatch(openSnackbar({
          open: true,
          message: `Calendar invite sent to ${participant.email}`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: result.message || 'Failed to send invite',
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      console.error('Error sending event invite:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to send calendar invite',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSendingInviteEventId(null);
    }
  };

  // Save participant note
  const handleSaveNote = async () => {
    if (!participant?.projectParticipantId) return;

    setNoteSaving(true);
    try {
      const response = await fetch('/api/participants/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectParticipantId: participant.projectParticipantId,
          note: note
        })
      });

      if (response.ok) {
        // Update RTK Query cache directly AND invalidate to force refetch
        // This ensures both immediate update and fresh data on next load
        dispatch(
          projectApi.util.updateQueryData('getProjectParticipants', parseInt(projectId), (draft) => {
            const participantToUpdate = draft.find(p => p.id === participant.projectParticipantId);
            if (participantToUpdate) {
              participantToUpdate.note = note;
            }
          })
        );

        // Also update the normalized entities store directly
        dispatch(participantUpdated({
          id: participant.projectParticipantId,
          changes: { note: note }
        }));

        // Force cache invalidation to ensure fresh data includes note on next fetch
        dispatch(projectApi.util.invalidateTags([
          { type: 'ProjectParticipants', id: parseInt(projectId) }
        ]));

        dispatch(openSnackbar({
          open: true,
          message: 'Note saved successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        throw new Error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to save note',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setNoteSaving(false);
    }
  };

  // Handle participant status change (updates participants table, not project_participants)
  const handleStatusChange = async (newStatus) => {
    if (!participant?.id) return;

    setStatusUpdating(true);
    setStatusMenuAnchor(null);

    try {
      const response = await fetch('/api/participants/updateParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id, // UUID from participants table
          updates: {
            participantStatus: newStatus
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentStatus(newStatus);

        // Update RTK Query cache to reflect the new status
        dispatch(
          projectApi.util.updateQueryData('getProjectParticipants', parseInt(projectId), (draft) => {
            const participantToUpdate = draft.find(p => p.participant?.id === participant.id);
            if (participantToUpdate && participantToUpdate.participant) {
              participantToUpdate.participant.participantStatus = newStatus;
            }
          })
        );

        // Also update the normalized entities store
        dispatch(participantUpdated({
          id: participant.projectParticipantId,
          changes: {
            participant: {
              ...participant,
              participantStatus: newStatus
            }
          }
        }));

        const statusLabel = PARTICIPANT_STATUS_CONFIG.find(s => s.value === newStatus)?.label || newStatus;
        dispatch(openSnackbar({
          open: true,
          message: `Participant status updated to ${statusLabel}`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating participant status:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update participant status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          '& *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '& *::-webkit-scrollbar-track': {
            bgcolor: '#1a1a1a',
          },
          '& *::-webkit-scrollbar-thumb': {
            bgcolor: '#3a3a3a',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: '#4a4a4a',
            },
          },
        }
      }}
    >
      {!participant ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          bgcolor: '#121212'
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={60} />
            <Typography variant="body1" color="text.secondary">
              Loading participant details...
            </Typography>
          </Stack>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 3,
              position: 'relative'
            }}
          >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            bgcolor: alpha('#fff', 0.1),
            '&:hover': { bgcolor: alpha('#fff', 0.2) }
          }}
        >
          <Close />
        </IconButton>

        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              bgcolor: 'white',
              color: theme.palette.primary.main,
              border: '3px solid white',
              boxShadow: theme.shadows[3]
            }}
          >
            {participant.firstName?.[0]}{participant.lastName?.[0]}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {participant.firstName} {participant.lastName}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<School />}
                label={participant.role?.title || participant.role || 'Participant'}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              {participant.email && (
                <Chip
                  icon={<Email />}
                  label={participant.email}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
              {participant.phone && (
                <Chip
                  icon={<Phone />}
                  label={participant.phone}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
              {/* Participant Status Chip with dropdown */}
              {(() => {
                const statusConfig = PARTICIPANT_STATUS_CONFIG.find(s => s.value === currentStatus);
                const statusColor = statusConfig?.color || 'default';
                const chipBgColor = statusColor === 'success' ? '#4caf50' :
                                    statusColor === 'warning' ? '#ff9800' :
                                    statusColor === 'error' ? '#f44336' :
                                    statusColor === 'info' ? '#2196f3' : '#9e9e9e';
                return (
                  <Chip
                    label={statusUpdating ? 'Updating...' : (statusConfig?.label || 'None')}
                    deleteIcon={<ExpandMore sx={{ color: 'white !important' }} />}
                    onDelete={(e) => setStatusMenuAnchor(e.currentTarget)}
                    onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
                    disabled={statusUpdating}
                    sx={{
                      bgcolor: alpha(chipBgColor, 0.3),
                      color: 'white',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(chipBgColor, 0.4)
                      }
                    }}
                  />
                );
              })()}
              <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={() => setStatusMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                {PARTICIPANT_STATUS_CONFIG.map((option) => (
                  <MenuItem
                    key={option.value ?? 'none'}
                    onClick={() => handleStatusChange(option.value)}
                    selected={currentStatus === option.value}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: option.color === 'success' ? 'success.main' :
                                   option.color === 'warning' ? 'warning.main' :
                                   option.color === 'error' ? 'error.main' :
                                   option.color === 'info' ? 'info.main' : 'grey.500'
                        }}
                      />
                      <Typography variant="body2">{option.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#1a1a1a' }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Learning Progress" icon={<School />} iconPosition="start" />
          <Tab label="Assessments" icon={<Quiz />} iconPosition="start" />
          <Tab label="Attendance" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="Course Checklists" icon={<PlaylistAddCheck />} iconPosition="start" />
          <Tab label="Note" icon={<NotesIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: 3,
        bgcolor: '#121212',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: '#1a1a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: '#3a3a3a',
          borderRadius: '4px',
          '&:hover': {
            bgcolor: '#4a4a4a',
          },
        },
      }}>
        {activeTab === 0 && (
          <Card sx={{ bgcolor: '#1e1e1e' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6">Learning Progress & Schedule</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${completedCourses}/${totalCourses} completed`} size="small" color="primary" />
                  <Chip label={`${participantEvents.length} events`} size="small" variant="outlined" />
                </Stack>
              </Stack>

              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progressPercentage.toFixed(1)}%
                  </Typography>
                </Stack>
                <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                  <Box
                    sx={{
                      width: `${progressPercentage}%`,
                      bgcolor: 'primary.main',
                      height: '100%',
                      borderRadius: 1
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Assigned Courses
                  </Typography>
                  {activitiesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                      <Stack alignItems="center" spacing={2}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                          Loading learning activities...
                        </Typography>
                      </Stack>
                    </Box>
                  ) : learningActivities.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                      <School sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No learning activities found
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {learningActivities.map((activity) => (
                        <Box
                          key={activity.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: activity.completed ? alpha(theme.palette.success.main, 0.05) : 'background.default',
                            border: `1px solid ${activity.completed ? theme.palette.success.light : theme.palette.divider}`,
                            '&:hover': {
                              bgcolor: activity.completed ? alpha(theme.palette.success.main, 0.1) : 'action.hover'
                            }
                          }}
                        >
                          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                            {activity.completed ? (
                              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                            ) : (
                              <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: 20 }} />
                            )}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: activity.completed ? 400 : 500,
                                color: activity.completed ? 'text.secondary' : 'text.primary',
                                mb: 0.5
                              }}
                            >
                              {activity.title}
                            </Typography>

                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {activity.duration}
                                </Typography>
                              </Stack>

                              {/* Show module progress for incomplete courses */}
                              {!activity.completed && activity.totalModules > 0 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: activity.completedModules > 0 ? 'warning.main' : 'text.secondary',
                                    fontWeight: activity.completedModules > 0 ? 600 : 400
                                  }}
                                >
                                  {activity.completedModules || 0}/{activity.totalModules} modules
                                </Typography>
                              )}

                              {activity.completed && activity.score !== null && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Grade sx={{ fontSize: 12, color: 'warning.main' }} />
                                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                    {activity.score}%
                                  </Typography>
                                </Stack>
                              )}

                              {activity.date && (
                                <Typography variant="caption" color="text.secondary">
                                  {activity.date}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </List>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Assigned Events
                  </Typography>
                  {participantEvents.length > 0 ? (
                    <Stack spacing={1.5}>
                      {participantEvents.slice(0, 4).map((event) => (
                        <Box
                          key={event.id}
                          sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Event sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2" fontWeight={500}>
                                  {event.title}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={event.attendanceStatus}
                                  color={
                                    event.attendanceStatus === 'present' ? 'success' :
                                    event.attendanceStatus === 'late' ? 'warning' :
                                    event.attendanceStatus === 'absent' ? 'error' : 'info'
                                  }
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Stack>
                              
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(event.start).toLocaleDateString()} • {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Typography>
                                </Stack>
                                
                                {event.assignedGroupName && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <GroupIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {event.assignedGroupName}
                                    </Typography>
                                  </Stack>
                                )}
                                
                                <Chip
                                  size="small"
                                  label={event.assignmentType === 'direct' ? 'Direct' : 'Group'}
                                  variant="outlined"
                                  sx={{ height: 16, fontSize: '0.65rem' }}
                                />
                              </Stack>
                            </Box>
                            
                            <Tooltip title="Send calendar invite">
                              <IconButton
                                size="small"
                                onClick={() => handleSendEventInvite(event)}
                                disabled={sendingInviteEventId === event.id || !participant?.email}
                                sx={{ ml: 1 }}
                              >
                                {sendingInviteEventId === event.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Send sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move to another event">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  console.log('Available events to move to:', availableEvents);
                                }}
                                disabled={availableEvents.length === 0}
                              >
                                <SwapHoriz sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Event sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No events assigned
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: '#1e1e1e', borderRadius: 0 }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#2a2a2a' }}>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>Assessment</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>Date</TableCell>
                  <TableCell align="center" sx={{ color: 'text.primary', fontWeight: 600 }}>Attempts</TableCell>
                  <TableCell align="center" sx={{ color: 'text.primary', fontWeight: 600 }}>Score</TableCell>
                  <TableCell align="center" sx={{ color: 'text.primary', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading assessments...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : assessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Grade sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No assessments found for this participant
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assessments.map((assessment) => {
                    const isDisabled = !assessment.assessment.isActive;
                    return (
                  <TableRow
                    key={assessment.id}
                    sx={{
                      '&:hover': { bgcolor: '#2a2a2a' },
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      opacity: isDisabled ? 0.5 : 1,
                      bgcolor: isDisabled ? alpha(theme.palette.error.main, 0.05) : 'transparent'
                    }}
                  >
                    <TableCell sx={{
                      color: isDisabled ? 'text.disabled' : 'text.primary',
                      textDecoration: isDisabled ? 'line-through' : 'none'
                    }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">{assessment.title}</Typography>
                        {isDisabled && (
                          <Chip
                            label="Disabled"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={assessment.type}
                        color={isDisabled ? 'default' : 'primary'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isDisabled ? 'Disabled' : assessment.status}
                        color={
                          isDisabled ? 'error' :
                          assessment.status === 'Passed' ? 'success' :
                          assessment.status === 'Pending' ? 'warning' : 'default'
                        }
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {assessment.date || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'text.secondary' }}>
                      {assessment.attempts > 0 ? assessment.attempts : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDisabled ? 'text.disabled' :
                            assessment.score >= 80 ? 'success.main' :
                            assessment.score >= 60 ? 'warning.main' : 'text.primary'
                        }}
                      >
                        {assessment.score}/{assessment.maxScore}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Grade />}
                          onClick={() => handleOpenScoreDialog(assessment)}
                          disabled={!assessment.assessment.isActive}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            textTransform: 'none'
                          }}
                        >
                          {assessment.attempts > 0 ? 'Record Retake' : 'Record Score'}
                        </Button>
                        <Tooltip title={assessment.assessment.isActive ? 'Disable assessment for this project' : 'Enable assessment for this project'}>
                          <Switch
                            checked={assessment.assessment.isActive}
                            onChange={() => handleToggleAssessment(assessment.assessment.id, assessment.assessment.isActive)}
                            disabled={isTogglingAssessment}
                            size="small"
                            color="primary"
                          />
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  );
                })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Stack spacing={3}>
            {/* Attendance Summary */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Attendance Summary
              </Typography>
              <AttendanceSummary attendanceStats={attendanceStats} />
            </Box>

            {/* Attendance History */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Attendance History
              </Typography>
              <AttendanceHistory
                attendanceHistory={attendanceHistory}
                getStatusColor={getStatusColor}
              />
            </Box>
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={3}>
            {checklistLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Stack alignItems="center" spacing={2}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading checklist items...
                  </Typography>
                </Stack>
              </Box>
            ) : courseChecklists.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PlaylistAddCheck sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Participant Checklists
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This participant doesn't have any participant-only checklist items from their enrolled courses.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {courseChecklists.map((checklist) => (
                  <Card key={checklist.courseId} sx={{ bgcolor: '#1e1e1e', border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ pb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlaylistAddCheck sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {checklist.courseTitle}
                          </Typography>
                          <Chip
                            label={`${checklist.items.filter(item => item.completed).length}/${checklist.items.length} items`}
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Stack>
                      </Stack>

                      <Stack spacing={1}>
                        {checklist.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: item.completed ? alpha(theme.palette.success.main, 0.08) : '#3a3a3a',
                              border: 1,
                              borderColor: item.completed ? alpha(theme.palette.success.main, 0.4) : '#4a4a4a',
                              '&:hover': {
                                bgcolor: item.completed ? alpha(theme.palette.success.main, 0.12) : '#444444'
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                              <IconButton
                                size="small"
                                onClick={() => toggleItemCompletion(item.id, item.completed)}
                                disabled={updatingItems.has(item.id)}
                                sx={{
                                  color: item.completed ? 'success.main' : 'grey.400',
                                  '&:hover': {
                                    bgcolor: item.completed ? 'success.lighter' : 'action.hover'
                                  }
                                }}
                              >
                                {updatingItems.has(item.id) ? (
                                  <CircularProgress size={18} />
                                ) : item.completed ? (
                                  <CheckCircle sx={{ fontSize: 18 }} />
                                ) : (
                                  <RadioButtonUnchecked sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>

                              <Box flex={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: item.completed ? 400 : 500,
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                      color: item.completed ? 'text.secondary' : 'text.primary'
                                    }}
                                  >
                                    {item.title}
                                  </Typography>
                                  {item.participantOnly && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 1,
                                        bgcolor: 'info.lighter',
                                        border: '1px solid',
                                        borderColor: 'info.light'
                                      }}
                                    >
                                      <Person sx={{ fontSize: 12, color: 'info.main' }} />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: '0.6rem',
                                          color: 'info.main',
                                          fontWeight: 600,
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.5
                                        }}
                                      >
                                        Participant Only
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={item.category}
                                    size="small"
                                    color="default"
                                    sx={{ height: 16, fontSize: '0.65rem' }}
                                  />
                                  {item.priority && (
                                    <Chip
                                      label={item.priority}
                                      size="small"
                                      color={
                                        item.priority === 'high' ? 'error' :
                                        item.priority === 'medium' ? 'warning' : 'success'
                                      }
                                      sx={{ height: 16, fontSize: '0.65rem' }}
                                    />
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(item.createdAt).toLocaleDateString()}
                                  </Typography>
                                  {item.completed && item.completedAt && (
                                    <Typography variant="caption" color="success.main">
                                      Completed: {new Date(item.completedAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {activeTab === 4 && (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={10}
              placeholder="Add notes about this participant..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              inputProps={{ maxLength: 2000 }}
              helperText={`${note.length}/2000 characters`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e1e1e'
                }
              }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={noteSaving}
                startIcon={noteSaving ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {noteSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </Box>
          </Box>
        )}

      </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: '#1a1a1a' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {/* Score Recording Dialog */}
      <Dialog
        open={scoreDialogOpen}
        onClose={handleCloseScoreDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Record Assessment Score
            </Typography>
            <IconButton size="small" onClick={handleCloseScoreDialog}>
              <Close />
            </IconButton>
          </Stack>
          {selectedAssessment && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedAssessment.title} - {participant?.firstName} {participant?.lastName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            {/* Score Input */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Score *
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  type="number"
                  placeholder="Enter score earned"
                  value={scoreForm.scoreEarned}
                  onChange={(e) => setScoreForm({ ...scoreForm, scoreEarned: e.target.value })}
                  inputProps={{
                    min: 0,
                    max: selectedAssessment?.maxScore || 100,
                    step: 0.1
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#2a2a2a'
                    }
                  }}
                />
                <Typography variant="body1" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                  / {selectedAssessment?.maxScore || 100}
                </Typography>
              </Stack>
              {scoreForm.scoreEarned && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Percentage: {((parseFloat(scoreForm.scoreEarned) / (selectedAssessment?.maxScore || 100)) * 100).toFixed(1)}%
                </Typography>
              )}
            </Box>

            {/* Date Input */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Assessment Date *
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={scoreForm.assessmentDate}
                onChange={(e) => setScoreForm({ ...scoreForm, assessmentDate: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a2a2a'
                  }
                }}
              />
            </Box>

            {/* Feedback Input */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Feedback (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter instructor feedback..."
                value={scoreForm.feedback}
                onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a2a2a'
                  }
                }}
              />
            </Box>

            {/* Assessment Info */}
            {selectedAssessment && (
              <Alert severity="info" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>Current Attempts:</strong> {selectedAssessment.attempts}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>Passing Score:</strong> {selectedAssessment.assessment?.passingScore || 70}%
                </Typography>
                {selectedAssessment.assessment?.allowRetakes && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Max Retakes:</strong> {selectedAssessment.assessment?.maxRetakes || 'Unlimited'}
                  </Typography>
                )}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseScoreDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitScore}
            disabled={!scoreForm.scoreEarned || !scoreForm.assessmentDate}
            startIcon={<Grade />}
          >
            Record Score
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ParticipantDrawer;