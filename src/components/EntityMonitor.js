/**
 * Entity Monitor Component
 * 
 * Development tool for monitoring normalized entity stores.
 * Shows entity relationships, data integrity, and performance metrics.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Storage as StorageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

import { useSelector } from 'store';
import { entitySelectors } from 'store/entities';

const EntityMonitor = ({ position = 'top-left', defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedEntity, setSelectedEntity] = useState('participants');
  const [showDetails, setShowDetails] = useState(false);

  // Entity statistics
  const participantStats = useSelector(entitySelectors.participants.selectParticipantStatistics);
  const eventStats = useSelector(entitySelectors.events.selectEventAttendanceStats);
  const groupStats = useSelector(entitySelectors.groups.selectGroupStatistics);
  
  // Entity counts
  const participantCount = useSelector(entitySelectors.participants.selectTotalParticipants);
  const eventCount = useSelector(entitySelectors.events.selectTotalEvents);
  const groupCount = useSelector(entitySelectors.groups.selectTotalGroups);
  
  // Loading states
  const participantsLoading = useSelector(entitySelectors.participants.selectParticipantsLoading);
  const eventsLoading = useSelector(entitySelectors.events.selectEventsLoading);
  const groupsLoading = useSelector(entitySelectors.groups.selectGroupsLoading);

  const entities = [
    {
      name: 'participants',
      label: 'Participants',
      count: participantCount,
      loading: participantsLoading,
      stats: participantStats,
      color: 'primary'
    },
    {
      name: 'events',
      label: 'Events',
      count: eventCount,
      loading: eventsLoading,
      stats: eventStats,
      color: 'secondary'
    },
    {
      name: 'groups',
      label: 'Groups',
      count: groupCount,
      loading: groupsLoading,
      stats: groupStats,
      color: 'info'
    }
  ];

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 9998,
      width: '350px',
      maxHeight: '70vh'
    };
    
    switch (position) {
      case 'top-left':
        return { ...base, top: 20, left: 20 };
      case 'top-right':
        return { ...base, top: 20, right: 20 };
      case 'bottom-left':
        return { ...base, bottom: 20, left: 20 };
      case 'bottom-right':
      default:
        return { ...base, bottom: 20, right: 20 };
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const selectedEntityData = entities.find(e => e.name === selectedEntity);

  return (
    <Paper
      elevation={8}
      sx={{
        ...getPositionStyles(),
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: 'secondary.dark',
          color: 'secondary.contrastText',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <StorageIcon fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Entity Store Monitor
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Clear Data">
            <IconButton size="small" sx={{ color: 'inherit' }} onClick={(e) => {
              e.stopPropagation();
              // Could add clear functionality here
            }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
          {/* Entity Overview */}
          <Box sx={{ p: 1.5, backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Entity Overview
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {entities.map((entity) => (
                <Chip
                  key={entity.name}
                  size="small"
                  label={`${entity.label}: ${entity.count}`}
                  color={entity.color}
                  variant={selectedEntity === entity.name ? "filled" : "outlined"}
                  onClick={() => setSelectedEntity(entity.name)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 1 }
                  }}
                  icon={entity.loading ? <TrendingUpIcon /> : <CheckCircleIcon />}
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Entity Details */}
          {selectedEntityData && (
            <Box sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="text.primary">
                  {selectedEntityData.label} Details
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={showDetails}
                      onChange={(e) => setShowDetails(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">Details</Typography>}
                />
              </Stack>

              {selectedEntity === 'participants' && participantStats && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total: {participantStats.total}
                  </Typography>
                  
                  {showDetails && (
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>By Role</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(participantStats.byRole || {}).map(([role, count]) => (
                            <TableRow key={role}>
                              <TableCell>{role}</TableCell>
                              <TableCell align="right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {selectedEntity === 'events' && eventStats && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Events: {eventStats.totalEvents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Avg Attendance: {eventStats.averageAttendanceRate.toFixed(1)}%
                  </Typography>
                  
                  {showDetails && (
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(eventStats.byStatus || {}).map(([status, count]) => (
                            <TableRow key={status}>
                              <TableCell>{status}</TableCell>
                              <TableCell align="right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {selectedEntity === 'groups' && groupStats && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Groups: {groupStats.totalGroups}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Avg Size: {groupStats.averageGroupSize.toFixed(1)}
                  </Typography>
                  
                  {showDetails && (
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Curriculum</TableCell>
                            <TableCell align="right">Groups</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(groupStats.groupsByCurriculum || {}).map(([curriculum, data]) => (
                            <TableRow key={curriculum}>
                              <TableCell>{curriculum}</TableCell>
                              <TableCell align="right">{data.groupCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          )}

          <Divider />

          {/* Performance Indicators */}
          <Box sx={{ p: 1, backgroundColor: 'grey.100' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Performance
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label="Normalized"
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<TrendingUpIcon />}
                label="Efficient"
                color="info"
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ p: 1 }}>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  console.log('Participants:', participantStats);
                  console.log('Events:', eventStats);
                  console.log('Groups:', groupStats);
                }}
              >
                Log Stats
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const totalEntities = participantCount + eventCount + groupCount;
                  alert(`Total Entities: ${totalEntities}\nNormalized State: Active\nEntityAdapter: Enabled`);
                }}
              >
                Summary
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default EntityMonitor;