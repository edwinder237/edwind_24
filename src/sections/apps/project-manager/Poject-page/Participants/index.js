import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import MainCard from 'components/MainCard';
import { CloseOutlined } from '@ant-design/icons';

// Lazy load the Participants table for better performance
const ParticipantTable = dynamic(() => import('./components/ParticipantsTable').catch(
  (err) => console.error(err)
));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>Loading...</Typography>
  </Box>
);

// ==============================|| PARTICIPANTS DRAWER ||============================== //

/**
 * ParticipantsDrawer Component (Presentational)
 *
 * Bottom drawer for managing project participants.
 * Participants are already fetched by parent component (projects/[id].js) via useGetProjectParticipantsQuery
 * and normalized to entities store. This component only renders the UI.
 *
 * @param {boolean} open - Whether the drawer is open
 * @param {function} onClose - Callback when drawer should close
 * @param {string} initialAction - Optional action to trigger when drawer opens ('addManually', 'importCSV')
 */
const ParticipantsDrawer = ({ open, onClose, initialAction = null }) => {
  // No data fetching needed - participants already in normalized entities store
  // Fetched by projects/[id].js using useGetProjectParticipantsQuery

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '80vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <MainCard
        title={
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Typography variant="h5" fontWeight="600">
              Manage Participants
            </Typography>
            <IconButton onClick={onClose} size="large">
              <CloseOutlined />
            </IconButton>
          </Stack>
        }
        content={false}
        border={false}
        boxShadow={false}
        sx={{
          flex: 1,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          '& .MuiCardHeader-root': {
            pb: 2,
            flexShrink: 0
          },
          '& .MuiCardContent-root': {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <Suspense fallback={<LoadingFallback />}>
              <ParticipantTable index={0} initialAction={initialAction} />
            </Suspense>
          </Box>
        </Box>
      </MainCard>
    </Drawer>
  );
};

ParticipantsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // initialAction is optional and has a default value, so we don't validate its type
};

export default ParticipantsDrawer;
