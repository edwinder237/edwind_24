import { useState, useCallback } from 'react';

/**
 * Custom hook for managing AddGroup form state
 */
export const useGroupFormState = () => {
  const [openAlert, setOpenAlert] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);

  const handleAlertClose = useCallback(() => {
    setOpenAlert(prev => !prev);
  }, []);

  const handleModeToggle = useCallback(() => {
    setIsMultipleMode(prev => !prev);
  }, []);

  return {
    openAlert,
    setOpenAlert,
    isMultipleMode,
    setIsMultipleMode,
    handleAlertClose,
    handleModeToggle
  };
};