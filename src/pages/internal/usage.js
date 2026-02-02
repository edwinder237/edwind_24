import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// material-ui
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// date pickers
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// icons
import {
  ApiOutlined,
  CloudUploadOutlined,
  MailOutlined,
  RobotOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  BankOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// Dynamic import for ApexCharts (no SSR)
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ==============================|| PROVIDER ICONS ||============================== //

const providerIcons = {
  gemini: <RobotOutlined style={{ fontSize: 20 }} />,
  resend: <MailOutlined style={{ fontSize: 20 }} />,
  r2: <CloudUploadOutlined style={{ fontSize: 20 }} />,
  maps: <EnvironmentOutlined style={{ fontSize: 20 }} />
};

const providerColors = {
  gemini: '#8B5CF6', // purple
  resend: '#10B981', // green
  r2: '#F59E0B', // amber
  maps: '#3B82F6' // blue
};

const providerLabels = {
  gemini: 'Gemini AI',
  resend: 'Resend Email',
  r2: 'Cloudflare R2',
  maps: 'Google Maps'
};

// ==============================|| METRIC CARD ||============================== //

const MetricCard = ({ title, value, subtitle, icon, color = 'primary', loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={80} height={40} />
          <Skeleton variant="text" width={120} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1)
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| PROVIDER BREAKDOWN ||============================== //

const ProviderBreakdown = ({ data, loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={150} sx={{ mb: 3 }} />
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Usage by Provider
        </Typography>
        <Stack spacing={2}>
          {data.map((item) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            const color = providerColors[item.provider] || theme.palette.primary.main;

            return (
              <Box key={item.provider}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color }}>{providerIcons[item.provider]}</Box>
                    <Typography variant="body2">{providerLabels[item.provider] || item.provider}</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600}>
                    {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: color,
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Est. cost: ${(item.cost || 0).toFixed(4)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| COST BY ORGANIZATION CHART ||============================== //

const CostByOrgChart = ({ data, totalCost = 0, neonCost = 0, globalTotals = null, loading }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { series: [], labels: [] };

    // Calculate global total calls for proportional DB cost
    const globalTotalCalls = globalTotals?.totalCalls || data.reduce((sum, org) => sum + (org.count || 0), 0);

    // Calculate total cost (API + proportional DB) for each org
    const orgsWithTotalCost = data.map(org => {
      const dbCost = globalTotalCalls > 0 ? ((org.count || 0) / globalTotalCalls) * neonCost : 0;
      return {
        ...org,
        totalCost: (org.cost || 0) + dbCost
      };
    });

    // Filter organizations with totalCost > 0 and sort by totalCost descending
    const orgsWithCost = orgsWithTotalCost
      .filter((org) => org.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 8);

    return {
      series: orgsWithCost.map((org) => parseFloat((org.totalCost || 0).toFixed(4))),
      labels: orgsWithCost.map((org) => org.organizationName || 'Unknown')
    };
  }, [data, neonCost, globalTotals]);

  const options = {
    chart: {
      type: 'donut',
      height: 320
    },
    colors: ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'],
    labels: chartData.labels,
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: theme.palette.text.primary
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: (val) => `$${parseFloat(val).toFixed(4)}`
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Cost',
              fontSize: '12px',
              color: theme.palette.text.secondary,
              formatter: () => `$${totalCost.toFixed(4)}`
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: {
        colors: theme.palette.text.secondary
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `$${val.toFixed(4)}`
      }
    },
    stroke: {
      show: false
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={150} sx={{ mb: 2 }} />
          <Skeleton variant="circular" width={250} height={250} sx={{ mx: 'auto' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Cost by Organization
        </Typography>
        {chartData.series.length > 0 ? (
          <ReactApexChart options={options} series={chartData.series} type="donut" height={320} />
        ) : (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No organization cost data</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ==============================|| USERS TABLE ||============================== //

const UsersTable = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Usage by User
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell align="right">API Calls</TableCell>
                <TableCell align="right">Est. Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No user data available
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((user, index) => (
                  <TableRow key={user.userId || index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.userName || 'Unknown'}
                        </Typography>
                        {user.userEmail && (
                          <Typography variant="caption" color="text.secondary">
                            {user.userEmail}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.organizationName || '-'}
                        </Typography>
                        {user.subOrganizationName && (
                          <Typography variant="caption" color="text.secondary">
                            {user.subOrganizationName}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{user.count?.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ${(user.cost || 0).toFixed(4)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// ==============================|| ORGANIZATIONS TABLE ||============================== //

const OrganizationsTable = ({ data, neonCost = 0, resendCost = 0, mapsCost = 0, globalTotals = null, loading }) => {
  const theme = useTheme();
  const totalApiCost = data.reduce((sum, org) => sum + (org.cost || 0), 0);
  const displayedTotalCalls = data.reduce((sum, org) => sum + (org.count || 0), 0);

  // Use global totals when available for accurate proportional calculation
  const globalTotalCalls = globalTotals?.totalCalls || displayedTotalCalls;

  // Calculate DB cost per org proportionally based on their share of GLOBAL API calls
  const getOrgDbCost = (orgCalls) => {
    if (globalTotalCalls === 0 || neonCost === 0) return 0;
    return (orgCalls / globalTotalCalls) * neonCost;
  };

  // Calculate Email cost per org proportionally based on their share of GLOBAL API calls
  const getOrgEmailCost = (orgCalls) => {
    if (globalTotalCalls === 0 || resendCost === 0) return 0;
    return (orgCalls / globalTotalCalls) * resendCost;
  };

  // Calculate Maps cost per org proportionally based on their share of GLOBAL API calls
  const getOrgMapsCost = (orgCalls) => {
    if (globalTotalCalls === 0 || mapsCost === 0) return 0;
    return (orgCalls / globalTotalCalls) * mapsCost;
  };

  // Calculate total displayed costs (sum of proportional costs for displayed orgs)
  const displayedNeonCost = data.reduce((sum, org) => sum + getOrgDbCost(org.count || 0), 0);
  const displayedEmailCost = data.reduce((sum, org) => sum + getOrgEmailCost(org.count || 0), 0);
  const displayedMapsCost = data.reduce((sum, org) => sum + getOrgMapsCost(org.count || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Usage by Organization
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell align="right">API Calls</TableCell>
                <TableCell align="right">API Cost</TableCell>
                <TableCell align="right">DB Cost</TableCell>
                <TableCell align="right">Email Cost</TableCell>
                <TableCell align="right">Maps Cost</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No usage data available
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((org, index) => {
                    const orgDbCost = getOrgDbCost(org.count || 0);
                    const orgEmailCost = getOrgEmailCost(org.count || 0);
                    const orgMapsCost = getOrgMapsCost(org.count || 0);
                    const orgTotalCost = (org.cost || 0) + orgDbCost + orgEmailCost + orgMapsCost;
                    return (
                      <TableRow key={org.organizationId || index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {org.organizationName || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{org.count?.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${(org.cost || 0).toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: '#00E599' }}>
                            ${orgDbCost.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: '#10B981' }}>
                            ${orgEmailCost.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: '#4285F4' }}>
                            ${orgMapsCost.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${orgTotalCost.toFixed(4)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals Row */}
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell colSpan={2}>
                      <Typography variant="body2" fontWeight={700}>
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{displayedTotalCalls.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ${totalApiCost.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#00E599' }}>
                        ${displayedNeonCost.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#10B981' }}>
                        ${displayedEmailCost.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#4285F4' }}>
                        ${displayedMapsCost.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        ${(totalApiCost + displayedNeonCost + displayedEmailCost + displayedMapsCost).toFixed(4)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// ==============================|| NEON DATABASE USAGE ||============================== //

const NeonUsageCard = ({ data, loading, proportionalShare = 1, organizationName = null }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data?.configured) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <DatabaseOutlined style={{ fontSize: 24, color: '#00E599' }} />
            <Typography variant="h6">Neon Database Usage</Typography>
          </Stack>
          <Typography color="text.secondary">
            {data?.message || 'Neon API not configured. Add NEON_API_KEY to environment variables.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const rawMetrics = data.metrics || {};
  const limits = data.limits || {};
  const rawCosts = data.costs || {};
  const pricing = data.pricing || {};

  // Calculate proportional metrics and costs when filtering by organization
  const metrics = {
    computeHours: proportionalShare < 1
      ? (parseFloat(rawMetrics.computeHours || 0) * proportionalShare).toFixed(2)
      : rawMetrics.computeHours,
    storageSizeGB: proportionalShare < 1
      ? (parseFloat(rawMetrics.storageSizeGB || 0) * proportionalShare).toFixed(4)
      : rawMetrics.storageSizeGB,
    writtenDataGB: proportionalShare < 1
      ? (parseFloat(rawMetrics.writtenDataGB || 0) * proportionalShare).toFixed(4)
      : rawMetrics.writtenDataGB,
    dataTransferGB: proportionalShare < 1
      ? (parseFloat(rawMetrics.dataTransferGB || 0) * proportionalShare).toFixed(4)
      : rawMetrics.dataTransferGB
  };

  const costs = {
    compute: {
      ...rawCosts.compute,
      cost: (rawCosts.compute?.cost || 0) * proportionalShare
    },
    storage: {
      ...rawCosts.storage,
      cost: (rawCosts.storage?.cost || 0) * proportionalShare
    },
    writtenData: {
      ...rawCosts.writtenData,
      cost: (rawCosts.writtenData?.cost || 0) * proportionalShare
    },
    dataTransfer: {
      ...rawCosts.dataTransfer,
      cost: (rawCosts.dataTransfer?.cost || 0) * proportionalShare
    },
    total: (rawCosts.total || 0) * proportionalShare
  };

  // Calculate percentages for progress bars
  // When filtering by org, show percentage of total usage (not of limits)
  const computePercent = proportionalShare < 1
    ? proportionalShare * 100
    : (limits.computeHours > 0
      ? Math.min((parseFloat(rawMetrics.computeHours || 0) / limits.computeHours) * 100, 100)
      : 0);
  const storagePercent = proportionalShare < 1
    ? proportionalShare * 100
    : (limits.storageGB > 0
      ? Math.min((parseFloat(rawMetrics.storageSizeGB || 0) / limits.storageGB) * 100, 100)
      : 0);

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'error';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  const formatCost = (cost) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DatabaseOutlined style={{ fontSize: 24, color: '#00E599' }} />
            <Typography variant="h6">Neon Database Usage</Typography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Neon Launch Plan Pricing
                  </Typography>
                  <Table size="small" sx={{ '& td, & th': { border: 0, py: 0.5, px: 1, color: 'inherit' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Free Tier</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Compute</TableCell>
                        <TableCell>$0.0255/hr</TableCell>
                        <TableCell>100 hrs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Storage</TableCell>
                        <TableCell>$0.12/GB/mo</TableCell>
                        <TableCell>0.5 GB</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Written Data</TableCell>
                        <TableCell>$0.096/GB</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Data Transfer</TableCell>
                        <TableCell>$0.09/GB</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              }
              arrow
              placement="right"
            >
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoCircleOutlined style={{ fontSize: 16, color: theme.palette.text.secondary }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            {organizationName && (
              <Chip
                label={organizationName}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {costs.total !== undefined && (
              <Chip
                label={`Est. Cost: ${formatCost(costs.total)}${proportionalShare < 1 ? ` (${(proportionalShare * 100).toFixed(1)}%)` : ''}`}
                size="small"
                color={costs.total > 0 ? 'warning' : 'success'}
              />
            )}
            {data.project && (
              <Chip
                label={data.project.name || data.project.id}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Compute Hours */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ClockCircleOutlined style={{ color: theme.palette.primary.main }} />
                <Typography variant="body2" color="text.secondary">Compute</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {metrics.computeHours || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${rawMetrics.computeHours || 0}` : `/ ${limits.computeHours}`} CU-hrs
              </Typography>
              <LinearProgress
                variant="determinate"
                value={computePercent}
                color={getProgressColor(computePercent)}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.computePerHour}/hr
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : costs.compute?.overage > 0 ? (
                  <Typography variant="caption" color="error.main" fontWeight="medium">
                    +{costs.compute.overage.toFixed(1)}h → {formatCost(costs.compute.cost)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="success.main">
                    Free tier
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Storage */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CloudServerOutlined style={{ color: theme.palette.success.main }} />
                <Typography variant="body2" color="text.secondary">Storage</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {metrics.storageSizeGB || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${rawMetrics.storageSizeGB || 0}` : `/ ${limits.storageGB}`} GB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={storagePercent}
                color={getProgressColor(storagePercent)}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.storagePerGBMonth}/GB/mo
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : costs.storage?.overage > 0 ? (
                  <Typography variant="caption" color="error.main" fontWeight="medium">
                    +{costs.storage.overage.toFixed(3)}GB → {formatCost(costs.storage.cost)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="success.main">
                    Free tier
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Written Data */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <SwapOutlined style={{ color: theme.palette.warning.main }} />
                <Typography variant="body2" color="text.secondary">Written Data</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {metrics.writtenDataGB || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${rawMetrics.writtenDataGB || 0} GB` : 'GB this period'}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.writtenDataPerGB}/GB
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : (
                  <Typography variant="caption" color={costs.writtenData?.cost > 0 ? 'warning.main' : 'text.secondary'} fontWeight={costs.writtenData?.cost > 0 ? 'medium' : 'normal'}>
                    {formatCost(costs.writtenData?.cost || 0)}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Data Transfer */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ThunderboltOutlined style={{ color: theme.palette.info.main }} />
                <Typography variant="body2" color="text.secondary">Data Transfer</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {metrics.dataTransferGB || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${rawMetrics.dataTransferGB || 0} GB` : 'GB this period'}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.dataTransferPerGB}/GB
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : (
                  <Typography variant="caption" color={costs.dataTransfer?.cost > 0 ? 'warning.main' : 'text.secondary'} fontWeight={costs.dataTransfer?.cost > 0 ? 'medium' : 'normal'}>
                    {formatCost(costs.dataTransfer?.cost || 0)}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {data.billingPeriod && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
            Billing period: {new Date(data.billingPeriod.start).toLocaleDateString()} - {new Date(data.billingPeriod.end).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ==============================|| RESEND EMAIL SERVICE USAGE ||============================== //

const ResendUsageCard = ({ data, loading, proportionalShare = 1, organizationName = null }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data?.configured) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <MailOutlined style={{ fontSize: 24, color: '#10B981' }} />
            <Typography variant="h6">Resend Email Service</Typography>
          </Stack>
          <Typography color="text.secondary">
            {data?.message || 'Resend API key not configured. Add RESEND_API_KEY to environment variables.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const metrics = data.metrics || {};
  const costs = data.costs || {};
  const pricing = data.pricing || {};
  const byAction = data.byAction || [];

  // Apply proportional share when filtering by organization
  const displayMetrics = {
    totalEmails: proportionalShare < 1
      ? Math.round((metrics.totalEmails || 0) * proportionalShare)
      : metrics.totalEmails || 0,
    totalCalls: proportionalShare < 1
      ? Math.round((metrics.totalCalls || 0) * proportionalShare)
      : metrics.totalCalls || 0,
    successRate: metrics.successRate || 100
  };

  const displayCosts = {
    total: (costs.estimated || 0) * proportionalShare
  };

  // Calculate email usage percentage
  const emailPercent = proportionalShare < 1
    ? proportionalShare * 100
    : (costs.emails?.freeLimit > 0
      ? Math.min(((metrics.totalEmails || 0) / costs.emails.freeLimit) * 100, 100)
      : 0);

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'error';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  const formatCost = (cost) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MailOutlined style={{ fontSize: 24, color: '#10B981' }} />
            <Typography variant="h6">Resend Email Service</Typography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Resend Pricing
                  </Typography>
                  <Table size="small" sx={{ '& td, & th': { border: 0, py: 0.5, px: 1, color: 'inherit' } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell>Per Email</TableCell>
                        <TableCell>${pricing.perEmail}/email</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Free Tier</TableCell>
                        <TableCell>{costs.emails?.freeLimit?.toLocaleString() || 3000} emails/mo</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              }
              arrow
              placement="right"
            >
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoCircleOutlined style={{ fontSize: 16, color: theme.palette.text.secondary }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            {organizationName && (
              <Chip
                label={organizationName}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {displayCosts.total !== undefined && (
              <Chip
                label={`Est. Cost: ${formatCost(displayCosts.total)}${proportionalShare < 1 ? ` (${(proportionalShare * 100).toFixed(1)}%)` : ''}`}
                size="small"
                color={displayCosts.total > 0 ? 'warning' : 'success'}
              />
            )}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Emails Sent */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <SendOutlined style={{ color: theme.palette.success.main }} />
                <Typography variant="body2" color="text.secondary">Emails Sent</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.totalEmails.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1
                  ? `of ${(metrics.totalEmails || 0).toLocaleString()}`
                  : `All time (${metrics.currentMonthEmails || 0} this month)`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={emailPercent}
                color={getProgressColor(emailPercent)}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.perEmail}/email
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : costs.emails?.overage > 0 ? (
                  <Typography variant="caption" color="error.main" fontWeight="medium">
                    +{costs.emails.overage.toLocaleString()} → {formatCost(costs.emails.cost)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="success.main">
                    Free tier
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* API Calls */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ApiOutlined style={{ color: theme.palette.primary.main }} />
                <Typography variant="body2" color="text.secondary">API Calls</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.totalCalls.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${(metrics.totalCalls || 0).toLocaleString()}` : `All time (${metrics.currentMonthCalls || 0} this month)`}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Send requests
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {byAction.length} action types
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Success Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(parseFloat(metrics.successRate) >= 90 ? theme.palette.success.main : theme.palette.warning.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CheckCircleOutlined style={{ color: parseFloat(metrics.successRate) >= 90 ? theme.palette.success.main : theme.palette.warning.main }} />
                <Typography variant="body2" color="text.secondary">Success Rate</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {metrics.successRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                based on send results
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  {metrics.delivered || 0} successful
                </Typography>
                <Typography variant="caption" color={(metrics.bounced || 0) > 0 ? 'error.main' : 'text.secondary'}>
                  {metrics.bounced || 0} failed
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* By Action */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <MailOutlined style={{ color: theme.palette.info.main }} />
                <Typography variant="body2" color="text.secondary">By Action</Typography>
              </Stack>
              <Stack spacing={0.5}>
                {byAction.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No actions tracked</Typography>
                ) : (
                  byAction.slice(0, 4).map((action, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {action.action?.replace(/_/g, ' ') || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" fontWeight={500}>
                        {action.emails || 0} emails
                      </Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {data.billingPeriod && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
            Billing period: {new Date(data.billingPeriod.start).toLocaleDateString()} - {new Date(data.billingPeriod.end).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ==============================|| GOOGLE MAPS API USAGE ||============================== //

const MapsUsageCard = ({ data, loading, proportionalShare = 1, organizationName = null }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data?.configured) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <EnvironmentOutlined style={{ fontSize: 24, color: '#4285F4' }} />
            <Typography variant="h6">Google Maps API</Typography>
          </Stack>
          <Typography color="text.secondary">
            {data?.message || 'Google Maps API key not configured. Add GOOGLE_MAPS_API_KEY to environment variables.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const metrics = data.metrics || {};
  const pricing = data.pricing || {};
  const byAction = data.byAction || [];

  // Apply proportional share when filtering by organization
  const displayMetrics = {
    totalCalls: proportionalShare < 1
      ? Math.round((metrics.totalCalls || 0) * proportionalShare)
      : metrics.totalCalls || 0,
    totalCost: proportionalShare < 1
      ? (metrics.totalCost || 0) * proportionalShare
      : metrics.totalCost || 0,
    autocomplete: {
      calls: proportionalShare < 1
        ? Math.round((metrics.autocomplete?.calls || 0) * proportionalShare)
        : metrics.autocomplete?.calls || 0,
      cost: proportionalShare < 1
        ? (metrics.autocomplete?.cost || 0) * proportionalShare
        : metrics.autocomplete?.cost || 0
    },
    placeDetails: {
      calls: proportionalShare < 1
        ? Math.round((metrics.placeDetails?.calls || 0) * proportionalShare)
        : metrics.placeDetails?.calls || 0,
      cost: proportionalShare < 1
        ? (metrics.placeDetails?.cost || 0) * proportionalShare
        : metrics.placeDetails?.cost || 0
    },
    mapLoad: {
      calls: proportionalShare < 1
        ? Math.round((metrics.mapLoad?.calls || 0) * proportionalShare)
        : metrics.mapLoad?.calls || 0,
      cost: proportionalShare < 1
        ? (metrics.mapLoad?.cost || 0) * proportionalShare
        : metrics.mapLoad?.cost || 0
    },
    successRate: metrics.successRate || '100.00'
  };

  const formatCost = (cost) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EnvironmentOutlined style={{ fontSize: 24, color: '#4285F4' }} />
            <Typography variant="h6">Google Maps API</Typography>
            <Chip label="Timeline Feature" size="small" variant="outlined" color="info" />
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Maps Pricing
                  </Typography>
                  <Table size="small" sx={{ '& td, & th': { border: 0, py: 0.5, px: 1, color: 'inherit' } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell>Map Load</TableCell>
                        <TableCell>${pricing.mapLoad}/load</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Autocomplete</TableCell>
                        <TableCell>${pricing.autocomplete}/request</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Place Details</TableCell>
                        <TableCell>${pricing.placeDetails}/request</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              }
              arrow
              placement="right"
            >
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoCircleOutlined style={{ fontSize: 16, color: theme.palette.text.secondary }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            {organizationName && (
              <Chip
                label={organizationName}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {displayMetrics.totalCost !== undefined && (
              <Chip
                label={`Est. Cost: ${formatCost(displayMetrics.totalCost)}${proportionalShare < 1 ? ` (${(proportionalShare * 100).toFixed(1)}%)` : ''}`}
                size="small"
                color={displayMetrics.totalCost > 0 ? 'warning' : 'success'}
              />
            )}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Total API Calls */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: alpha('#4285F4', 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ApiOutlined style={{ color: '#4285F4' }} />
                <Typography variant="body2" color="text.secondary">Total Calls</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.totalCalls.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1
                  ? `of ${(metrics.totalCalls || 0).toLocaleString()}`
                  : `All time (${metrics.currentMonthCalls || 0} this month)`}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  API requests
                </Typography>
                {proportionalShare < 1 ? (
                  <Typography variant="caption" color="info.main" fontWeight="medium">
                    {(proportionalShare * 100).toFixed(1)}% share
                  </Typography>
                ) : (
                  <Typography variant="caption" fontWeight={500}>
                    {formatCost(displayMetrics.totalCost)}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Map Load */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: alpha('#4285F4', 0.08) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EnvironmentOutlined style={{ color: '#4285F4' }} />
                <Typography variant="body2" color="text.secondary">Map Loads</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.mapLoad.calls.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${(metrics.mapLoad?.calls || 0).toLocaleString()}` : 'Dynamic Maps'}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.mapLoad}/load
                </Typography>
                <Typography variant="caption" fontWeight={500} color={displayMetrics.mapLoad.cost > 0 ? 'warning.main' : 'text.secondary'}>
                  {formatCost(displayMetrics.mapLoad.cost)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Autocomplete */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EnvironmentOutlined style={{ color: theme.palette.success.main }} />
                <Typography variant="body2" color="text.secondary">Autocomplete</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.autocomplete.calls.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${(metrics.autocomplete?.calls || 0).toLocaleString()}` : 'requests'}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.autocomplete}/req
                </Typography>
                <Typography variant="caption" fontWeight={500} color={displayMetrics.autocomplete.cost > 0 ? 'warning.main' : 'text.secondary'}>
                  {formatCost(displayMetrics.autocomplete.cost)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Place Details */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EnvironmentOutlined style={{ color: theme.palette.warning.main }} />
                <Typography variant="body2" color="text.secondary">Place Details</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.placeDetails.calls.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {proportionalShare < 1 ? `of ${(metrics.placeDetails?.calls || 0).toLocaleString()}` : 'requests'}
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ${pricing.placeDetails}/req
                </Typography>
                <Typography variant="caption" fontWeight={500} color={displayMetrics.placeDetails.cost > 0 ? 'warning.main' : 'text.secondary'}>
                  {formatCost(displayMetrics.placeDetails.cost)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Success Rate */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: alpha(parseFloat(displayMetrics.successRate) >= 90 ? theme.palette.success.main : theme.palette.warning.main, 0.05) }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CheckCircleOutlined style={{ color: parseFloat(displayMetrics.successRate) >= 90 ? theme.palette.success.main : theme.palette.warning.main }} />
                <Typography variant="body2" color="text.secondary">Success Rate</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {displayMetrics.successRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                based on API responses
              </Typography>
              <Box sx={{ mt: 1, height: 6 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  {metrics.successCalls || 0} successful
                </Typography>
                <Typography variant="caption" color={(metrics.failedCalls || 0) > 0 ? 'error.main' : 'text.secondary'}>
                  {metrics.failedCalls || 0} failed
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {data.billingPeriod && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
            Billing period: {new Date(data.billingPeriod.start).toLocaleDateString()} - {new Date(data.billingPeriod.end).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ==============================|| INTERNAL - USAGE PAGE ||============================== //

const InternalUsagePage = () => {
  const theme = useTheme();
  const { user, isLoading: userLoading } = useUser();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [providerFilter, setProviderFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [neonData, setNeonData] = useState(null);
  const [neonLoading, setNeonLoading] = useState(true);
  const [resendData, setResendData] = useState(null);
  const [resendLoading, setResendLoading] = useState(true);
  const [mapsData, setMapsData] = useState(null);
  const [mapsLoading, setMapsLoading] = useState(true);
  const [workosData, setWorkosData] = useState(null);
  const [workosLoading, setWorkosLoading] = useState(true);

  // Check if current user is owner
  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Fetch organizations for filter dropdown
  useEffect(() => {
    if (isOwner) {
      fetch('/api/internal/organizations?limit=100')
        .then((res) => res.json())
        .then((result) => {
          if (result.organizations) {
            setOrganizations(result.organizations);
          }
        })
        .catch((err) => console.error('Failed to fetch organizations:', err));
    }
  }, [isOwner]);

  // Fetch Neon database usage
  useEffect(() => {
    if (isOwner) {
      setNeonLoading(true);
      fetch('/api/internal/usage/neon')
        .then((res) => res.json())
        .then((result) => {
          setNeonData(result);
        })
        .catch((err) => console.error('Failed to fetch Neon usage:', err))
        .finally(() => setNeonLoading(false));
    }
  }, [isOwner]);

  // Fetch Resend email service usage
  useEffect(() => {
    if (isOwner) {
      setResendLoading(true);
      fetch('/api/internal/usage/resend')
        .then((res) => res.json())
        .then((result) => {
          setResendData(result);
        })
        .catch((err) => console.error('Failed to fetch Resend usage:', err))
        .finally(() => setResendLoading(false));
    }
  }, [isOwner]);

  // Fetch Google Maps API usage
  useEffect(() => {
    if (isOwner) {
      setMapsLoading(true);
      fetch('/api/internal/usage/maps')
        .then((res) => res.json())
        .then((result) => {
          setMapsData(result);
        })
        .catch((err) => console.error('Failed to fetch Maps usage:', err))
        .finally(() => setMapsLoading(false));
    }
  }, [isOwner]);

  // Fetch WorkOS Auth usage
  useEffect(() => {
    if (isOwner) {
      setWorkosLoading(true);
      fetch('/api/internal/usage/workos')
        .then((res) => res.json())
        .then((result) => {
          setWorkosData(result);
        })
        .catch((err) => console.error('Failed to fetch WorkOS usage:', err))
        .finally(() => setWorkosLoading(false));
    }
  }, [isOwner]);

  // Fetch usage data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (providerFilter) params.append('provider', providerFilter);
      if (organizationFilter) params.append('organizationId', organizationFilter);

      const response = await fetch(`/api/internal/usage/stats?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (isOwner) {
      fetchData();
    }
  }, [isOwner, startDate, endDate, providerFilter, organizationFilter]);

  // Loading state
  if (userLoading) {
    return (
      <Page title="Provider Usage">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="Provider Usage">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CrownOutlined style={{ fontSize: '4rem', color: theme.palette.warning.main, marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom>
                Owner Access Required
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This page is only accessible to platform owners.
              </Typography>
            </Box>
          </MainCard>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Provider Usage">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Provider Usage</Typography>
            <Typography variant="body2" color="text.secondary">
              Track API usage and costs across all providers
            </Typography>
          </Box>
          <Chip icon={<CrownOutlined />} label="Owner Only" color="warning" variant="outlined" />
        </Stack>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={providerFilter}
                      label="Provider"
                      onChange={(e) => setProviderFilter(e.target.value)}
                    >
                      <MenuItem value="">All Providers</MenuItem>
                      <MenuItem value="gemini">Gemini AI</MenuItem>
                      <MenuItem value="resend">Resend Email</MenuItem>
                      <MenuItem value="r2">Cloudflare R2</MenuItem>
                      <MenuItem value="maps">Google Maps</MenuItem>
                      <MenuItem value="neon">Neon DB</MenuItem>
                      <MenuItem value="workos">WorkOS Auth</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Organization</InputLabel>
                    <Select
                      value={organizationFilter}
                      label="Organization"
                      onChange={(e) => setOrganizationFilter(e.target.value)}
                    >
                      <MenuItem value="">All Organizations</MenuItem>
                      {organizations.map((org) => (
                        <MenuItem key={org.id} value={org.id}>
                          {org.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard
              title="Total API Calls"
              value={data?.summary?.totalCalls?.toLocaleString() || '0'}
              subtitle="In selected period"
              icon={<ApiOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />}
              color="primary"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard
              title="Total Est. Cost"
              value={(() => {
                // Calculate proportional Neon cost when org filter is active
                let neonCost = neonData?.costs?.total || 0;
                if (organizationFilter && data?.globalTotals) {
                  const { totalCalls, selectedOrgCalls } = data.globalTotals;
                  if (totalCalls > 0) {
                    neonCost = neonCost * (selectedOrgCalls / totalCalls);
                  } else {
                    neonCost = 0;
                  }
                }
                return `$${((data?.summary?.totalCost || 0) + neonCost).toFixed(4)}`;
              })()}
              subtitle={
                (() => {
                  const costs = [];
                  // Get costs from byProvider
                  (data?.byProvider || []).forEach(p => {
                    if (p.cost > 0) {
                      const label = providerLabels[p.provider] || p.provider;
                      costs.push(`${label}: $${p.cost.toFixed(4)}`);
                    }
                  });
                  // Add Neon DB cost (proportional if filtered)
                  let neonCost = neonData?.costs?.total || 0;
                  if (organizationFilter && data?.globalTotals) {
                    const { totalCalls, selectedOrgCalls } = data.globalTotals;
                    if (totalCalls > 0) {
                      neonCost = neonCost * (selectedOrgCalls / totalCalls);
                    } else {
                      neonCost = 0;
                    }
                  }
                  if (neonCost > 0) {
                    costs.push(`Neon: $${neonCost.toFixed(4)}`);
                  }
                  return costs.length > 0 ? costs.join(' | ') : 'No costs yet';
                })()
              }
              icon={<DollarOutlined style={{ fontSize: 24, color: theme.palette.success.main }} />}
              color="success"
              loading={loading || neonLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard
              title="Gemini Tokens"
              value={(data?.summary?.totalTokens || 0).toLocaleString()}
              subtitle={`In: ${(data?.summary?.totalInputTokens || 0).toLocaleString()} / Out: ${(data?.summary?.totalOutputTokens || 0).toLocaleString()}`}
              icon={<FireOutlined style={{ fontSize: 24, color: providerColors.gemini }} />}
              color="secondary"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard
              title="Top Provider"
              value={providerLabels[data?.summary?.topProvider] || '-'}
              subtitle="Most used service"
              icon={<ThunderboltOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />}
              color="warning"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard
              title="Top Organization"
              value={data?.summary?.topOrganization || '-'}
              subtitle="Highest usage"
              icon={<BankOutlined style={{ fontSize: 24, color: theme.palette.info.main }} />}
              color="info"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Neon Database Usage - Show when no filter or "neon" filter selected */}
        {(!providerFilter || providerFilter === 'neon') && (
          <Box sx={{ mb: 3 }}>
            <NeonUsageCard
              data={neonData}
              loading={neonLoading}
              proportionalShare={(() => {
                // Calculate proportional share when org filter is active using global totals
                if (!organizationFilter) return 1;
                if (data?.globalTotals) {
                  const { totalCalls, selectedOrgCalls } = data.globalTotals;
                  if (totalCalls === 0) return 0;
                  return selectedOrgCalls / totalCalls;
                }
                return 0;
              })()}
              organizationName={(() => {
                if (!organizationFilter) return null;
                const org = organizations.find(o => o.id === organizationFilter);
                return org?.title || null;
              })()}
            />
          </Box>
        )}

        {/* Resend Email Service Usage - Show when no filter or "resend" filter selected */}
        {(!providerFilter || providerFilter === 'resend') && (
          <Box sx={{ mb: 3 }}>
            <ResendUsageCard
              data={resendData}
              loading={resendLoading}
              proportionalShare={(() => {
                // Calculate proportional share when org filter is active using global totals
                if (!organizationFilter) return 1;
                if (data?.globalTotals) {
                  const { totalCalls, selectedOrgCalls } = data.globalTotals;
                  if (totalCalls === 0) return 0;
                  return selectedOrgCalls / totalCalls;
                }
                return 0;
              })()}
              organizationName={(() => {
                if (!organizationFilter) return null;
                const org = organizations.find(o => o.id === organizationFilter);
                return org?.title || null;
              })()}
            />
          </Box>
        )}

        {/* Google Maps API Usage - Show when no filter or "maps" filter selected */}
        {(!providerFilter || providerFilter === 'maps') && (
          <Box sx={{ mb: 3 }}>
            <MapsUsageCard
              data={mapsData}
              loading={mapsLoading}
              proportionalShare={(() => {
                // Calculate proportional share when org filter is active using global totals
                if (!organizationFilter) return 1;
                if (data?.globalTotals) {
                  const { totalCalls, selectedOrgCalls } = data.globalTotals;
                  if (totalCalls === 0) return 0;
                  return selectedOrgCalls / totalCalls;
                }
                return 0;
              })()}
              organizationName={(() => {
                if (!organizationFilter) return null;
                const org = organizations.find(o => o.id === organizationFilter);
                return org?.title || null;
              })()}
            />
          </Box>
        )}

        {/* API Stats - Hide when "neon", "resend", or "maps" filter is selected */}
        {providerFilter !== 'neon' && providerFilter !== 'resend' && providerFilter !== 'maps' && (
          <>
            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <CostByOrgChart
                  data={data?.topOrganizations || []}
                  totalCost={(() => {
                    // Calculate proportional Neon cost when org filter is active
                    let neonCostValue = neonData?.costs?.total || 0;
                    if (organizationFilter && data?.globalTotals) {
                      const { totalCalls, selectedOrgCalls } = data.globalTotals;
                      if (totalCalls > 0) {
                        neonCostValue = neonCostValue * (selectedOrgCalls / totalCalls);
                      } else {
                        neonCostValue = 0;
                      }
                    }
                    return (data?.summary?.totalCost || 0) + neonCostValue;
                  })()}
                  neonCost={neonData?.costs?.total || 0}
                  globalTotals={data?.globalTotals || null}
                  loading={loading || neonLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ProviderBreakdown data={data?.byProvider || []} loading={loading} />
              </Grid>
            </Grid>

            {/* Organizations Table - Full Width */}
            <Box sx={{ mb: 3 }}>
              <OrganizationsTable
                data={data?.topOrganizations || []}
                neonCost={neonData?.costs?.total || 0}
                resendCost={resendData?.costs?.estimated || 0}
                mapsCost={mapsData?.metrics?.totalCost || 0}
                globalTotals={data?.globalTotals || null}
                loading={loading || neonLoading || resendLoading || mapsLoading}
              />
            </Box>

            {/* Users Table - Full Width */}
            <UsersTable data={data?.topUsers || []} loading={loading} />
          </>
        )}
      </Container>
    </Page>
  );
};

InternalUsagePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalUsagePage;
