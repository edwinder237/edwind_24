import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  BankOutlined,
  UserOutlined,
  ProjectOutlined,
  CalendarOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  UpOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import axios from 'utils/axios';

// Icon mapping for different activity types
const getActivityIcon = (type, iconName) => {
  const iconMap = {
    organization: BankOutlined,
    user: UserOutlined,
    project: ProjectOutlined,
    calendar: CalendarOutlined,
    edit: EditOutlined,
    check: CheckCircleOutlined,
    clock: ClockCircleOutlined,
    team: TeamOutlined
  };

  const IconComponent = iconMap[iconName] || ClockCircleOutlined;
  return <IconComponent />;
};

// Color mapping for activity types
const getActivityColor = (color, theme) => {
  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main
  };
  return colorMap[color] || theme.palette.grey[500];
};

// Format timestamp for display
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }
};

// Format date header
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = (d) => d.toISOString().split('T')[0];

  if (dateOnly(date) === dateOnly(today)) {
    return 'Today';
  } else if (dateOnly(date) === dateOnly(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
};

// Single activity item component
const ActivityItem = ({ activity, isLast, theme }) => {
  const color = getActivityColor(activity.color, theme);

  return (
    <Box sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 2 }}>
      {/* Timeline line */}
      {!isLast && (
        <Box
          sx={{
            position: 'absolute',
            left: 15,
            top: 32,
            bottom: 0,
            width: 2,
            bgcolor: alpha(theme.palette.divider, 0.5)
          }}
        />
      )}

      {/* Icon */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.15),
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 14,
          zIndex: 1,
          border: `2px solid ${alpha(color, 0.3)}`
        }}
      >
        {getActivityIcon(activity.type, activity.icon)}
      </Box>

      {/* Content */}
      <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              {activity.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {activity.description}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {formatTimestamp(activity.timestamp)}
          </Typography>
        </Stack>

        {/* Metadata chips */}
        {activity.metadata && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
            {activity.metadata.projectTitle && (
              <Chip
                label={activity.metadata.projectTitle}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {activity.metadata.courseTitle && (
              <Chip
                label={activity.metadata.courseTitle}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {activity.metadata.participantStatus && (
              <Chip
                label={activity.metadata.participantStatus}
                size="small"
                color={activity.metadata.participantStatus === 'active' ? 'success' : 'default'}
                sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
              />
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

// Date group component
const DateGroup = ({ date, activities, defaultExpanded = true, theme }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Date header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          mb: 1.5,
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: 1
          }}
        >
          {formatDateHeader(date)}
        </Typography>
        <Chip
          label={activities.length}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main
          }}
        />
        <IconButton size="small" sx={{ ml: 'auto', width: 20, height: 20 }}>
          {expanded ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
        </IconButton>
      </Stack>

      {/* Activities */}
      <Collapse in={expanded}>
        <Box sx={{ pl: 0 }}>
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
              theme={theme}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// Main ActivityTimeline component
const ActivityTimeline = ({ recipientId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const fetchActivities = async (isLoadMore = false) => {
    if (!recipientId) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentOffset = isLoadMore ? offset : 0;
      const response = await axios.get(`/api/training-recipients/fetchActivity`, {
        params: { id: recipientId, limit, offset: currentOffset }
      });

      if (response.data.success) {
        if (isLoadMore && data) {
          // Merge new activities with existing
          const existingIds = new Set(data.activities.map(a => a.id));
          const newActivities = response.data.data.activities.filter(a => !existingIds.has(a.id));

          // Merge grouped activities
          const mergedGrouped = { ...data.groupedActivities };
          Object.entries(response.data.data.groupedActivities).forEach(([date, activities]) => {
            if (mergedGrouped[date]) {
              const existingDateIds = new Set(mergedGrouped[date].map(a => a.id));
              const newDateActivities = activities.filter(a => !existingDateIds.has(a.id));
              mergedGrouped[date] = [...mergedGrouped[date], ...newDateActivities];
            } else {
              mergedGrouped[date] = activities;
            }
          });

          setData({
            ...response.data.data,
            activities: [...data.activities, ...newActivities],
            groupedActivities: mergedGrouped
          });
          setOffset(currentOffset + limit);
        } else {
          setData(response.data.data);
          setOffset(limit);
        }
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.error || 'Failed to load activity timeline');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [recipientId]);

  const handleRefresh = () => {
    setOffset(0);
    fetchActivities(false);
  };

  const handleLoadMore = () => {
    fetchActivities(true);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Loading activity timeline...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleRefresh}
          startIcon={<ReloadOutlined />}
          sx={{ mt: 1 }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  // Empty state
  if (!data || data.activities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CalendarOutlined style={{ fontSize: 48, color: theme.palette.grey[400], marginBottom: 16 }} />
        <Typography variant="h6" gutterBottom color="text.secondary">
          No Activity Yet
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Activity will appear here as participants are added and projects progress.
        </Typography>
      </Paper>
    );
  }

  // Sort dates in descending order
  const sortedDates = Object.keys(data.groupedActivities).sort((a, b) => new Date(b) - new Date(a));

  return (
    <Box>
      {/* Header with summary and refresh */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <Chip
            icon={<ClockCircleOutlined />}
            label={`${data.summary.totalActivities} Activities`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<UserOutlined />}
            label={`${data.summary.participantCount} Participants`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<ProjectOutlined />}
            label={`${data.summary.projectCount} Projects`}
            size="small"
            variant="outlined"
          />
        </Stack>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} size="small">
            <ReloadOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Timeline */}
      <Box>
        {sortedDates.map((date, index) => (
          <DateGroup
            key={date}
            date={date}
            activities={data.groupedActivities[date]}
            defaultExpanded={index < 3}
            theme={theme}
          />
        ))}
      </Box>

      {/* Load more button */}
      {data.pagination.hasMore && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={16} /> : <DownOutlined />}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ActivityTimeline;
