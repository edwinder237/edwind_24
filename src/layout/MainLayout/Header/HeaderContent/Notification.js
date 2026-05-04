import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popper,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';
import {
  useGetNotificationsQuery,
  useSyncNotificationsMutation,
  useMarkNotificationReadMutation,
} from 'store/api/notificationApi';

// assets
import {
  BellOutlined,
  CloseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const TYPE_ICONS = {
  PROJECT_OVERDUE: <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />,
  PROJECT_ASSIGNED: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />,
  DEFAULT: <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ==============================|| HEADER CONTENT - NOTIFICATIONS ||============================== //

const Notification = () => {
  const theme = useTheme();
  const router = useRouter();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { data } = useGetNotificationsQuery(
    { page: 1, limit: 20 },
    { pollingInterval: 300000 } // 5 minutes
  );
  const [syncNotifications] = useSyncNotificationsMutation();
  const [markRead] = useMarkNotificationReadMutation();

  // Sync on mount (idempotent)
  useEffect(() => {
    syncNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markRead({ id: notification.id });
    }
    // Navigate to referenced entity
    if (notification.referenceType === 'project' && notification.referenceId) {
      router.push(`/projects/${notification.referenceId}`);
    }
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    markRead({ all: true });
  };

  const iconBackColorOpen = theme.palette.mode === 'dark' ? 'grey.200' : 'grey.300';
  const iconBackColor = theme.palette.mode === 'dark' ? 'background.default' : 'grey.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{ color: 'text.primary', bgcolor: open ? iconBackColorOpen : iconBackColor }}
        aria-label="open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <BellOutlined />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [matchesXs ? -60 : 0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: '100%',
                minWidth: 285,
                maxWidth: 420,
                bgcolor: theme.palette.background.paper,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 285
                }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Notifications"
                  elevation={0}
                  border={false}
                  content={false}
                  sx={{ bgcolor: 'background.paper' }}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllRead}>
                          Mark All Read
                        </Button>
                      )}
                      <IconButton size="small" onClick={handleToggle}>
                        <CloseOutlined />
                      </IconButton>
                    </Stack>
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      maxHeight: 400,
                      overflow: 'auto',
                      '& .MuiListItemButton-root': {
                        py: 1.5,
                        '& .MuiListItemAvatar-root': { minWidth: 40 },
                      }
                    }}
                  >
                    {notifications.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleOutlined style={{ fontSize: 32, color: theme.palette.success.main }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          No notifications
                        </Typography>
                      </Box>
                    ) : (
                      notifications.map((n, index) => (
                        <Box key={n.id}>
                          {index > 0 && <Divider />}
                          <ListItemButton
                            onClick={() => handleNotificationClick(n)}
                            sx={{
                              bgcolor: n.isRead
                                ? 'transparent'
                                : theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.04)'
                                  : 'grey.50',
                            }}
                          >
                            <ListItemAvatar sx={{ mt: 0.5, minWidth: 40 }}>
                              {TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ fontWeight: n.isRead ? 400 : 600 }}
                                >
                                  {n.message}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {timeAgo(n.createdAt)}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </Box>
                      ))
                    )}
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

export default Notification;
