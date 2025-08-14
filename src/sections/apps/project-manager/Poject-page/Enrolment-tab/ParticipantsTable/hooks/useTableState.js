import { useState, useCallback } from 'react';

/**
 * Custom hook for managing table UI state
 */
export const useTableState = () => {
  const [customer, setCustomer] = useState(null);
  const [add, setAdd] = useState(false);
  const [useNewForm, setUseNewForm] = useState(true);
  const [csvImport, setCsvImport] = useState(false);
  const [emailAccessDialog, setEmailAccessDialog] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editableRowIndex, setEditableRowIndex] = useState(null);

  // Dialog handlers
  const handleAdd = useCallback(() => {
    setAdd(prev => {
      if (customer && !prev) setCustomer(null);
      return !prev;
    });
  }, [customer]);

  const handleCsvImport = useCallback(() => {
    setCsvImport(prev => !prev);
  }, []);

  const handleEmailAccessDialog = useCallback(() => {
    setEmailAccessDialog(prev => !prev);
  }, []);

  // Selection handlers
  const handleSelectionChange = useCallback(({ selectedParticipants, selectedIds }) => {
    setSelectedParticipants(selectedParticipants);
    setSelectedIds(selectedIds);
  }, []);

  return {
    // State
    customer,
    add,
    useNewForm,
    csvImport,
    emailAccessDialog,
    selectedParticipants,
    selectedIds,
    editableRowIndex,
    
    // Setters
    setCustomer,
    setAdd,
    setUseNewForm,
    setCsvImport,
    setEmailAccessDialog,
    setSelectedParticipants,
    setSelectedIds,
    setEditableRowIndex,
    
    // Handlers
    handleAdd,
    handleCsvImport,
    handleEmailAccessDialog,
    handleSelectionChange
  };
};