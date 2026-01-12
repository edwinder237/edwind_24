import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'store';
import { Box, Button, Typography, Dialog, Alert } from '@mui/material';
import { useGetProjectParticipantsQuery, useGetAvailableRolesQuery } from 'store/api/projectApi';

// Project imports
import MainCard from 'components/MainCard';
import Loader from 'components/Loader';
import { PopupTransition } from 'components/@extended/Transitions';

// CQRS architecture with commands and events
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { selectAllGroups } from 'store/entities/groupsSlice';
import { participantCommands } from 'store/commands';
import { useSendParticipantCredentials } from './hooks/useSendParticipantCredentials';

// Components
import ReactTable from './components/ReactTable';
import EmailAccessDialog from 'components/EmailAccessDialog';
import ParticipantDetailsDrawer from '../../../Participant-Dialog/ParticipantDetailsDrawer';
import AddParticipantOptionsDialog from './AddParticipantOptionsDialog';

// Domain events integration
import eventBus from 'store/events/EventBus';

/**
 * ParticipantsTable using CQRS Architecture (Presentational Component)
 *
 * Simple and clean implementation:
 * - Reads from normalized entities store (hydrated by ParticipantsDrawer via RTK Query)
 * - Commands for mutations
 * - Domain events automatically handled by RTK Query integration
 */
const ParticipantsTable = React.memo(({ index, initialAction = null }) => {
  const dispatch = useDispatch();

  // Get projectId from projectSettings store (proper CQRS pattern)
  const projectId = useSelector(state => state.projectSettings?.projectId);

  // Use RTK Query to get loading/error states for participants
  const {
    isLoading: loadingParticipants,
    isFetching: refreshingParticipants,
    error: participantsError
  } = useGetProjectParticipantsQuery(projectId, {
    skip: !projectId
  });

  // Fetch available roles for bulk assignment
  const {
    data: availableRoles = [],
    isLoading: rolesLoading
  } = useGetAvailableRolesQuery(projectId, {
    skip: !projectId
  });

  // Read participants from normalized entities store (CQRS Read Model)
  // Data is already fetched and normalized by projects/[id].js via useGetProjectParticipantsQuery
  const participants = useSelector(selectAllParticipants);

  // Read groups from normalized entities store (CQRS Read Model)
  // Data is already fetched and normalized by projects/[id].js via useGetProjectAgendaQuery
  const groups = useSelector(selectAllGroups);

  // Derive loading/error states
  const loading = loadingParticipants;
  const refreshing = refreshingParticipants;
  const error = participantsError;

  // Stable refresh function placeholder
  const refreshData = useCallback(() => {
    // Refresh is triggered by parent component
    console.log('[ParticipantsTable] Refresh requested');
  }, []);

  // Table UI state management (inlined from useTableState hook)
  const [emailAccessDialog, setEmailAccessDialog] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editableRowIndex, setEditableRowIndex] = useState(null);

  // Dialog handlers
  const handleAdd = useCallback(() => {
    // Show the unified options dialog
    setShowOptionsDialog(true);
  }, []);

  const handleOptionsDialogClose = useCallback(() => {
    setShowOptionsDialog(false);
  }, []);

  const handleEmailAccessDialog = useCallback(() => {
    setEmailAccessDialog(prev => !prev);
  }, []);

  // Selection handlers - prevent unnecessary updates
  const handleSelectionChange = useCallback(({ selectedParticipants: newParticipants, selectedIds: newIds }) => {
    setSelectedParticipants(prev => {
      // Only update if actually different
      if (prev.length !== newParticipants.length ||
          prev.some((p, i) => p?.id !== newParticipants[i]?.id)) {
        return newParticipants;
      }
      return prev;
    });

    setSelectedIds(prev => {
      // Only update if actually different
      if (prev.length !== newIds.length ||
          prev.some((id, i) => id !== newIds[i])) {
        return newIds;
      }
      return prev;
    });
  }, []);

  // Email sending hook for participant credentials
  const { handleSendEmail } = useSendParticipantCredentials();

  // Participant drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Domain events subscription for real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to participant-related events

    // Subscribe to events
    const unsubscribe1 = eventBus.subscribe('participant.add.completed' );
    const unsubscribe2 = eventBus.subscribe('participant.update.completed');
    const unsubscribe3 = eventBus.subscribe('participant.remove.completed');

    // Cleanup subscriptions
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [projectId, dispatch]);

  // Enhanced participant view handler
  const handleViewParticipant = useCallback((participantData) => {
    // Publish domain event
    eventBus.publish('participant.view.requested', {
      projectId,
      participantId: participantData.id,
      timestamp: new Date().toISOString()
    });

    // Transform data for drawer
    const participant = {
      id: participantData.participant?.id, // UUID from participants table
      projectParticipantId: participantData.id, // Numeric ID from project_participants table
      firstName: participantData.participant?.firstName,
      lastName: participantData.participant?.lastName,
      email: participantData.participant?.email,
      phone: participantData.participant?.phone,
      role: participantData.participant?.role,
      participantStatus: participantData.participant?.participantStatus, // Global participant status (e.g., LOA)
      note: participantData.note // Note from project_participants table
    };

    setSelectedParticipant(participant);
    setDrawerOpen(true);
  }, [projectId]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedParticipant(null);
  }, []);

  // Direct command handlers (proper CQRS pattern)
  const handleAddParticipant = useCallback(async (newParticipant) => {
    try {
      const result = await dispatch(participantCommands.addParticipant({
        projectId,
        participantData: newParticipant
      }));

      // Check if the command was successful
      if (!result.error) {
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      // Return error result
      return { success: false, error };
    }
  }, [dispatch, projectId]);

  // Handler for bulk participant addition (existing participants)
  const handleAddMultipleParticipants = useCallback(async (bulkData) => {
    try {
      const result = await dispatch(participantCommands.addMultipleParticipants({
        projectId,
        participants: bulkData.participants
      }));

      // Check if the command was successful
      if (!result.error) {
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      // Return error result
      return { success: false, error };
    }
  }, [dispatch, projectId]);

  // Handler for CSV import
  const handleImportCSV = useCallback(async (participants) => {
    try {
      const result = await dispatch(participantCommands.importParticipants({
        projectId,
        participants,
        importType: 'csv'
      }));

      // Check if the command was successful
      if (!result.error) {
        return {
          success: true,
          data: result.payload
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      // Return error result
      return { success: false, error };
    }
  }, [dispatch, projectId]);

  const handleUpdateParticipant = useCallback(async (participantId, updates) => {
    await dispatch(participantCommands.updateParticipant({ 
      participantId, 
      updates,
      index,
      participants,
      groups
    }));
  }, [dispatch, index, participants, groups]);

  const handleRemoveParticipant = useCallback(async (participantId) => {
    await dispatch(participantCommands.removeParticipant({
      participantId,
      projectId
    }));
  }, [dispatch, projectId]);

  // Handler for bulk delete from Actions dropdown
  const handleRemoveMultipleParticipants = useCallback(async (participantIds) => {
    // Validate input
    if (!participantIds || participantIds.length === 0) {
      console.warn('[ParticipantsTable] No participants selected for deletion');
      return;
    }

    await dispatch(participantCommands.removeMultipleParticipants({
      participantIds,
      projectId
    }));
  }, [dispatch, projectId]);

  // Handler for bulk role assignment from Actions dropdown
  const handleBulkAssignRole = useCallback(async (roleId, participantIds) => {
    // Validate input
    if (!participantIds || participantIds.length === 0) {
      console.warn('[ParticipantsTable] No participants selected for role assignment');
      return;
    }

    // Get the participant UUIDs from project_participants IDs
    // The participantIds passed are project_participant IDs, we need the actual participant UUIDs
    const participantUuids = participantIds
      .map(id => {
        const enrollment = participants.find(p => p.id === id);
        return enrollment?.participant?.id;
      })
      .filter(Boolean);

    if (participantUuids.length === 0) {
      console.warn('[ParticipantsTable] Could not find participant UUIDs');
      return;
    }

    // Find role name for display
    const role = availableRoles.find(r => r.id === roleId);
    const roleName = role?.title || 'No Role';

    await dispatch(participantCommands.bulkAssignRole({
      participantIds: participantUuids,
      roleId,
      roleName
    }));
  }, [dispatch, participants, availableRoles]);

  // Handler for bulk group assignment from Actions dropdown
  const handleBulkAssignGroup = useCallback(async (groupId, participantIds) => {
    // Validate input
    if (!participantIds || participantIds.length === 0) {
      console.warn('[ParticipantsTable] No participants selected for group assignment');
      return;
    }

    // Find group name for display
    const group = groups.find(g => g.id === groupId);
    const groupName = group?.groupName || 'Unknown Group';

    // For group assignment, we use project_participant IDs directly
    // (group_participants links to project_participants, not participants)
    await dispatch(participantCommands.bulkAssignGroup({
      participantIds,
      groupId,
      projectId,
      groupName
    }));
  }, [dispatch, groups, projectId]);

  // Show loading state
  if (loading && !refreshing) {
    return <Loader />;
  }

  // Show error state
  if (error && !loading) {
    return (
      <MainCard>
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={refreshData}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Failed to load participants
            </Typography>
            <Typography variant="body2">
              {error?.data?.message || error?.message || 'An error occurred while loading participants. Please try again.'}
            </Typography>
          </Alert>
        </Box>
      </MainCard>
    );
  }

  return (
    <>
      <MainCard
        content={false}
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          '& .MuiCardContent-root': {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <ReactTable
            data={participants}
            onAdd={handleAdd}
            onUpdate={handleUpdateParticipant}
            onRemove={handleRemoveParticipant}
            onRemoveMany={handleRemoveMultipleParticipants}
            globalLoading={loading || refreshing}
            onSelectionChange={handleSelectionChange}
            onEmailAccess={handleEmailAccessDialog}
            editableRowIndex={editableRowIndex}
            setEditableRowIndex={setEditableRowIndex}
            onRefresh={refreshData}
            onViewParticipant={handleViewParticipant}
            refreshing={refreshing}
            hideToolbar={false}
            roles={availableRoles}
            rolesLoading={rolesLoading}
            onAssignRole={handleBulkAssignRole}
            groups={groups}
            groupsLoading={false}
            onAssignGroup={handleBulkAssignGroup}
          />
        </Box>
      </MainCard>

      {/* Unified Add Participant Dialog */}
      <AddParticipantOptionsDialog
        open={showOptionsDialog}
        onClose={handleOptionsDialogClose}
        groups={groups}
        existingParticipants={participants}
        onAddSingle={handleAddParticipant}
        onAddMultiple={handleAddMultipleParticipants}
        onImportCSV={handleImportCSV}
      />

      {/* Email Access Dialog */}
      <EmailAccessDialog
        open={emailAccessDialog}
        onClose={handleEmailAccessDialog}
        selectedParticipants={selectedParticipants}
        onSend={handleSendEmail}
      />

      {/* Participant Drawer */}
      <ParticipantDetailsDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        participant={selectedParticipant}
        projectId={projectId}
      />
    </>
  );
});

ParticipantsTable.propTypes = {
  index: PropTypes.number,
  initialAction: PropTypes.string,
};

ParticipantsTable.displayName = 'ParticipantsTable';

export default ParticipantsTable;