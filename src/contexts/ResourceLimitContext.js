/**
 * ============================================
 * RESOURCE LIMIT CONTEXT
 * ============================================
 *
 * Global context that provides a single ResourceLimitDialog instance.
 * Any code (React components, axios interceptors, Redux thunks) can
 * trigger the dialog via the imperative `showResourceLimitError()` function.
 *
 * Mount <ResourceLimitProvider> in _app.js to enable.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import ResourceLimitDialog from 'components/subscription/ResourceLimitDialog';

const ResourceLimitContext = createContext(null);

// Module-level ref for imperative access outside the React tree
let _showLimitDialogFn = null;

/**
 * Detect whether an error payload is a resource-limit or feature-not-available error.
 */
function isLimitError(data) {
  if (!data || typeof data !== 'object') return false;
  return (
    data.error === 'Resource limit exceeded' ||
    data.error === 'Feature not available' ||
    data.reason === 'plan_upgrade_required'
  );
}

/**
 * Imperative function callable from anywhere (axios interceptor, Redux thunks).
 * Shows the global ResourceLimitDialog if the error data is a limit error.
 * Returns true if the dialog was shown, false otherwise.
 */
export function showResourceLimitError(errorData) {
  if (!_showLimitDialogFn) return false;
  if (!isLimitError(errorData)) return false;
  _showLimitDialogFn(errorData);
  return true;
}

export function ResourceLimitProvider({ children }) {
  const [limitError, setLimitError] = useState(null);

  const showDialog = useCallback((errorData) => {
    setLimitError(errorData);
  }, []);

  const handleClose = useCallback(() => {
    setLimitError(null);
  }, []);

  // Expose imperatively for non-React callers
  _showLimitDialogFn = showDialog;

  return (
    <ResourceLimitContext.Provider value={{ showLimitDialog: showDialog }}>
      {children}
      <ResourceLimitDialog
        open={!!limitError}
        onClose={handleClose}
        limitError={limitError}
      />
    </ResourceLimitContext.Provider>
  );
}

/**
 * Hook for React components to trigger the global limit dialog.
 *
 * Usage:
 *   const { showLimitDialog } = useResourceLimitDialog();
 *   // In error handler:
 *   showLimitDialog(errorData);
 */
export function useResourceLimitDialog() {
  return useContext(ResourceLimitContext);
}
