import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { Dialog, Box } from '@mui/material';

// Project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import Loader from 'components/Loader';
import { PopupTransition } from 'components/@extended/Transitions';

// Local imports
import { useParticipantsData } from './hooks/useParticipantsData';
import { useParticipantsCRUD } from './hooks/useParticipantsCRUD';
import { useTableState } from './hooks/useTableState';
import { useTableColumns } from './config/tableColumns';
import ReactTable from './components/ReactTable';
import NewParticipantForm from './NewParticipantForm';
import CSVImport from './CSVImport';
import EmailAccessDialog from 'components/EmailAccessDialog';

const tableTitle = 'Participant';

/**
 * Optimized ParticipantsTable component with proper Separation of Concerns (SoC)
 * 
 * Performance Optimizations:
 * - React.memo for component memoization
 * - Custom hooks for data management and CRUD operations
 * - Memoized data and callbacks to prevent unnecessary re-renders
 * - Separated UI components for better maintainability
 * 
 * Architecture:
 * - useParticipantsData: Data fetching and CSV import logic
 * - useParticipantsCRUD: All CRUD operations with error handling
 * - useTableState: UI state management (dialogs, selections)
 * - useTableColumns: Table column configuration
 * - ReactTable: Optimized table component with drag-drop support
 * - ToolAccessCell: Extracted tool access management component
 * - ColumnCell: Edit/delete actions component
 */
const ParticipantsTable = React.memo(({ index }) => {
  // Memoized selector for better performance
  const memoizedSelector = useMemo(
    () => (state) => ({
      project_participants: state.projects.project_participants,
      singleProject: state.projects.singleProject,
      error: state.projects.error,
      loading: state.projects.loading,
    }),
    []
  );

  // Redux state and dispatch - optimized selector
  const {
    project_participants,
    singleProject: Project,
    error,
    loading: globalLoading,
  } = useSelector(memoizedSelector);
  const dispatch = useDispatch();
  
  // Memoized project data extraction
  const projectData = useMemo(() => {
    if (!Project) return { title: '', groups: [], projectId: null };
    return {
      title: Project.title,
      groups: Project.groups || [],
      projectId: Project.id
    };
  }, [Project]);

  const { title, groups, projectId } = projectData;
  

  // Custom hooks for data management
  const {
    loading,
    csvImportLoading,
    refreshData,
    forceRefresh,
    handleCsvImportSubmit,
    hasData,
    isEmpty
  } = useParticipantsData(projectId);

  // Memoized CRUD operations configuration
  const crudConfig = useMemo(() => ({
    data: project_participants,
    groups,
    projectId,
    index,
    onRefresh: forceRefresh
  }), [project_participants, groups, projectId, index, forceRefresh]);

  // CRUD operations
  const crudOperations = useParticipantsCRUD(crudConfig);

  // Table UI state
  const tableState = useTableState();


  // Memoized data with additional optimizations
  const data = useMemo(() => {
    if (!project_participants || project_participants.length === 0) {
      return [];
    }
    
    // Add any data transformations here if needed
    return project_participants;
  }, [project_participants]);
  
  // Table columns configuration - hook must be called at top level
  const columns = useTableColumns(refreshData);

  // Email sending handler
  const handleSendEmail = useCallback(async ({ participants, credentials }) => {
    try {
      console.log('Sending email to participants:', participants.length);
      console.log('Selected credentials:', credentials);
      
      const response = await fetch('/api/email/send-credentials-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: participants,
          credentials: credentials,
          projectName: Project?.title || 'Training Project'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails');
      }

      const { summary } = result;
      let message = `✅ Email sending completed!\n\n`;
      message += `📧 Emails sent: ${summary.emailsSent}\n`;
      message += `❌ Failed: ${summary.emailsFailed}\n`;
      if (summary.emailsSkipped > 0) {
        message += `⏭️ Skipped: ${summary.emailsSkipped}\n`;
      }
      message += `👥 Total participants: ${summary.totalParticipants}\n`;
      message += `🔑 Credential types: ${summary.credentialTypes}`;

      if (summary.emailsFailed > 0) {
        const failures = result.results.filter(r => r.status === 'failed');
        message += `\n\n⚠️ Email Failures:\n`;
        failures.forEach(failure => {
          message += `• ${failure.participantName} (${failure.participantEmail}): ${failure.error}\n`;
        });
        console.warn('Email failures:', failures);
      }

      dispatch(openSnackbar({
        open: true,
        message: message,
        variant: 'alert',
        alert: { color: summary.emailsFailed > 0 ? 'warning' : 'success' },
        close: false
      }));
      console.log('Email sending result:', result);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      dispatch(openSnackbar({
        open: true,
        message: `❌ Failed to send emails: ${error.message}`,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      throw error;
    }
  }, [Project?.title, dispatch]);

  // CRUD handlers with dialog management
  const handleCRUD = useMemo(() => ({
    handleDialog: tableState.handleAdd,
    handleCsvImport: tableState.handleCsvImport,
    handleAddParticipant: async (newParticipant) => {
      await crudOperations.handleAddParticipant(newParticipant);
      tableState.setAdd(false); // Close dialog on success
    },
    handleUpdate: crudOperations.handleUpdate,
    handleRemove: crudOperations.handleRemove,
    handleRemoveMany: crudOperations.handleRemoveMany,
  }), [crudOperations, tableState]);

  // Early return for loading state - moved after all hooks
  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <MainCard
        title={`${tableTitle}s`}
        content={false}
        subheader="This section enables the assignment of employees to groups, facilitates data modifications, and allows for the tracking of learning progress."
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
            columns={columns}
            data={data}
            handleCRUD={handleCRUD}
            csvImportLoading={csvImportLoading}
            globalLoading={globalLoading}
            onSelectionChange={tableState.handleSelectionChange}
            onEmailAccess={tableState.handleEmailAccessDialog}
            editableRowIndex={tableState.editableRowIndex}
            setEditableRowIndex={tableState.setEditableRowIndex}
          />
        </Box>
      </MainCard>

      {/* Add Participant Dialog */}
      <Dialog
        TransitionComponent={PopupTransition}
        onClose={tableState.handleAdd}
        open={tableState.add}
        sx={{ "& .MuiDialog-paper": { p: 0 } }}
      >
        <NewParticipantForm
          onCancel={tableState.handleAdd}
          handleCRUD={handleCRUD}
          groups={groups}
          isOpen={tableState.add}
          existingParticipants={project_participants}
        />
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImport
        open={tableState.csvImport}
        onClose={tableState.handleCsvImport}
        onImport={handleCsvImportSubmit}
        loading={csvImportLoading}
      />

      {/* Email Access Dialog */}
      <EmailAccessDialog
        open={tableState.emailAccessDialog}
        onClose={tableState.handleEmailAccessDialog}
        selectedParticipants={tableState.selectedParticipants}
        onSend={handleSendEmail}
      />
    </>
  );
});

ParticipantsTable.propTypes = {
  index: PropTypes.number,
};

ParticipantsTable.displayName = 'ParticipantsTable';

export default ParticipantsTable;