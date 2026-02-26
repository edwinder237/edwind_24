import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Collapse,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  Event as EventIcon,
  PlayArrow as PlayArrowIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import FieldChangesDiff from './FieldChangesDiff';

// Action type colors and icons
const actionConfig = {
  create: { color: 'success', icon: AddIcon, label: 'Created' },
  update: { color: 'info', icon: EditIcon, label: 'Updated' },
  delete: { color: 'error', icon: DeleteIcon, label: 'Deleted' },
  publish: { color: 'secondary', icon: PublishIcon, label: 'Published' },
  delivery_started: { color: 'warning', icon: LockIcon, label: 'Delivery Started' },
};

// Entity type labels
const entityLabels = {
  course: 'Course',
  module: 'Module',
  activity: 'Activity',
  event: 'Event',
};

// Version bump type colors
const versionBumpColors = {
  major: 'error',
  minor: 'warning',
  patch: 'info',
};

const AuditLogEntry = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  const action = actionConfig[entry.actionType] || actionConfig.update;
  const ActionIcon = action.icon;
  const entityLabel = entityLabels[entry.entityType] || entry.entityType;

  const hasChanges = entry.fieldChanges && Object.keys(entry.fieldChanges).length > 0;
  const changedAt = new Date(entry.changedAt);

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:hover': {
          borderColor: 'primary.light',
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* User Avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {getInitials(entry.changedByName)}
        </Avatar>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600 }}>
              {entry.changedByName || 'Unknown User'}
            </Typography>

            <Chip
              icon={<ActionIcon sx={{ fontSize: '1rem !important' }} />}
              label={action.label}
              size="small"
              color={action.color}
              sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
            />

            <Typography variant="body2" color="text.secondary">
              {entityLabel}
            </Typography>

            {entry.versionBumpType && (
              <Chip
                label={`${entry.previousVersion || '0.0.0'} → ${entry.newVersion}`}
                size="small"
                color={versionBumpColors[entry.versionBumpType] || 'default'}
                variant="outlined"
                sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
              />
            )}
          </Box>

          {/* Timestamp */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {formatDistanceToNow(changedAt, { addSuffix: true })} ({format(changedAt, 'MMM d, yyyy h:mm a')})
          </Typography>

          {/* Metadata (title, reason, etc.) */}
          {entry.metadata && (
            <Stack spacing={0.5} sx={{ mb: 1 }}>
              {entry.metadata.title && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Title:</strong> {entry.metadata.title}
                </Typography>
              )}
              {entry.metadata.deletedTitle && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Deleted:</strong> {entry.metadata.deletedTitle}
                </Typography>
              )}
              {/* Event-specific metadata */}
              {entry.metadata.start && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Scheduled:</strong> {format(new Date(entry.metadata.start), 'MMM d, yyyy h:mm a')}
                  {entry.metadata.end && ` - ${format(new Date(entry.metadata.end), 'h:mm a')}`}
                </Typography>
              )}
              {entry.metadata.deliveryMode && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Delivery:</strong> {entry.metadata.deliveryMode.replace('_', ' ')}
                </Typography>
              )}
              {entry.metadata.moduleTitle && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Module:</strong> {entry.metadata.moduleTitle}
                </Typography>
              )}
              {entry.metadata.projectTitle && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Project:</strong> {entry.metadata.projectTitle}
                </Typography>
              )}
              {entry.metadata.message && (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                  {entry.metadata.message}
                </Typography>
              )}
            </Stack>
          )}

          {/* Expandable Field Changes */}
          {hasChanges && (
            <>
              <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  color: 'primary.main',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <Typography variant="body2">
                  {Object.keys(entry.fieldChanges).length} field(s) changed
                </Typography>
                <IconButton size="small" sx={{ p: 0 }}>
                  {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              <Collapse in={expanded}>
                <Divider sx={{ my: 1.5 }} />
                <FieldChangesDiff changes={entry.fieldChanges} />
              </Collapse>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default AuditLogEntry;
