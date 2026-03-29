import {
  Typography,
  Stack,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
  Tooltip,
  Box,
  LinearProgress
} from '@mui/material';
import { MailOutlined } from '@ant-design/icons';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import axios from 'utils/axios';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import AppTable from 'components/AppTable';

// Email type display config
const EMAIL_TYPE_CONFIG = {
  credentials: { label: 'Credentials', color: 'primary' },
  event_access: { label: 'Event Access', color: 'success' },
  module_link: { label: 'Module Link', color: 'info' },
  survey: { label: 'Survey', color: 'warning' },
  calendar_invite: { label: 'Calendar Invite', color: 'secondary' }
};

const STATUS_CONFIG = {
  sent: { label: 'Sent', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  skipped: { label: 'Skipped', color: 'warning' }
};

const DELIVERY_CONFIG = {
  delivered: { label: 'Delivered', color: 'success' },
  bounced: { label: 'Bounced', color: 'error' },
  complained: { label: 'Spam', color: 'error' },
  delayed: { label: 'Delayed', color: 'warning' },
  opened: { label: 'Opened', color: 'info' },
  clicked: { label: 'Clicked', color: 'info' }
};

// ==============================|| COMMUNICATIONS - EMAIL LOG ||============================== //

const Communications = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAnyEmails, setHasAnyEmails] = useState(null); // null = unknown, true/false after first load
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [emailUsage, setEmailUsage] = useState(null);

  // Filters
  const [emailTypeFilter, setEmailTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchEmails = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, pageSize: 50 };
      if (emailTypeFilter) params.emailType = emailTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (deliveryFilter) params.deliveryStatus = deliveryFilter;
      if (searchFilter) params.search = searchFilter;

      const response = await axios.get('/api/communications/email-log', { params });
      setEmails(response.data.emails || []);
      if (response.data.emailUsage) setEmailUsage(response.data.emailUsage);
      const pag = response.data.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 0 };
      setPagination(pag);
      // On first unfiltered load, track whether any emails exist at all
      if (hasAnyEmails === null && !emailTypeFilter && !statusFilter && !deliveryFilter && !searchFilter) {
        setHasAnyEmails(pag.total > 0);
      } else if (pag.total > 0) {
        setHasAnyEmails(true);
      }
    } catch (err) {
      console.error('Error fetching email log:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [emailTypeFilter, statusFilter, deliveryFilter, searchFilter]);

  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  const columns = useMemo(() => [
    {
      Header: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }) => {
        if (!value) return '—';
        try {
          const date = new Date(value);
          return (
            <Tooltip title={format(date, 'PPpp')}>
              <Typography variant="body2" noWrap>
                {format(date, 'MMM d, yyyy HH:mm')}
              </Typography>
            </Tooltip>
          );
        } catch {
          return '—';
        }
      }
    },
    {
      Header: 'Recipient',
      accessor: 'recipientEmail',
      Cell: ({ row }) => (
        <Box>
          {row.original.recipientName && (
            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
              {row.original.recipientName}
            </Typography>
          )}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <MailOutlined style={{ fontSize: '12px', color: '#999' }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
              {row.original.recipientEmail}
            </Typography>
          </Stack>
        </Box>
      )
    },
    {
      Header: 'Subject',
      accessor: 'subject',
      Cell: ({ value }) => (
        <Tooltip title={value || ''}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
            {value || '—'}
          </Typography>
        </Tooltip>
      )
    },
    {
      Header: 'Type',
      accessor: 'emailType',
      Cell: ({ value }) => {
        const config = EMAIL_TYPE_CONFIG[value] || { label: value, color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
      }
    },
    {
      Header: 'Status',
      accessor: 'status',
      className: 'cell-center',
      Cell: ({ value }) => {
        const config = STATUS_CONFIG[value] || { label: value, color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" variant="filled" />;
      }
    },
    {
      Header: 'Delivery',
      accessor: 'deliveryStatus',
      className: 'cell-center',
      Cell: ({ value }) => {
        if (!value) return <Chip label="Pending" size="small" variant="outlined" />;
        const config = DELIVERY_CONFIG[value] || { label: value, color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" variant="filled" />;
      }
    },
    {
      Header: 'Project',
      accessor: 'projectTitle',
      Cell: ({ value }) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
          {value || '—'}
        </Typography>
      )
    },
    {
      Header: 'Sent By',
      accessor: 'sentByUserName',
      Cell: ({ value }) => (
        <Typography variant="body2" noWrap>
          {value || '—'}
        </Typography>
      )
    }
  ], []);

  return (
    <Page title="Email Log">
      <Typography variant="body1" sx={{ mb: 3 }}>
        View all emails sent by your organization, including credentials, calendar invites, surveys, and more.
      </Typography>

      {/* Monthly email usage */}
      {emailUsage && (
        <MainCard sx={{ mb: 3, p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} flexWrap="wrap" useFlexGap>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" gutterBottom>
                Monthly Email Usage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {emailUsage.limit === -1
                  ? `${emailUsage.used.toLocaleString()} emails sent this month (Unlimited)`
                  : `${emailUsage.used.toLocaleString()} of ${emailUsage.limit.toLocaleString()} emails used this month`}
              </Typography>
            </Box>
            {emailUsage.limit !== -1 && (
              <Box sx={{ minWidth: 200, flexGrow: 1, maxWidth: 360 }}>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {emailUsage.available.toLocaleString()} remaining
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((emailUsage.used / emailUsage.limit) * 100, 100)}
                  color={
                    emailUsage.used / emailUsage.limit >= 0.9 ? 'error'
                    : emailUsage.used / emailUsage.limit >= 0.75 ? 'warning'
                    : 'primary'
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
            {emailUsage.planName && (
              <Chip label={emailUsage.planName} size="small" variant="outlined" />
            )}
          </Stack>
        </MainCard>
      )}

      {/* Loading state */}
      {loading && hasAnyEmails === null && (
        <MainCard>
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading email log...</Typography>
          </Stack>
        </MainCard>
      )}

      {/* Empty state — no emails have ever been sent */}
      {!loading && hasAnyEmails === false && (
        <MainCard>
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8, px: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <MailOutlined style={{ fontSize: 36, color: 'inherit' }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              No emails sent yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
              When your organization sends emails — credentials, calendar invites, surveys, or module links — they will appear here.
            </Typography>
          </Stack>
        </MainCard>
      )}

      {/* Data table — shown once we know emails exist (or filters are active) */}
      {(hasAnyEmails || emailTypeFilter || statusFilter || deliveryFilter || searchFilter) && (
        <MainCard content={false}>
          {/* Filter bar */}
          <Stack direction="row" spacing={2} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }} flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              label="Type"
              value={emailTypeFilter}
              onChange={(e) => setEmailTypeFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(EMAIL_TYPE_CONFIG).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Delivery"
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Delivery</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              {Object.entries(DELIVERY_CONFIG).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Search recipient or subject"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              sx={{ minWidth: 250 }}
            />
          </Stack>

          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : emails.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <Typography variant="body1" color="text.secondary">
                No emails match your filters
              </Typography>
            </Stack>
          ) : (
            <ScrollX>
              <AppTable
                columns={columns}
                data={emails}
                showAddButton={false}
                initialSortBy={{ id: 'createdAt', desc: true }}
                initialHiddenColumns={['sentByUserName']}
                responsiveHiddenColumns={['deliveryStatus', 'projectTitle', 'sentByUserName']}
                csvFilename="email-log.csv"
                emptyMessage="No emails found"
                showRowSelection={false}
                showPagination={true}
                showGlobalFilter={true}
                showCSVExport={true}
                showSorting={true}
                showColumnToggle={true}
              />
            </ScrollX>
          )}

          {/* Server-side pagination controls */}
          {!loading && pagination.totalPages > 1 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} emails
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Previous"
                  variant="outlined"
                  size="small"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchEmails(pagination.page - 1)}
                  sx={{ cursor: pagination.page > 1 ? 'pointer' : 'default' }}
                />
                <Chip
                  label={`Page ${pagination.page} of ${pagination.totalPages}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label="Next"
                  variant="outlined"
                  size="small"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchEmails(pagination.page + 1)}
                  sx={{ cursor: pagination.page < pagination.totalPages ? 'pointer' : 'default' }}
                />
              </Stack>
            </Stack>
          )}
        </MainCard>
      )}
    </Page>
  );
};

Communications.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Communications;
