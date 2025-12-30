import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Chip, Collapse, IconButton, Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';

// project imports
import Layout from "layout";
import Page from "components/Page";
import { useDispatch } from "store";
import { refreshUser } from "store/reducers/user";

import ProjectsList from "sections/apps/project-manager/projects-list/ProjectsList";

// ==============================|| DEBUG CLAIMS DISPLAY ||============================== //

function DebugClaimsDisplay() {
  const dispatch = useDispatch();
  const [claimsData, setClaimsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchClaimsData = () => {
    fetch('/api/auth/debug-claims')
      .then(res => res.json())
      .then(data => {
        setClaimsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching claims:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaimsData();
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent duplicate calls

    setRefreshing(true);
    try {
      // Dispatch Redux action to refresh user from WorkOS
      await dispatch(refreshUser()).unwrap();

      // Reload claims data after successful refresh
      fetchClaimsData();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Successfully synced with WorkOS',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setSnackbar({
        open: true,
        message: error.error || 'Failed to sync with WorkOS',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2">Loading WorkOS info...</Typography>
      </Paper>
    );
  }

  if (!claimsData || !claimsData.authenticated) {
    return null;
  }

  return (
    <>
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ color: '#000' }}>
            🔐 WorkOS Debug Info (TEMPORARY)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                textTransform: 'none',
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  borderColor: '#f57c00',
                  bgcolor: 'rgba(255, 152, 0, 0.04)'
                }
              }}
            >
              {refreshing ? 'Syncing...' : 'Refresh with WorkOS'}
            </Button>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

      <Collapse in={expanded}>
        {/* User Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>User:</Typography>
          <Typography variant="body2" sx={{ color: '#000' }}>Email: {claimsData.user?.email}</Typography>
          <Typography variant="body2" sx={{ color: '#000' }}>User ID: {claimsData.user?.userId}</Typography>
          <Typography variant="body2" sx={{ color: '#000' }}>WorkOS User ID: {claimsData.user?.workosUserId}</Typography>
          {claimsData.user?.role && (
            <Typography variant="body2" sx={{ color: '#000' }}>Role: {claimsData.user?.role}</Typography>
          )}
          {claimsData.user?.organizationName && (
            <Typography variant="body2" sx={{ color: '#000' }}>Organization: {claimsData.user?.organizationName}</Typography>
          )}
          {claimsData.user?.subOrganizationName && (
            <Typography variant="body2" sx={{ color: '#000' }}>Sub-Organization: {claimsData.user?.subOrganizationName}</Typography>
          )}
        </Box>

        {/* JWT Permissions */}
        {claimsData.jwtPermissions && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
              🔑 WorkOS Permissions (from JWT Token):
            </Typography>
            <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
              Role: {claimsData.jwtPermissions.roleSlug} ({claimsData.jwtPermissions.permissionCount} permissions)
            </Typography>
            {claimsData.jwtPermissions.permissions && claimsData.jwtPermissions.permissions.length > 0 ? (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {claimsData.jwtPermissions.permissions.map((perm, i) => (
                  <Chip
                    key={i}
                    label={perm}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                No permissions found in WorkOS role
              </Typography>
            )}
          </Box>
        )}

        {/* Cache Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>Cache:</Typography>
          <Typography variant="body2" sx={{ color: '#000' }}>
            Type: {claimsData.cacheType}
            {claimsData.cacheConnected ? ' ✅' : ' ❌'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#000' }}>
            Expires in: {claimsData.claimsInfo?.expiresInMinutes} minutes
          </Typography>
        </Box>

        {/* Organizations */}
        {claimsData.organizations && claimsData.organizations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
              Organizations ({claimsData.organizations.length}):
            </Typography>
            {claimsData.organizations.map((org, index) => (
              <Paper key={index} sx={{ p: 1.5, mb: 1.5, bgcolor: '#f5f5f5' }}>
                {/* Organization Header with Role */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                      {org.orgTitle || 'Unknown Organization'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                      ID: {org.orgId?.slice(0, 8)}...
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={org.role}
                      color="primary"
                      size="medium"
                      sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                    />
                    <Chip
                      label={org.status}
                      color={org.status === 'active' ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 0.5 }}
                    />
                  </Box>
                </Box>

                {/* Access Summary */}
                <Box sx={{
                  mt: 1.5,
                  p: 1,
                  bgcolor: org.subOrgCount > 0 ? '#e8f5e9' : '#ffebee',
                  borderRadius: 1,
                  border: org.subOrgCount > 0 ? '1px solid #4caf50' : '1px solid #f44336'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000', mb: 0.5 }}>
                    Access as {org.role}:
                  </Typography>
                  {org.subOrganizations && org.subOrganizations.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {org.subOrganizations.map((subOrg, i) => (
                        <Chip
                          key={i}
                          label={typeof subOrg === 'object' ? subOrg.title : subOrg}
                          size="small"
                          color="success"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 500, fontSize: '0.8rem' }}>
                      ⚠️ No sub-organizations assigned - user cannot access any data in this organization
                    </Typography>
                  )}
                </Box>

                {/* Permissions */}
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000', fontSize: '0.75rem' }}>
                    Permissions ({org.permissionCount}):
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {org.permissions.map((perm, i) => (
                      <Chip
                        key={i}
                        label={perm}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', color: '#000', borderColor: '#999' }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Summary */}
        {claimsData.summary && (
          <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>Summary:</Typography>
            <Typography variant="body2" sx={{ color: '#000' }}>Total Organizations: {claimsData.summary.totalOrganizations}</Typography>
            <Typography variant="body2" sx={{ color: '#000' }}>Total Unique Permissions (Local): {claimsData.summary.totalPermissions}</Typography>
            {claimsData.summary.jwtPermissionCount !== undefined && (
              <Typography variant="body2" sx={{ color: '#000' }}>JWT Permissions: {claimsData.summary.jwtPermissionCount}</Typography>
            )}
            <Typography variant="body2" sx={{ color: '#000' }}>Total Sub-Organizations: {claimsData.summary.totalSubOrganizations}</Typography>
            <Typography variant="body2" sx={{ color: '#000' }}>Roles: {claimsData.summary.roles.join(', ')}</Typography>
          </Box>
        )}
      </Collapse>
    </Paper>

    {/* Success/Error Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
  );
}

// ==============================|| PROJECTS PAGE ||============================== //

function Projects() {
  // ProjectsList component handles its own data loading
  return (
    <Page title="Projects">
      <DebugClaimsDisplay />
      <ProjectsList />
    </Page>
  );
}

Projects.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Projects;
