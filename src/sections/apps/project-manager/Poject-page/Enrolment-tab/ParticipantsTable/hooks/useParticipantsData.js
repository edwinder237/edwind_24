import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'store';
import { 
  getParticipants, 
  getEmployees, 
  importParticipantsFromCSV 
} from 'store/reducers/projects';

/**
 * Custom hook for managing participants data fetching and state
 */
export const useParticipantsData = (projectId) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const isMountedRef = useRef(false);
  const fetchingRef = useRef(false);

  // Initial data fetch and when projectId changes
  useEffect(() => {
    if (!projectId) return;
    if (fetchingRef.current) return; // Prevent duplicate fetches
    
    const fetchData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      
      try {
        setLoading(true);
        await Promise.all([
          dispatch(getParticipants(projectId)),
          dispatch(getEmployees(projectId)),
        ]);
      } catch (error) {
        console.error('Error fetching participants data:', error);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    // Only fetch on mount or when projectId actually changes
    if (!isMountedRef.current || projectId !== isMountedRef.current) {
      fetchData();
      isMountedRef.current = projectId;
    }
  }, [projectId, dispatch]);

  // Separate effect for refresh trigger
  useEffect(() => {
    if (refreshTrigger === 0) return; // Skip initial render
    if (!projectId) return; // Skip if no projectId
    if (fetchingRef.current) return; // Prevent duplicate fetches
    
    const refreshData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      
      try {
        setLoading(true);
        await Promise.all([
          dispatch(getParticipants(projectId)),
          dispatch(getEmployees(projectId)),
        ]);
      } catch (error) {
        console.error('Error refreshing participants data:', error);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    refreshData();
  }, [refreshTrigger, projectId, dispatch]);

  // Refresh data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Force immediate refresh
  const forceRefresh = useCallback(async () => {
    if (projectId) {
      await Promise.all([
        dispatch(getParticipants(projectId)),
        dispatch(getEmployees(projectId))
      ]);
    }
  }, [projectId, dispatch]);

  // Handle CSV import
  const handleCsvImportSubmit = useCallback(async (participants) => {
    try {
      setCsvImportLoading(true);
      const result = await dispatch(importParticipantsFromCSV(projectId, participants));
      
      // Trigger data refresh
      refreshData();
      
      return result;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setCsvImportLoading(false);
    }
  }, [projectId, dispatch, refreshData]);

  return {
    loading,
    csvImportLoading,
    refreshData,
    forceRefresh,
    handleCsvImportSubmit
  };
};