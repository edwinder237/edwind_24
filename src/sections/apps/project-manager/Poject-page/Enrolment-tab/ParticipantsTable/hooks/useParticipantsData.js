import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'store';
import { 
  getParticipants, 
  importParticipantsFromCSV 
} from 'store/reducers/projects';

/**
 * Custom hook for managing participants data fetching and state
 */
export const useParticipantsData = (projectId) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      await dispatch(getParticipants(projectId));
    } catch (error) {
      console.error('Error refreshing participants data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  // Alias for backward compatibility
  const forceRefresh = refreshData;

  // Handle CSV import
  const handleCsvImportSubmit = useCallback(async (participants) => {
    try {
      setCsvImportLoading(true);
      const result = await dispatch(importParticipantsFromCSV(projectId, participants));
      
      return result;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setCsvImportLoading(false);
    }
  }, [projectId, dispatch]);

  return {
    loading,
    csvImportLoading,
    refreshData,
    forceRefresh,
    handleCsvImportSubmit
  };
};