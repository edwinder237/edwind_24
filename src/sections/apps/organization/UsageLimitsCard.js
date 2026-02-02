/**
 * ============================================
 * USAGE LIMITS CARD
 * ============================================
 *
 * Displays resource usage and limits for the organization's subscription.
 * Shows current usage vs plan limits with visual progress bars.
 */

import { useState, useEffect } from 'react';
import axios from 'utils/axios';

// material-ui
import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';

// icons
import {
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  BranchesOutlined,
  CloudOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

// ==============================|| USAGE ITEM ||============================== //

const UsageItem = ({ icon, label, current, limit, description }) => {
  const isUnlimited = limit === -1 || limit === null || limit === undefined;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const getProgressColor = () => {
    if (isAtLimit) return 'error';
    if (isNearLimit) return 'warning';
    return 'primary';
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: isAtLimit ? 'error.lighter' : isNearLimit ? 'warning.lighter' : 'primary.lighter',
                  color: isAtLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'primary.main'
                }}
              >
                {icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {label}
                </Typography>
                {description && (
                  <Tooltip title={description}>
                    <InfoCircleOutlined style={{ fontSize: 12, color: '#8c8c8c', cursor: 'help' }} />
                  </Tooltip>
                )}
              </Box>
            </Stack>
            <Chip
              label={isUnlimited ? 'Unlimited' : isAtLimit ? 'At Limit' : isNearLimit ? 'Near Limit' : 'OK'}
              size="small"
              color={isAtLimit ? 'error' : isNearLimit ? 'warning' : 'success'}
              variant={isUnlimited ? 'outlined' : 'filled'}
            />
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary">
                Used
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {current.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
              </Typography>
            </Stack>
            {!isUnlimited && (
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={getProgressColor()}
                sx={{ height: 8, borderRadius: 1 }}
              />
            )}
            {isUnlimited && (
              <LinearProgress
                variant="determinate"
                value={0}
                sx={{ height: 8, borderRadius: 1, bgcolor: 'grey.200' }}
              />
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| USAGE LIMITS CARD ||============================== //

const UsageLimitsCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/subscriptions');
      setSubscription(response.data.subscription);
      setUsage(response.data.usage);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err.response?.data?.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!subscription) {
    return (
      <Alert severity="info">
        No subscription found. Subscribe to a plan to see usage limits.
      </Alert>
    );
  }

  const limits = subscription.plan?.resourceLimits || {};

  // Define usage items with their corresponding limits
  const usageItems = [
    {
      key: 'projects',
      icon: <ProjectOutlined style={{ fontSize: 20 }} />,
      label: 'Projects',
      current: usage?.projects || 0,
      limit: limits.projects,
      description: 'Total training projects in your organization'
    },
    {
      key: 'participants',
      icon: <TeamOutlined style={{ fontSize: 20 }} />,
      label: 'Participants',
      current: usage?.participants || 0,
      limit: limits.participants,
      description: 'Total unique participants across all projects'
    },
    {
      key: 'instructors',
      icon: <UserOutlined style={{ fontSize: 20 }} />,
      label: 'Instructors',
      current: usage?.instructors || 0,
      limit: limits.instructors,
      description: 'Total instructors in your organization'
    },
    {
      key: 'courses',
      icon: <BookOutlined style={{ fontSize: 20 }} />,
      label: 'Courses',
      current: usage?.courses || 0,
      limit: limits.courses,
      description: 'Total courses created'
    },
    {
      key: 'curriculums',
      icon: <ReadOutlined style={{ fontSize: 20 }} />,
      label: 'Curriculums',
      current: usage?.curriculums || 0,
      limit: limits.curriculums,
      description: 'Total curriculums created'
    },
    {
      key: 'sub_organizations',
      icon: <BranchesOutlined style={{ fontSize: 20 }} />,
      label: 'Sub-Organizations',
      current: usage?.sub_organizations || 0,
      limit: limits.sub_organizations,
      description: 'Departments or divisions within your organization'
    },
    {
      key: 'projects_per_month',
      icon: <ProjectOutlined style={{ fontSize: 20 }} />,
      label: 'Projects (This Month)',
      current: usage?.projects_per_month || 0,
      limit: limits.projects_per_month,
      description: 'Projects created in the current billing period'
    },
    {
      key: 'storage',
      icon: <CloudOutlined style={{ fontSize: 20 }} />,
      label: 'Storage',
      current: usage?.storage || 0,
      limit: limits.storage_gb ? limits.storage_gb * 1024 : null,
      description: 'Total file storage used (MB)'
    }
  ];

  // Filter out items where limit is not defined
  const activeUsageItems = usageItems.filter(
    (item) => item.limit !== undefined && item.limit !== null
  );

  return (
    <Box>
      <Stack spacing={3}>
        {/* Plan Info Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" gutterBottom>
              Resource Usage
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Current usage for your <strong>{subscription.plan?.name || 'Unknown'}</strong> plan
            </Typography>
          </Box>
          <Chip
            label={subscription.status}
            color={subscription.status === 'active' ? 'success' : 'warning'}
            size="small"
          />
        </Stack>

        {/* Usage Grid */}
        <Grid container spacing={3}>
          {activeUsageItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.key}>
              <UsageItem
                icon={item.icon}
                label={item.label}
                current={item.current}
                limit={item.limit}
                description={item.description}
              />
            </Grid>
          ))}
        </Grid>

        {activeUsageItems.length === 0 && (
          <Alert severity="info">
            No resource limits configured for your plan.
          </Alert>
        )}

        {/* Custom Limits Info */}
        {subscription.customLimits && Object.keys(subscription.customLimits).length > 0 && (
          <Alert severity="info" icon={<InfoCircleOutlined />}>
            Your organization has custom limits applied. Contact support for details.
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default UsageLimitsCard;
