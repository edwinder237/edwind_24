import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  School as CourseIcon,
  ViewModule as ModuleIcon,
  Assignment as ActivityIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import axios from 'utils/axios';
import AuditLogEntry from './AuditLogEntry';
import AuditLogFilters from './AuditLogFilters';

const ITEMS_PER_PAGE = 20;

const AuditHistoryPanel = ({ courseId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    entityType: '',
    actionType: '',
    startDate: '',
    endDate: '',
  });
  const [offset, setOffset] = useState(0);

  // Tab to entity type mapping
  const tabEntityType = ['', 'course', 'module', 'activity', 'event'];

  const fetchHistory = useCallback(async (reset = false) => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const entityType = tabEntityType[activeTab] || filters.entityType;

      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE,
        offset: currentOffset,
      });

      if (entityType) params.append('entityType', entityType);
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/courses/${courseId}/audit-history?${params}`);

      if (response.data.success) {
        setCourseInfo(response.data.course);
        setPagination(response.data.pagination);

        if (reset || currentOffset === 0) {
          setHistory(response.data.history);
        } else {
          setHistory((prev) => [...prev, ...response.data.history]);
        }

        if (reset) {
          setOffset(0);
        }
      } else {
        setError(response.data.message || 'Failed to fetch audit history');
      }
    } catch (err) {
      console.error('Error fetching audit history:', err);
      setError(err.response?.data?.message || 'Failed to fetch audit history');
    } finally {
      setLoading(false);
    }
  }, [courseId, offset, activeTab, filters]);

  // Initial fetch and refetch on filter/tab changes
  useEffect(() => {
    fetchHistory(true);
  }, [courseId, activeTab, filters]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setOffset(0);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
  };

  const handleClearFilters = () => {
    setFilters({
      entityType: '',
      actionType: '',
      startDate: '',
      endDate: '',
    });
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + ITEMS_PER_PAGE);
    fetchHistory(false);
  };

  const handleRefresh = () => {
    fetchHistory(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <HistoryIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Audit History
            </Typography>
            {courseInfo && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {courseInfo.title}
                </Typography>
                {courseInfo.version && (
                  <Chip
                    label={`v${courseInfo.version}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                )}
              </Stack>
            )}
          </Box>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="audit history tabs">
          <Tab icon={<HistoryIcon />} iconPosition="start" label="All" />
          <Tab icon={<CourseIcon />} iconPosition="start" label="Course" />
          <Tab icon={<ModuleIcon />} iconPosition="start" label="Modules" />
          <Tab icon={<ActivityIcon />} iconPosition="start" label="Activities" />
          <Tab icon={<EventIcon />} iconPosition="start" label="Events" />
        </Tabs>
      </Paper>

      {/* Filters (only show on All tab) */}
      {activeTab === 0 && (
        <AuditLogFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Summary */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {pagination.total} change{pagination.total !== 1 ? 's' : ''} recorded
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State (initial) */}
      {loading && history.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && !error && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No history found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Changes to this course will appear here
          </Typography>
        </Paper>
      )}

      {/* History List */}
      <Box>
        {history.map((entry) => (
          <AuditLogEntry key={entry.id} entry={entry} />
        ))}
      </Box>

      {/* Load More */}
      {pagination.hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AuditHistoryPanel;
