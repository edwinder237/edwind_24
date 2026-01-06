import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Alert,
  Tooltip,
  Grid,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  ErrorOutline,
  School,
  Groups,
  Psychology,
  EmojiEvents,
  CalendarToday,
  Note,
  Close,
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Description,
  AutoAwesome
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import { selectAllEvents } from 'store/entities/eventsSlice';
import { selectDailyNotesByProject } from 'store/entities/dailyNotesSlice';
import {
  addKeyHighlight,
  removeKeyHighlight,
  updateKeyHighlight,
  addChallenge,
  removeChallenge,
  updateChallenge,
  fetchDailyNotes,
  summarizeWithAI
} from 'store/commands/dailyNotesCommands';
import { useGetDailyTrainingNotesQuery } from 'store/api/projectApi';
import { useDateUtils } from 'hooks/useDateUtils';

// Function to extract session notes from events and group by date
const transformEventsToMockDailyNotes = (events) => {
  if (!events || !Array.isArray(events)) return generateMockDailyNotes();

  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    if (event?.start) {
      const dateKey = new Date(event.start).toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    }
  });

  // Transform grouped events into daily notes
  const dailyNotes = Object.entries(eventsByDate)
    .map(([date, dayEvents]) => {
      // Calculate aggregate data for the day
      const totalAttendance = dayEvents.reduce((sum, e) => {
        return sum + (e.event_attendees?.filter(a => a.attendance_status === 'present')?.length || 0);
      }, 0);
      const totalParticipants = dayEvents.reduce((sum, e) => {
        return sum + (e.event_attendees?.length || 0);
      }, 0);

      // Get instructor from first event
      const firstEvent = dayEvents[0];
      const instructor = firstEvent?.event_instructors?.[0]?.instructor;
      const author = instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Sarah Martinez';
      const authorRole = instructor?.instructorType || 'Lead Instructor';

      // Collect session notes from all events of the day with time and title
      const sessionNotesArray = dayEvents
        .filter(e => e?.extendedProps?.notes)
        .map(e => {
          const eventStart = new Date(e.start);
          const timeStr = eventStart.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          return `[${timeStr}] ${e.title}:\n${e.extendedProps.notes}`;
        })
        .join('\n\n');

      // Combine all key highlights from events
      const keyHighlights = [];
      dayEvents.forEach(event => {
        if (event?.extendedProps?.keyTopicsCovered && Array.isArray(event.extendedProps.keyTopicsCovered)) {
          keyHighlights.push(...event.extendedProps.keyTopicsCovered);
        }
      });

      // Combine all challenges
      const challenges = [];
      dayEvents.forEach(event => {
        if (event?.extendedProps?.challenges && Array.isArray(event.extendedProps.challenges)) {
          challenges.push(...event.extendedProps.challenges);
        }
      });

      // Combine follow-up actions
      const nextSteps = [];
      dayEvents.forEach(event => {
        if (event?.extendedProps?.followUpActions && Array.isArray(event.extendedProps.followUpActions)) {
          nextSteps.push(...event.extendedProps.followUpActions);
        }
      });

      return {
        id: date,
        date: date,
        title: `Day Training - ${dayEvents.map(e => e.title).join(', ')}`,
        author: author,
        authorRole: authorRole,
        mood: totalAttendance / totalParticipants > 0.8 ? 'positive' : 'neutral',
        attendance: totalAttendance,
        totalParticipants: totalParticipants,
        keyHighlights: keyHighlights.length > 0 ? keyHighlights : [
          'Session conducted successfully',
          'Participants engaged with training material'
        ],
        challenges: challenges.length > 0 ? challenges : [
          'Minor technical setup delays',
          'Some participants needed additional clarification on key concepts'
        ],
        sessionNotes: sessionNotesArray || 'No session notes recorded for this day.',
        nextSteps: nextSteps.length > 0 ? nextSteps : [],
        metrics: {
          overallProgress: 0,
          participantEngagement: Math.round((totalAttendance / totalParticipants) * 100) || 0,
          contentCompletion: 0
        },
        tags: []
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

  return dailyNotes.length > 0 ? dailyNotes : generateMockDailyNotes();
};

// Mock data for daily notes (fallback)
const generateMockDailyNotes = () => [
  {
    id: 1,
    date: '2024-01-19',
    title: 'Day 5 - Strong Progress in CRM Training',
    author: 'Sarah Martinez',
    authorRole: 'Lead Instructor',
    mood: 'positive',
    attendance: 18,
    totalParticipants: 20,
    keyHighlights: [
      'Participants completed hands-on CRM data entry exercises',
      'Strong engagement during Q&A session',
      'Thomas Desgagnés showed exceptional understanding of pipeline management'
    ],
    challenges: [
      'Two participants struggling with report generation module',
      'Technical issues with demo environment for 30 minutes'
    ],
    sessionNotes: '[9:00 AM] CRM Data Entry Module: The hands-on exercises were well-received by the majority of participants. Thomas demonstrated exceptional grasp of the material and assisted peers during group work.\n\n[2:00 PM] Q&A Session: Strong engagement with excellent questions about pipeline management. The demo environment issues were resolved by switching to backup servers. Overall energy remained high despite technical setbacks.',
    nextSteps: [
      'Schedule additional support session for struggling participants',
      'Prepare advanced scenarios for quick learners'
    ],
    metrics: {
      overallProgress: 38,
      participantEngagement: 85,
      contentCompletion: 40
    },
    tags: ['milestone', 'technical-issues', 'high-engagement']
  },
  {
    id: 2,
    date: '2024-01-18',
    title: 'Day 4 - Module 2 Completed Successfully',
    author: 'Michael Chen',
    authorRole: 'Technical Trainer',
    mood: 'positive',
    attendance: 19,
    totalParticipants: 20,
    keyHighlights: [
      'Successfully completed Module 2: Customer Data Management',
      'All participants passed the module quiz with scores above 75%',
      'Group exercise on data segmentation went exceptionally well'
    ],
    challenges: [
      'One participant absent due to illness',
      'Some confusion around data privacy regulations'
    ],
    sessionNotes: '[9:00 AM] Customer Data Management: Module 2 completion marks a significant milestone. The group demonstrated solid understanding during the quiz, with most participants scoring above 85%.\n\n[1:00 PM] Data Segmentation Exercise: Strong analytical thinking demonstrated. Need to provide additional clarity on GDPR and local privacy laws in next session.',
    nextSteps: [
      'Begin Module 3: Sales Pipeline tomorrow',
      'Send recap materials to absent participant'
    ],
    metrics: {
      overallProgress: 32,
      participantEngagement: 90,
      contentCompletion: 35
    },
    tags: ['module-complete', 'assessment-passed']
  },
  {
    id: 3,
    date: '2024-01-17',
    title: 'Day 3 - Mixed Progress, Additional Support Needed',
    author: 'Sarah Martinez',
    authorRole: 'Lead Instructor',
    mood: 'neutral',
    attendance: 17,
    totalParticipants: 20,
    keyHighlights: [
      'Good understanding of basic CRM concepts',
      'Practical exercises showing improvement',
      'Peer learning sessions proving effective'
    ],
    challenges: [
      'Three participants consistently late (10+ minutes)',
      'Varying skill levels causing pacing issues',
      'Need for more individualized attention'
    ],
    sessionNotes: '[9:15 AM] Basic CRM Concepts: Started noticing clear skill level differentiation within the group. Some participants are grasping concepts quickly while others need more time.\n\n[2:30 PM] Practical Exercises: The peer learning approach is showing promise - advanced learners are naturally helping those struggling. Punctuality issues need to be addressed diplomatically in tomorrow\'s session.',
    nextSteps: [
      'Implement buddy system for peer support',
      'Consider splitting group for certain activities',
      'Address punctuality in tomorrow\'s session'
    ],
    metrics: {
      overallProgress: 25,
      participantEngagement: 70,
      contentCompletion: 28
    },
    tags: ['attendance-issue', 'support-needed', 'pacing-adjustment']
  },
  {
    id: 4,
    date: '2024-01-16',
    title: 'Day 2 - Technical Challenges Resolved',
    author: 'Michael Chen',
    authorRole: 'Technical Trainer',
    mood: 'neutral',
    attendance: 20,
    totalParticipants: 20,
    keyHighlights: [
      'Full attendance achieved',
      'Successfully resolved login issues from Day 1',
      'Completed introduction to CRM interface'
    ],
    challenges: [
      'Initial 45 minutes lost to technical setup',
      'Some participants need basic computer skills support'
    ],
    sessionNotes: '[9:45 AM] Technical Setup: Successfully overcame the technical hurdles from Day 1. Full attendance is encouraging.\n\n[11:00 AM] CRM Interface Introduction: Noticed a few participants struggling with basic navigation - will need to incorporate more foundational computer literacy support. The introduction was well-paced once we got started.',
    nextSteps: [
      'Provide additional resources for basic computer skills',
      'Ensure all technical requirements met before sessions'
    ],
    metrics: {
      overallProgress: 15,
      participantEngagement: 75,
      contentCompletion: 18
    },
    tags: ['technical-resolved', 'full-attendance']
  },
  {
    id: 5,
    date: '2024-01-15',
    title: 'Day 1 - Kickoff Session',
    author: 'Sarah Martinez',
    authorRole: 'Lead Instructor',
    mood: 'positive',
    attendance: 20,
    totalParticipants: 20,
    keyHighlights: [
      'Successful project kickoff with all participants present',
      'Strong enthusiasm and engagement from the group',
      'Clear expectations set for the training program'
    ],
    challenges: [
      'Some participants had login issues with training platform',
      'Room temperature complaints - too cold'
    ],
    sessionNotes: '[9:00 AM] Kickoff & Icebreakers: Fantastic energy in the room! Participants are clearly motivated and eager to learn. The icebreaker activities worked well to build rapport.\n\n[10:30 AM] Platform Setup: Login issues affected about 30% of participants but IT support was responsive. Room environment feedback noted for future sessions.',
    nextSteps: [
      'Resolve platform access issues before Day 2',
      'Adjust room temperature settings'
    ],
    metrics: {
      overallProgress: 5,
      participantEngagement: 95,
      contentCompletion: 8
    },
    tags: ['kickoff', 'high-enthusiasm', 'technical-issues']
  }
];

const DailyNotes = ({ project }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const dateUtils = useDateUtils();

  // Get events from normalized Redux store (CQRS architecture)
  const events = useSelector(selectAllEvents);

  // Fetch daily notes from database via RTK Query
  const { data: dailyNotesData, isLoading: isLoadingNotes } = useGetDailyTrainingNotesQuery(
    { projectId: project?.id },
    { skip: !project?.id }
  );

  // Get daily notes from Redux entity store
  const dailyNotesFromDb = useSelector((state) => selectDailyNotesByProject(state, project?.id));

  // Merge database notes with event-derived session notes
  const notes = useMemo(() => {
    // First, get all event-based notes (which contain session notes from events)
    const eventNotes = transformEventsToMockDailyNotes(events);

    // Create maps for efficient lookup
    const eventNotesMap = new Map(eventNotes.map(note => [note.date, note]));
    const dbNotesMap = new Map(
      (dailyNotesFromDb || []).map(note => {
        const dateStr = new Date(note.date).toISOString().split('T')[0];
        return [dateStr, note];
      })
    );

    // Get all unique dates from both sources
    const allDates = new Set([
      ...eventNotesMap.keys(),
      ...dbNotesMap.keys()
    ]);

    // Merge notes from both sources for each date
    const mergedNotes = Array.from(allDates).map(date => {
      const eventNote = eventNotesMap.get(date);
      const dbNote = dbNotesMap.get(date);

      return {
        id: dbNote?.id || `event-${date}`,
        date: date,
        title: `Training Notes - ${dateUtils.formatDateStandard(date)}`,
        author: dbNote?.author || eventNote?.author || 'Unknown',
        authorRole: dbNote?.authorRole || eventNote?.authorRole || 'Instructor',
        mood: eventNote?.mood || 'neutral',
        attendance: eventNote?.attendance || 0,
        totalParticipants: eventNote?.totalParticipants || 0,
        keyHighlights: dbNote?.keyHighlights || [],
        challenges: dbNote?.challenges || [],
        // Session notes always come from events (read-only, not stored in DB)
        sessionNotes: eventNote?.sessionNotes || '',
        nextSteps: eventNote?.nextSteps || [],
        metrics: eventNote?.metrics || {
          overallProgress: 0,
          participantEngagement: 0,
          contentCompletion: 0
        },
        tags: eventNote?.tags || []
      };
    });

    // Sort by date descending (most recent first)
    return mergedNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyNotesFromDb, events, dateUtils]);

  const [selectedNote, setSelectedNote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [newHighlightValue, setNewHighlightValue] = useState('');
  const [newChallengeValue, setNewChallengeValue] = useState('');
  const [editHighlightValue, setEditHighlightValue] = useState('');
  const [editChallengeValue, setEditChallengeValue] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize to today's note on first load
  useEffect(() => {
    if (notes.length > 0 && !hasInitialized) {
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = notes.findIndex(note => note.date === today);

      if (todayIndex !== -1) {
        setCurrentNoteIndex(todayIndex);
      } else {
        // If no note for today, find the closest date (most recent that's not in the future)
        const closestIndex = notes.findIndex(note => note.date <= today);
        if (closestIndex !== -1) {
          setCurrentNoteIndex(closestIndex);
        }
      }
      setHasInitialized(true);
    }
  }, [notes, hasInitialized]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousNote();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getMoodIcon = (mood) => {
    switch(mood) {
      case 'positive':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'negative':
        return <TrendingDown sx={{ color: 'error.main' }} />;
      default:
        return <Warning sx={{ color: 'warning.main' }} />;
    }
  };

  const getMoodColor = (mood) => {
    switch(mood) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Use centralized date formatting
  const formatDate = dateUtils.formatDate;

  const handleMenuClick = (event, note) => {
    setAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    const newNotes = notes.filter(n => n.id !== selectedNote.id);
    setNotes(newNotes);
    // Adjust current index if needed
    if (currentNoteIndex >= newNotes.length) {
      setCurrentNoteIndex(Math.max(0, newNotes.length - 1));
    }
    handleMenuClose();
  };

  const goToNextNote = () => {
    if (isTransitioning || notes.length <= 1) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentNoteIndex((prev) => (prev + 1) % notes.length);
      setIsTransitioning(false);
    }, 150);
  };

  const goToPreviousNote = () => {
    if (isTransitioning || notes.length <= 1) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentNoteIndex((prev) => (prev - 1 + notes.length) % notes.length);
      setIsTransitioning(false);
    }, 150);
  };

  const goToSpecificNote = (index) => {
    if (isTransitioning || index === currentNoteIndex) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentNoteIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  // Go to today's note
  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = notes.findIndex(note => note.date === today);

    if (todayIndex !== -1) {
      goToSpecificNote(todayIndex);
    } else {
      // If no note for today, find the closest date
      const closestIndex = notes.findIndex(note => note.date <= today);
      if (closestIndex !== -1) {
        goToSpecificNote(closestIndex);
      }
    }
  };

  // Format note for email
  const formatNoteForEmail = (note) => {
    const formattedDate = dateUtils.formatDateLong(note.date);

    let emailText = `${note.title}\n`;
    emailText += `${formattedDate}\n\n`;

    // Key Highlights
    emailText += `Key Highlights:\n`;
    note.keyHighlights.forEach((highlight, index) => {
      emailText += `- ${highlight}\n`;
    });
    emailText += `\n`;

    // Challenges (if any)
    if (note.challenges && note.challenges.length > 0) {
      emailText += `Challenges:\n`;
      note.challenges.forEach((challenge, index) => {
        emailText += `- ${challenge}\n`;
      });
      emailText += `\n`;
    }

    // Session Notes (if any)
    if (note.sessionNotes) {
      emailText += `Session Notes:\n`;
      emailText += `${note.sessionNotes}\n`;
    }

    return emailText;
  };

  // Copy note to clipboard
  const copyNoteToClipboard = async (note) => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      const formattedText = formatNoteForEmail(note);
      await navigator.clipboard.writeText(formattedText);

      dispatch(openSnackbar({
        open: true,
        message: 'Daily note copied to clipboard! Ready to paste in your email.',
        variant: 'alert',
        alert: {
          color: 'success',
          variant: 'filled'
        }
      }));
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);

      dispatch(openSnackbar({
        open: true,
        message: 'Failed to copy to clipboard. Please try again.',
        variant: 'alert',
        alert: {
          color: 'error',
          variant: 'filled'
        }
      }));
    } finally {
      setTimeout(() => setIsCopying(false), 1000);
    }
  };

  // Summarize session notes with AI
  const handleSummarizeWithAI = async () => {
    if (isSummarizing || !currentNote?.sessionNotes) return;

    setIsSummarizing(true);
    try {
      await dispatch(summarizeWithAI({
        projectId: project.id,
        date: currentNote.date,
        sessionNotes: currentNote.sessionNotes
      })).unwrap();
    } catch (error) {
      console.error('Failed to summarize with AI:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const currentNote = notes[currentNoteIndex];

  // Check if current note is today
  const isCurrentNoteToday = useMemo(() => {
    if (!currentNote) return false;
    const today = new Date().toISOString().split('T')[0];
    return currentNote.date === today;
  }, [currentNote]);

  // Get the actual database note for the current date to ensure we have latest data
  const currentDbNote = useMemo(() => {
    if (!currentNote || !dailyNotesFromDb) return null;
    return dailyNotesFromDb.find(note => {
      const noteDate = new Date(note.date).toISOString().split('T')[0];
      return noteDate === currentNote.date;
    });
  }, [currentNote, dailyNotesFromDb]);

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Note sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Daily Training Notes</Typography>
          <Chip 
            label={`${notes.length} entries`} 
            size="small" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Copy current note to clipboard for email">
            <Button 
              startIcon={<ContentCopy />} 
              variant="outlined" 
              size="small"
              onClick={() => copyNoteToClipboard(currentNote)}
              disabled={!currentNote || isCopying}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main'
                }
              }}
            >
              {isCopying ? 'Copying...' : 'Copy'}
            </Button>
          </Tooltip>
          <Button 
            startIcon={<Add />} 
            variant="contained" 
            size="small"
            onClick={() => setNewNoteDialogOpen(true)}
          >
            Add Note
          </Button>
        </Stack>
      </Stack>

      {/* Carousel Navigation */}
      {notes.length > 0 && (
        <Box sx={{ position: 'relative' }}>
          {/* Navigation Controls */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <IconButton 
              onClick={goToPreviousNote}
              disabled={notes.length <= 1 || isTransitioning}
              sx={{ 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  transform: 'scale(1.05)'
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  borderColor: 'divider'
                }
              }}
            >
              <ChevronLeft />
            </IconButton>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Go to today's note">
                <Button
                  size="small"
                  variant={isCurrentNoteToday ? 'contained' : 'outlined'}
                  onClick={goToToday}
                  disabled={isTransitioning}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 1,
                    textTransform: 'none'
                  }}
                >
                  Today
                </Button>
              </Tooltip>
              <Tooltip title="Use ← → arrow keys to navigate" placement="top">
                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                  {currentNoteIndex + 1} of {notes.length}
                </Typography>
              </Tooltip>
              {/* Progress dots */}
              <Stack direction="row" spacing={0.5}>
                {notes.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => goToSpecificNote(index)}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: index === currentNoteIndex ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      transform: index === currentNoteIndex ? 'scale(1.2)' : 'scale(1)',
                      '&:hover': {
                        bgcolor: index === currentNoteIndex ? 'primary.dark' : 'action.hover',
                        transform: 'scale(1.3)'
                      }
                    }}
                  />
                ))}
              </Stack>
            </Stack>

            <IconButton 
              onClick={goToNextNote}
              disabled={notes.length <= 1 || isTransitioning}
              sx={{ 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  transform: 'scale(1.05)'
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  borderColor: 'divider'
                }
              }}
            >
              <ChevronRight />
            </IconButton>
          </Stack>

          {/* Current Note Display */}
          {currentNote && (
            <Collapse in={!isTransitioning} timeout={300}>
              <Card 
                sx={{ 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 0,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)',
                  opacity: isTransitioning ? 0.7 : 1,
                  boxShadow: isTransitioning ? 'none' : '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Chip 
                          label={formatDate(currentNote.date)}
                          size="small" 
                          color="primary"
                          icon={<CalendarToday />}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          by {currentNote.author} • {currentNote.authorRole} • 
                          <Groups sx={{ fontSize: 14, ml: 0.5 }} /> 
                          Attendance: {currentNote.attendance}/{currentNote.totalParticipants}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {currentNote.title}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, currentNote)}>
                      <MoreVert />
                    </IconButton>
                  </Stack>

                  {/* Key Highlights */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                        Key Highlights
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingHighlight('new');
                          setNewHighlightValue('');
                        }}
                      >
                        <Add sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 3 }}>
                      {currentNote.keyHighlights.map((highlight, index) => (
                        <Box key={index}>
                          {editingHighlight === index ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">•</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                autoFocus
                                value={editHighlightValue}
                                onChange={(e) => setEditHighlightValue(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && editHighlightValue.trim()) {
                                    try {
                                      await dispatch(updateKeyHighlight({
                                        projectId: project.id,
                                        date: currentNote.date,
                                        index,
                                        newText: editHighlightValue.trim()
                                      })).unwrap();
                                      setEditingHighlight(null);
                                      setEditHighlightValue('');
                                    } catch (error) {
                                      console.error('Failed to update key highlight:', error);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingHighlight(null);
                                    setEditHighlightValue('');
                                  }
                                }}
                                placeholder="Edit highlight..."
                                sx={{ flex: 1 }}
                              />
                              <Tooltip title="Save">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={!editHighlightValue.trim()}
                                    onClick={async () => {
                                      if (editHighlightValue.trim()) {
                                        try {
                                          await dispatch(updateKeyHighlight({
                                            projectId: project.id,
                                            date: currentNote.date,
                                            index,
                                            newText: editHighlightValue.trim()
                                          })).unwrap();
                                          setEditingHighlight(null);
                                          setEditHighlightValue('');
                                        } catch (error) {
                                          console.error('Failed to update key highlight:', error);
                                        }
                                      }
                                    }}
                                  >
                                    <CheckCircle sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingHighlight(null);
                                    setEditHighlightValue('');
                                  }}
                                >
                                  <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover .action-btns': { opacity: 1 } }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                • {highlight}
                              </Typography>
                              <Box className="action-btns" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingHighlight(index);
                                      setEditHighlightValue(highlight);
                                    }}
                                  >
                                    <Edit sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await dispatch(removeKeyHighlight({
                                          projectId: project.id,
                                          date: currentNote.date,
                                          index
                                        })).unwrap();
                                      } catch (error) {
                                        console.error('Failed to remove key highlight:', error);
                                      }
                                    }}
                                  >
                                    <Close sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))}
                      {editingHighlight === 'new' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            autoFocus
                            value={newHighlightValue}
                            onChange={(e) => setNewHighlightValue(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newHighlightValue.trim()) {
                                try {
                                  await dispatch(addKeyHighlight({
                                    projectId: project.id,
                                    date: currentNote.date,
                                    highlight: newHighlightValue.trim()
                                  })).unwrap();
                                  setEditingHighlight(null);
                                  setNewHighlightValue('');
                                } catch (error) {
                                  console.error('Failed to add key highlight:', error);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingHighlight(null);
                                setNewHighlightValue('');
                              }
                            }}
                            placeholder="Type new highlight..."
                            sx={{ flex: 1 }}
                          />
                          <Tooltip title="Save">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={!newHighlightValue.trim()}
                                onClick={async () => {
                                  if (newHighlightValue.trim()) {
                                    try {
                                      await dispatch(addKeyHighlight({
                                        projectId: project.id,
                                        date: currentNote.date,
                                        highlight: newHighlightValue.trim()
                                      })).unwrap();
                                      setEditingHighlight(null);
                                      setNewHighlightValue('');
                                    } catch (error) {
                                      console.error('Failed to add key highlight:', error);
                                    }
                                  }
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setEditingHighlight(null);
                                setNewHighlightValue('');
                              }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  {/* Challenges */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ErrorOutline sx={{ fontSize: 18, color: 'warning.main' }} />
                        Challenges
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingChallenge('new');
                          setNewChallengeValue('');
                        }}
                      >
                        <Add sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 3 }}>
                      {currentNote.challenges.map((challenge, index) => (
                        <Box key={index}>
                          {editingChallenge === index ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">•</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                autoFocus
                                value={editChallengeValue}
                                onChange={(e) => setEditChallengeValue(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && editChallengeValue.trim()) {
                                    try {
                                      await dispatch(updateChallenge({
                                        projectId: project.id,
                                        date: currentNote.date,
                                        index,
                                        newText: editChallengeValue.trim()
                                      })).unwrap();
                                      setEditingChallenge(null);
                                      setEditChallengeValue('');
                                    } catch (error) {
                                      console.error('Failed to update challenge:', error);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingChallenge(null);
                                    setEditChallengeValue('');
                                  }
                                }}
                                placeholder="Edit challenge..."
                                sx={{ flex: 1 }}
                              />
                              <Tooltip title="Save">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={!editChallengeValue.trim()}
                                    onClick={async () => {
                                      if (editChallengeValue.trim()) {
                                        try {
                                          await dispatch(updateChallenge({
                                            projectId: project.id,
                                            date: currentNote.date,
                                            index,
                                            newText: editChallengeValue.trim()
                                          })).unwrap();
                                          setEditingChallenge(null);
                                          setEditChallengeValue('');
                                        } catch (error) {
                                          console.error('Failed to update challenge:', error);
                                        }
                                      }
                                    }}
                                  >
                                    <CheckCircle sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingChallenge(null);
                                    setEditChallengeValue('');
                                  }}
                                >
                                  <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover .action-btns': { opacity: 1 } }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                • {challenge}
                              </Typography>
                              <Box className="action-btns" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingChallenge(index);
                                      setEditChallengeValue(challenge);
                                    }}
                                  >
                                    <Edit sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await dispatch(removeChallenge({
                                          projectId: project.id,
                                          date: currentNote.date,
                                          index
                                        })).unwrap();
                                      } catch (error) {
                                        console.error('Failed to remove challenge:', error);
                                      }
                                    }}
                                  >
                                    <Close sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))}
                      {editingChallenge === 'new' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            autoFocus
                            value={newChallengeValue}
                            onChange={(e) => setNewChallengeValue(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newChallengeValue.trim()) {
                                try {
                                  await dispatch(addChallenge({
                                    projectId: project.id,
                                    date: currentNote.date,
                                    challenge: newChallengeValue.trim()
                                  })).unwrap();
                                  setEditingChallenge(null);
                                  setNewChallengeValue('');
                                } catch (error) {
                                  console.error('Failed to add challenge:', error);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingChallenge(null);
                                setNewChallengeValue('');
                              }
                            }}
                            placeholder="Type new challenge..."
                            sx={{ flex: 1 }}
                          />
                          <Tooltip title="Save">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={!newChallengeValue.trim()}
                                onClick={async () => {
                                  if (newChallengeValue.trim()) {
                                    try {
                                      await dispatch(addChallenge({
                                        projectId: project.id,
                                        date: currentNote.date,
                                        challenge: newChallengeValue.trim()
                                      })).unwrap();
                                      setEditingChallenge(null);
                                      setNewChallengeValue('');
                                    } catch (error) {
                                      console.error('Failed to add challenge:', error);
                                    }
                                  }
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setEditingChallenge(null);
                                setNewChallengeValue('');
                              }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  {/* Session Notes */}
                  <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.95rem'
                          }}
                        >
                          <Description sx={{ fontSize: 20, color: 'info.main' }} />
                          Session Notes
                        </Typography>
                        <Tooltip title="Use AI to automatically generate Key Highlights and Challenges from Session Notes">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={isSummarizing ? <CircularProgress size={16} /> : <AutoAwesome />}
                              onClick={handleSummarizeWithAI}
                              disabled={isSummarizing || !currentNote?.sessionNotes || currentNote.sessionNotes.trim().length < 10}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.dark',
                                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                                },
                                '&.Mui-disabled': {
                                  borderColor: 'action.disabled',
                                  color: 'action.disabled'
                                }
                              }}
                            >
                              {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                      <Box
                        sx={{
                          px: 2.5,
                          py: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.08),
                          borderRadius: 1.5,
                          borderLeft: '4px solid',
                          borderColor: 'info.main',
                          boxShadow: `0 2px 4px ${alpha(theme.palette.info.main, 0.1)}`
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            whiteSpace: 'pre-line',
                            lineHeight: 1.8,
                            color: 'text.primary',
                            fontWeight: 400,
                            '& strong': {
                              fontWeight: 600
                            }
                          }}
                        >
                          {currentNote.sessionNotes ? currentNote.sessionNotes.split('\n\n').map((paragraph, idx) => {
                            // Parse each paragraph to separate time/title from note content
                            const timeMatch = paragraph.match(/^\[([^\]]+)\]\s+([^:]+):\s*(.+)$/s);

                            if (timeMatch) {
                              const [, time, title, noteContent] = timeMatch;
                              return (
                                <Box key={idx} sx={{ mb: idx < currentNote.sessionNotes.split('\n\n').length - 1 ? 1.5 : 0 }}>
                                  <Typography
                                    variant="body1"
                                    component="div"
                                    sx={{
                                      lineHeight: 1.6
                                    }}
                                  >
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: 'text.secondary',
                                        fontWeight: 400,
                                        fontSize: '0.75rem',
                                        mr: 1
                                      }}
                                    >
                                      [{time}] {title}:
                                    </Typography>
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: 'text.primary',
                                        fontWeight: 500,
                                        fontSize: '1.05rem'
                                      }}
                                    >
                                      {noteContent}
                                    </Typography>
                                  </Typography>
                                </Box>
                              );
                            }

                            // Fallback for non-matching format
                            return (
                              <Typography key={idx} sx={{ mb: idx < currentNote.sessionNotes.split('\n\n').length - 1 ? 1.5 : 0 }}>
                                {paragraph}
                              </Typography>
                            );
                          }) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontStyle: 'italic' }}
                            >
                              No session notes recorded for this day.
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                </CardContent>
              </Card>
            </Collapse>
          )}
        </Box>
      )}


      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { copyNoteToClipboard(selectedNote); handleMenuClose(); }}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          Copy to Clipboard
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Daily Note</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            Edit functionality would be implemented here with form fields for updating the note.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={newNoteDialogOpen} onClose={() => setNewNoteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Daily Training Note</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            Form for adding new daily notes would be implemented here.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewNoteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setNewNoteDialogOpen(false)}>Add Note</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DailyNotes;