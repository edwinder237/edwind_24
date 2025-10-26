/**
 * Attendance Store Test Panel - Phase 1 Validation
 *
 * This component provides a comprehensive test interface for the attendance entity store.
 * It displays the current state and allows testing of all CRUD operations.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// Import attendance selectors
import {
  selectAllAttendanceRecords,
  selectEventAttendance,
  selectEventAttendanceStats,
  selectAttendanceLoading,
  selectAttendanceError
} from '../../../../../../store/entities/attendanceSlice';

// Import event and participant selectors for test data
import { selectAllEvents } from '../../../../../../store/entities/eventsSlice';
import { selectAllParticipants } from '../../../../../../store/entities/participantsSlice';

const AttendanceStoreTestPanel = () => {
  console.log('🧪 [AttendanceStoreTestPanel] Rendering test panel');

  // State selectors
  const allAttendance = useSelector(state => selectAllAttendanceRecords(state));
  const allEvents = useSelector(state => selectAllEvents(state));
  const allParticipants = useSelector(state => selectAllParticipants(state));
  const isLoading = useSelector(state => selectAttendanceLoading(state));
  const error = useSelector(state => selectAttendanceError(state));

  // Test controls
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');

  // Filtered data based on selection
  const eventAttendance = useSelector(state =>
    selectedEventId ? selectEventAttendance(state, selectedEventId) : []
  );

  // Get stats for selected event
  const eventStats = useSelector(state =>
    selectedEventId ? selectEventAttendanceStats(state, selectedEventId) : null
  );

  // Filter participant attendance manually (since we don't have a selector for it)
  const participantAttendance = selectedParticipantId
    ? allAttendance.filter(record => record.participantId === selectedParticipantId)
    : [];

  // Calculate counts from all attendance
  const presentCount = allAttendance.filter(record => record.status === 'present').length;
  const absentCount = allAttendance.filter(record => record.status === 'absent').length;
  const unmarkedCount = allAttendance.filter(record => !record.status || record.status === 'scheduled').length;

  // Calculate stats
  const stats = {
    totalRecords: allAttendance.length,
    presentCount,
    absentCount,
    unmarkedCount
  };

  console.log('🧪 [AttendanceStoreTestPanel] Store state:', {
    totalAttendance: allAttendance.length,
    stats,
    presentCount,
    absentCount,
    unmarkedCount,
    selectedEventId,
    selectedParticipantId,
    eventAttendanceCount: eventAttendance.length,
    participantAttendanceCount: participantAttendance.length
  });

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'absent':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'unmarked':
      default:
        return <QuestionCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    }
  };

  // Status chip helper
  const getStatusChip = (status) => {
    const colors = {
      present: 'success',
      absent: 'error',
      unmarked: 'warning'
    };
    return <Chip label={status} color={colors[status]} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.lighter' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">
              🧪 Attendance Entity Store - Phase 1 Test Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Testing attendance CQRS entity store with real-time state monitoring
            </Typography>
          </Box>
          <ReloadOutlined style={{ fontSize: 24, cursor: 'pointer' }} onClick={() => window.location.reload()} />
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h3">
                {allAttendance.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Attendance entries in store
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Present
                  </Typography>
                  <Typography variant="h3">
                    {presentCount}
                  </Typography>
                  <Typography variant="caption">
                    {stats.totalRecords > 0
                      ? `${((presentCount / stats.totalRecords) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.lighter' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Absent
                  </Typography>
                  <Typography variant="h3">
                    {absentCount}
                  </Typography>
                  <Typography variant="caption">
                    {stats.totalRecords > 0
                      ? `${((absentCount / stats.totalRecords) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.lighter' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <QuestionCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Unmarked
                  </Typography>
                  <Typography variant="h3">
                    {unmarkedCount}
                  </Typography>
                  <Typography variant="caption">
                    {stats.totalRecords > 0
                      ? `${((unmarkedCount / stats.totalRecords) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Attendance Records
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Event</InputLabel>
              <Select
                value={selectedEventId}
                label="Filter by Event"
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Events</em>
                </MenuItem>
                {allEvents.map(event => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.title} (ID: {event.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Participant</InputLabel>
              <Select
                value={selectedParticipantId}
                label="Filter by Participant"
                onChange={(e) => setSelectedParticipantId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Participants</em>
                </MenuItem>
                {allParticipants.map(participant => (
                  <MenuItem key={participant.id} value={participant.id}>
                    {participant.firstName} {participant.lastName} (ID: {participant.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtered Results */}
      {(selectedEventId || selectedParticipantId) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtered Results
          </Typography>

          {selectedEventId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Showing {eventAttendance.length} attendance records for Event ID: {selectedEventId}
            </Alert>
          )}

          {selectedParticipantId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Showing {participantAttendance.length} attendance records for Participant ID: {selectedParticipantId}
            </Alert>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Event ID</TableCell>
                  <TableCell>Participant ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedEventId ? eventAttendance : participantAttendance).map(record => (
                  <TableRow key={`${record.eventId}-${record.participantId}`}>
                    <TableCell>{record.eventId}</TableCell>
                    <TableCell>{record.participantId}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getStatusIcon(record.status)}
                        {getStatusChip(record.status)}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {new Date(record.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                  </TableRow>
                ))}
                {((selectedEventId ? eventAttendance : participantAttendance).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        No attendance records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* All Attendance Records */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          All Attendance Records ({allAttendance.length})
        </Typography>

        {allAttendance.length === 0 ? (
          <Alert severity="warning">
            No attendance records in the store. The attendance entity store is empty.
            This is expected if no attendance data has been loaded yet.
          </Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Composite ID</TableCell>
                  <TableCell>Event ID</TableCell>
                  <TableCell>Participant ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allAttendance.map(record => (
                  <TableRow key={`${record.eventId}-${record.participantId}`}>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {record.eventId}-{record.participantId}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.eventId}</TableCell>
                    <TableCell>{record.participantId}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getStatusIcon(record.status)}
                        {getStatusChip(record.status)}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(record.updatedAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {record.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Debug Info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          Debug: Check browser console for detailed state logs
        </Typography>
      </Paper>
    </Box>
  );
};

export default AttendanceStoreTestPanel;
