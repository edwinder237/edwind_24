import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";

// material-ui
import {
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Stack,
  Typography,
  Chip,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Badge,
  IconButton,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import AddParticipantSlider from "./AddParticipantSlider";
import { useSelector, useDispatch } from "store";
import { getSingleProject, getEvents } from "store/reducers/projects";

// assets
import { SettingOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

// assets
const Avatar1 = "/assets/images/users/avatar-1.png";

// ===========================||  ||=========================== //

const Attendees = React.memo(({ eventParticipants, eventCourse, groupName, selectedEvent, onAddParticipants, onRemoveParticipant, onMoveParticipant, course = null }) => {
  const { singleProject } = useSelector((state) => state.projects);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenSlider = () => {
    setSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setSliderOpen(false);
  };

  // Memoize unique participants calculation
  const uniqueParticipants = useMemo(() => {
    return eventParticipants.filter((participant, index, self) => {
      // For participants, use participant ID or email as unique identifier
      const identifier = participant.participant?.id || participant.participant?.email || participant.id || participant.email;
      return index === self.findIndex(p => {
        const pIdentifier = p.participant?.id || p.participant?.email || p.id || p.email;
        return pIdentifier === identifier;
      });
    });
  }, [eventParticipants]);

  // Memoize attendance statistics calculation
  const attendanceStats = useMemo(() => {
    return {
      scheduled: uniqueParticipants.filter(p => p?.attendance_status === 'scheduled').length,
      present: uniqueParticipants.filter(p => p?.attendance_status === 'present').length,
      absent: uniqueParticipants.filter(p => p?.attendance_status === 'absent').length,
      late: uniqueParticipants.filter(p => p?.attendance_status === 'late').length,
      total: uniqueParticipants.length
    };
  }, [uniqueParticipants]);

  // Memoize capacity calculations
  const capacityInfo = useMemo(() => {
    const maxParticipants = course?.maxParticipants;
    const hasMaxLimit = maxParticipants && maxParticipants > 0;
    const isAtMaxCapacity = hasMaxLimit && attendanceStats.total >= maxParticipants;
    const missingCount = attendanceStats.scheduled - attendanceStats.present;
    
    return { maxParticipants, hasMaxLimit, isAtMaxCapacity, missingCount };
  }, [course?.maxParticipants, attendanceStats.total, attendanceStats.scheduled, attendanceStats.present]);

  const handleAddParticipants = useCallback(async (participants, groups) => {
    setLoading(true);
    try {
      await onAddParticipants(participants, groups);
    } finally {
      setLoading(false);
    }
  }, [onAddParticipants]);

  const handleRemoveParticipant = useCallback(async (participant) => {
    setLoading(true);
    try {
      await onRemoveParticipant(participant);
    } finally {
      setLoading(false);
    }
  }, [onRemoveParticipant]);

  const handleMoveParticipant = useCallback(async (participant, targetEventId) => {
    setLoading(true);
    try {
      await onMoveParticipant(participant, targetEventId);
    } finally {
      setLoading(false);
    }
  }, [onMoveParticipant]);

  // Memoize participant details calculation
  const eventParticipantsDetails = useMemo(() => {
    return uniqueParticipants.map((participant) => {
      const foundPerson = singleProject.participants.find(
        (project_participant) =>
          project_participant.id === participant?.project_paticipantId
      );
      return foundPerson
        ? { ...participant, participant: foundPerson.participant }
        : null;
    });
  }, [uniqueParticipants, singleProject.participants]);

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">Participants</Typography>
          <Chip 
            label={capacityInfo.hasMaxLimit ? `${attendanceStats.total}/${capacityInfo.maxParticipants}` : `${attendanceStats.total} Total`} 
            size="small" 
            color={capacityInfo.isAtMaxCapacity ? "error" : "primary"} 
            variant="outlined"
          />
          {capacityInfo.isAtMaxCapacity && (
            <Chip 
              label="FULL" 
              size="small" 
              color="error" 
              variant="filled"
            />
          )}
        </Stack>
      }
      subheader={eventCourse}
      secondary={
        <Tooltip title="Manage Participants">
          <Button 
            size="small" 
            onClick={handleOpenSlider}
            startIcon={<SettingOutlined />}
            variant="outlined"
          >
            Manage
          </Button>
        </Tooltip>
      }
      sx={{ 
        "& .MuiCardHeader-root": { pb: 1 },
        height: 'fit-content',
        maxHeight: 400,
        "& .MuiCardContent-root": {
          overflowY: 'auto',
          maxHeight: 300
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        {uniqueParticipants.length > 0 ? (
          <Stack spacing={1} direction="row" justifyContent="space-around" sx={{ flexWrap: 'wrap' }}>
            {/* Scheduled Count */}
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="h5" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                {attendanceStats.scheduled}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Scheduled
              </Typography>
            </Box>

            {/* Present Count */}
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {attendanceStats.present}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Present
              </Typography>
            </Box>

            {/* Late Count */}
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="h5" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                {attendanceStats.late}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Late
              </Typography>
            </Box>

            {/* Absent Count */}
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="h5" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                {attendanceStats.absent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Absent
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No participants assigned to this event
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Manage Participants Slider */}
      <AddParticipantSlider
        open={sliderOpen}
        onClose={handleCloseSlider}
        eventId={selectedEvent?.id}
        onAddParticipants={handleAddParticipants}
        loading={loading}
        sessionTitle={selectedEvent?.title || eventCourse}
        onRemoveParticipant={handleRemoveParticipant}
        onMoveParticipant={handleMoveParticipant}
        course={course}
      />
    </MainCard>
  );
});

export default Attendees;
