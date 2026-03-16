import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';

/**
 * Hook to manage calendar integrations (Google Calendar, Microsoft Outlook).
 * Fetches integration status and provides connect/disconnect/sync actions.
 */
export default function useCalendarIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/calendar-integrations');
      setIntegrations(response.data.integrations || []);
    } catch (err) {
      console.error('Failed to fetch calendar integrations:', err);
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  /**
   * Get integration by provider name
   */
  const getIntegration = useCallback(
    (provider) => integrations.find((i) => i.provider === provider && i.isActive),
    [integrations]
  );

  /**
   * Initiate OAuth connection for a provider
   * @param {'google'|'microsoft'} provider
   */
  const connect = useCallback((provider) => {
    // Redirect to the OAuth connect endpoint (opens in same window)
    window.location.href = `/api/calendar-integrations/${provider}/connect`;
  }, []);

  /**
   * Disconnect a calendar integration
   * @param {number} integrationId
   */
  const disconnect = useCallback(
    async (integrationId) => {
      try {
        setError(null);
        await axios.post(`/api/calendar-integrations/${integrationId}/disconnect`);
        // Refresh the list
        await fetchIntegrations();
        return true;
      } catch (err) {
        console.error('Failed to disconnect integration:', err);
        setError(err.message || 'Failed to disconnect');
        return false;
      }
    },
    [fetchIntegrations]
  );

  /**
   * Trigger a full sync for the current user
   * @param {number} [projectId] - Optional project scope
   */
  const syncNow = useCallback(
    async (projectId, syncScope = 'future') => {
      try {
        setSyncing(true);
        setError(null);
        const response = await axios.post('/api/calendar-integrations/sync', { projectId, syncScope });
        // Refresh to update lastSyncAt
        await fetchIntegrations();
        return response.data;
      } catch (err) {
        console.error('Failed to sync calendars:', err);
        setError(err.message || 'Sync failed');
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [fetchIntegrations]
  );

  return {
    integrations,
    loading,
    error,
    syncing,
    getIntegration,
    connect,
    disconnect,
    syncNow,
    refresh: fetchIntegrations,
  };
}
