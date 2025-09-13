import React, { useState } from 'react';
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
  Grid
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
  Close
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

// Mock data for daily notes
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
  const [notes, setNotes] = useState(generateMockDailyNotes());
  const [selectedNote, setSelectedNote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

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
    setNotes(notes.filter(n => n.id !== selectedNote.id));
    handleMenuClose();
  };

  const latestNote = notes[0];

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
        <Button 
          startIcon={<Add />} 
          variant="contained" 
          size="small"
          onClick={() => setNewNoteDialogOpen(true)}
        >
          Add Note
        </Button>
      </Stack>

      {/* Latest Note Highlight */}
      {latestNote && (
        <Card 
          sx={{ 
            mb: 3, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
              <Box flex={1}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Chip 
                    label={formatDate(latestNote.date)}
                    size="small" 
                    color="primary"
                    icon={<CalendarToday />}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    by {latestNote.author} • {latestNote.authorRole} • 
                    <Groups sx={{ fontSize: 14, ml: 0.5 }} /> 
                    Attendance: {latestNote.attendance}/{latestNote.totalParticipants}
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {latestNote.title}
                </Typography>
              </Box>
              <IconButton size="small" onClick={(e) => handleMenuClick(e, latestNote)}>
                <MoreVert />
              </IconButton>
            </Stack>

            {/* Key Highlights */}
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                Key Highlights
              </Typography>
              <Stack spacing={0.5} sx={{ pl: 3 }}>
                {latestNote.keyHighlights.map((highlight, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    • {highlight}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* Challenges */}
            {latestNote.challenges.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorOutline sx={{ fontSize: 18, color: 'warning.main' }} />
                  Challenges
                </Typography>
                <Stack spacing={0.5} sx={{ pl: 3 }}>
                  {latestNote.challenges.map((challenge, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      • {challenge}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Notes List */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Previous Notes
        </Typography>
        <Stack spacing={1}>
          {notes.slice(1, 4).map((note) => (
            <Box 
              key={note.id}
              sx={{ 
                p: 2, 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  {getMoodIcon(note.mood)}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {note.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(note.date)} • {note.author} • Attendance: {note.attendance}/{note.totalParticipants}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip 
                    label={`${note.metrics.overallProgress}% progress`}
                    size="small"
                    variant="outlined"
                  />
                  <IconButton size="small" onClick={(e) => handleMenuClick(e, note)}>
                    <MoreVert />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
        
        {notes.length > 4 && (
          <Button 
            fullWidth 
            sx={{ mt: 2 }}
            variant="outlined"
          >
            View All {notes.length} Notes
          </Button>
        )}
      </Box>


      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
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