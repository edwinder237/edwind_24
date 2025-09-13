import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Groups,
  CalendarToday,
  EventNote,
  CheckCircle
} from '@mui/icons-material';

// Function to transform events data into session notes format
const transformEventsToSessionNotes = (events) => {
  if (!events || !Array.isArray(events)) return [];
  
  // Filter events that have session notes in extendedProps
  return events
    .filter(event => event?.extendedProps?.notes)
    .map(event => {
      const sessionNotes = event.extendedProps?.notes || '';
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Calculate attendance from event_attendees
      const attendanceCount = event.event_attendees?.filter(a => a.attendance_status === 'present')?.length || 0;
      const totalParticipants = event.event_attendees?.length || 0;
      
      // Get instructor info from event_instructors or extendedProps
      const instructor = event.event_instructors?.[0]?.instructor?.name || 
                        event.extendedProps?.instructor || 
                        'Not assigned';
      
      // Parse priority for styling
      const priority = event.extendedProps?.priority || 'Normal';
      
      return {
        id: event.id,
        date: startDate.toISOString().split('T')[0],
        eventTitle: event.title,
        eventType: event.eventType || 'course',
        time: `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        location: event.extendedProps?.location || 'Conference Room',
        instructor: instructor,
        instructorRole: event.extendedProps?.instructorRole || 'Instructor',
        attendanceCount: attendanceCount,
        totalParticipants: totalParticipants,
        sessionNotes: sessionNotes,
        keyTopicsCovered: event.extendedProps?.keyTopicsCovered || [],
        participantFeedback: event.extendedProps?.participantFeedback || '',
        followUpActions: event.extendedProps?.followUpActions || [],
        tags: event.extendedProps?.tags || [],
        courseTitle: event.course?.title || '',
        groupNames: event.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean) || [],
        priority: priority
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
};

const SessionNotes = ({ project }) => {
  // Transform project events into session notes format
  const notes = useMemo(() => {
    return transformEventsToSessionNotes(project?.events);
  }, [project?.events]);

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


  // Group notes by date
  const notesByDate = useMemo(() => {
    const grouped = {};
    notes.forEach(note => {
      const dateKey = formatDate(note.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(note);
    });
    return grouped;
  }, [notes]);

  // If no events have session notes, show a message
  if (notes.length === 0) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <EventNote sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Session Notes from Events</Typography>
          <Chip 
            label="No sessions" 
            size="small" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Stack>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No session notes available. Notes will appear here when added to events.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <EventNote sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">Session Notes from Events</Typography>
        <Chip 
          label={`${notes.length} sessions`} 
          size="small" 
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Stack>

      {/* Display notes grouped by date */}
      <Stack spacing={3}>
        {Object.entries(notesByDate).map(([dateLabel, dateNotes]) => (
          <Box key={dateLabel}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Chip 
                label={dateLabel}
                size="small" 
                color="primary"
                icon={<CalendarToday />}
              />
              <Typography variant="caption" color="text.secondary">
                {dateNotes.length} session{dateNotes.length > 1 ? 's' : ''}
              </Typography>
            </Stack>
            
            <Stack spacing={2}>
              {dateNotes.map((note) => (
                <Card 
                  key={note.id}
                  sx={{ 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0
                  }}
                >
                  <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {note.eventTitle}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {note.time} • {note.instructor} • 
                      {note.groupNames.length > 0 && ` ${note.groupNames.join(', ')} • `}
                      <Groups sx={{ fontSize: 12, verticalAlign: 'middle', ml: 0.5, mr: 0.5 }} />
                      {note.attendanceCount}/{note.totalParticipants}
                    </Typography>
                    
                    {note.sessionNotes && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                          Session Notes
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3, fontStyle: 'italic' }}>
                          "{note.sessionNotes}"
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default SessionNotes;