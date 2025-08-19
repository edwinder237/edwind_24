import React, { useMemo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import { Dialog } from '@mui/material';

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
  // Redux state and dispatch
  const {
    project_participants,
    singleProject: Project,
    error,
  } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  
  const { title, groups, id: projectId } = Project || {};
  
  // State for available roles (fetch once for all dropdowns)
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Custom hooks for data management
  const {
    loading,
    csvImportLoading,
    refreshData,
    forceRefresh,
    handleCsvImportSubmit
  } = useParticipantsData(projectId);

  // CRUD operations
  const crudOperations = useParticipantsCRUD({
    data: project_participants,
    groups,
    projectId,
    index,
    onRefresh: forceRefresh
  });

  // Table UI state
  const tableState = useTableState();

  // Fetch available roles once for all dropdown cells
  useEffect(() => {
    const fetchAvailableRoles = async () => {
      if (!projectId) return;
      
      setRolesLoading(true);
      try {
        const response = await fetch(`/api/projects/available-roles?projectId=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
          setAvailableRoles(data.roles);
        } else {
          console.error('Failed to fetch available roles:', data.error);
        }
      } catch (error) {
        console.error('Error fetching available roles:', error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchAvailableRoles();
  }, [projectId]);

  // Memoized data
  const data = useMemo(() => project_participants || [], [project_participants]);
  
  // Table columns configuration - memoized for performance with roles data
  const columns = useTableColumns(refreshData, availableRoles, rolesLoading);

  // Email sending handler
  const handleSendEmail = useCallback(async ({ participants, credentials }) => {
    try {
      console.log('Sending email to participants:', participants.length);
      console.log('Selected credentials:', credentials);
      
      const response = await fetch('/api/email/send-credentials', {
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
        alert: { color: 'success' },
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

  // Loading state
  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
        <MainCard
          title={`${tableTitle}s`}
          content={false}
          subheader="This section enables the assignment of employees to groups, facilitates data modifications, and allows for the tracking of learning progress."
        >
          <ScrollX>
            <ReactTable
              columns={columns}
              data={data}
              handleCRUD={handleCRUD}
              csvImportLoading={csvImportLoading}
              onSelectionChange={tableState.handleSelectionChange}
              onEmailAccess={tableState.handleEmailAccessDialog}
              editableRowIndex={tableState.editableRowIndex}
              setEditableRowIndex={tableState.setEditableRowIndex}
            />
          </ScrollX>
        </MainCard>
      </DndProvider>

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