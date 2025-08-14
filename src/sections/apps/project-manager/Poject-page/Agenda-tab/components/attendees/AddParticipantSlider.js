import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Close, Settings, ViewList, SwapHoriz } from '@mui/icons-material';
import { useSelector, useDispatch } from 'store';
import { getParticipants } from 'store/reducers/projects';
import MainCard from 'components/MainCard';
import ParticipantTransferList from './ParticipantTransferList';

const AddParticipantSlider = ({ open, onClose, eventId, onAddParticipants, loading = false, sessionTitle, onRemoveParticipant, onMoveParticipant, course = null }) => {
  const dispatch = useDispatch();
  const { singleProject, project_participants } = useSelector((state) => state.projects);
  const [viewMode, setViewMode] = useState('transfer'); // 'transfer' or 'legacy'

  useEffect(() => {
    if (singleProject && open) {
      // Fetch participant details with full information
      dispatch(getParticipants(singleProject.id));
    }
  }, [singleProject, open, dispatch]);

  const handleClose = () => {
    setViewMode('transfer');
    onClose();
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          height: '80vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Settings />
              <Typography variant="h6">Manage Participants</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="transfer">
                  <SwapHoriz fontSize="small" />
                </ToggleButton>
                <ToggleButton value="legacy">
                  <ViewList fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button onClick={handleClose} startIcon={<Close />} size="small">
                Close
              </Button>
            </Stack>
          </Stack>
        }
        sx={{ 
          height: '100%',
          '& .MuiCardContent-root': {
            height: 'calc(100% - 80px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: 0
          }
        }}
      >
        {viewMode === 'transfer' ? (
          <ParticipantTransferList
            eventId={eventId}
            onAddParticipants={onAddParticipants}
            onRemoveParticipant={onRemoveParticipant}
            loading={loading}
            sessionTitle={sessionTitle}
            course={course}
          />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">Legacy view mode - Coming soon</Typography>
            <Typography variant="caption">Switch to Transfer List mode for full functionality</Typography>
          </Box>
        )}
      </MainCard>
    </Drawer>
  );
};

export default AddParticipantSlider;