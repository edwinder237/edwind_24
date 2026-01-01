import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import { Box, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Stack, Switch, Typography } from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { BellOutlined, MailOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';

// ==============================|| TAB - SETTINGS ||============================== //

const TabSettings = () => {
  const dispatch = useDispatch();
  const { user, fetchProfile, updateProfile, profileLoading } = useUser();
  const [settings, setSettings] = useState({
    emailOnProjectUpdate: true,
    emailOnNewParticipant: true,
    emailOnEventReminder: true,
    emailOnReportReady: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from profile
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await fetchProfile();
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [fetchProfile]);

  // Update local state when user data loads
  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings({
        emailOnProjectUpdate: user.notificationSettings.emailOnProjectUpdate ?? true,
        emailOnNewParticipant: user.notificationSettings.emailOnNewParticipant ?? true,
        emailOnEventReminder: user.notificationSettings.emailOnEventReminder ?? true,
        emailOnReportReady: user.notificationSettings.emailOnReportReady ?? false
      });
    }
  }, [user]);

  const handleToggle = (key) => () => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({
        notificationSettings: settings
      });

      if (result.error) {
        throw new Error(result.payload?.error || 'Failed to save settings');
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Settings saved successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );
      setHasChanges(false);
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: err.message || 'Failed to save settings',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to saved values
    if (user?.notificationSettings) {
      setSettings({
        emailOnProjectUpdate: user.notificationSettings.emailOnProjectUpdate ?? true,
        emailOnNewParticipant: user.notificationSettings.emailOnNewParticipant ?? true,
        emailOnEventReminder: user.notificationSettings.emailOnEventReminder ?? true,
        emailOnReportReady: user.notificationSettings.emailOnReportReady ?? false
      });
    }
    setHasChanges(false);
  };

  if (loading) {
    return (
      <MainCard title="Notification Settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="Notification Settings">
      <List sx={{ '& .MuiListItem-root': { p: 2 } }}>
        <ListItem divider>
          <ListItemIcon sx={{ color: 'primary.main', mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <ProjectOutlined style={{ fontSize: '1.5rem' }} />
          </ListItemIcon>
          <ListItemText
            id="switch-list-label-project"
            primary={<Typography variant="h5">Project Updates</Typography>}
            secondary="Get notified when project status changes or milestones are reached"
          />
          <Switch
            edge="end"
            onChange={handleToggle('emailOnProjectUpdate')}
            checked={settings.emailOnProjectUpdate}
            inputProps={{
              'aria-labelledby': 'switch-list-label-project'
            }}
          />
        </ListItem>
        <ListItem divider>
          <ListItemIcon sx={{ color: 'primary.main', mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <TeamOutlined style={{ fontSize: '1.5rem' }} />
          </ListItemIcon>
          <ListItemText
            id="switch-list-label-participant"
            primary={<Typography variant="h5">New Participants</Typography>}
            secondary="Get notified when new participants join your projects"
          />
          <Switch
            edge="end"
            onChange={handleToggle('emailOnNewParticipant')}
            checked={settings.emailOnNewParticipant}
            inputProps={{
              'aria-labelledby': 'switch-list-label-participant'
            }}
          />
        </ListItem>
        <ListItem divider>
          <ListItemIcon sx={{ color: 'primary.main', mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <BellOutlined style={{ fontSize: '1.5rem' }} />
          </ListItemIcon>
          <ListItemText
            id="switch-list-label-event"
            primary={<Typography variant="h5">Event Reminders</Typography>}
            secondary="Get email reminders before scheduled training events"
          />
          <Switch
            edge="end"
            onChange={handleToggle('emailOnEventReminder')}
            checked={settings.emailOnEventReminder}
            inputProps={{
              'aria-labelledby': 'switch-list-label-event'
            }}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon sx={{ color: 'primary.main', mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <MailOutlined style={{ fontSize: '1.5rem' }} />
          </ListItemIcon>
          <ListItemText
            id="switch-list-label-report"
            primary={<Typography variant="h5">Report Notifications</Typography>}
            secondary="Get notified when reports are generated and ready for review"
          />
          <Switch
            edge="end"
            onChange={handleToggle('emailOnReportReady')}
            checked={settings.emailOnReportReady}
            inputProps={{
              'aria-labelledby': 'switch-list-label-report'
            }}
          />
        </ListItem>
      </List>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={handleCancel} disabled={!hasChanges || saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges || saving || profileLoading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </MainCard>
  );
};

export default TabSettings;
