import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  FlagOutlined,
  DownOutlined,
  UpOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { format, parseISO, differenceInDays, isPast, isToday, isFuture, isWithinInterval, addDays } from 'date-fns';
import { projectionTypes } from 'data/mockData';

// Icon mapping
const iconMap = {
  RocketOutlined: RocketOutlined,
  TeamOutlined: TeamOutlined,
  ThunderboltOutlined: ThunderboltOutlined,
  FileSearchOutlined: FileSearchOutlined,
  PlayCircleOutlined: PlayCircleOutlined,
  SafetyCertificateOutlined: SafetyCertificateOutlined,
  FlagOutlined: FlagOutlined
};

// ==============================|| PROJECT PROJECTIONS COMPONENT ||============================== //

const ProjectProjections = ({
  projects = [],
  showExpanded = true,
  onProjectionClick,
  selectedProjectId = null
}) => {
  const [expanded, setExpanded] = useState(showExpanded);

  // Get projection type info
  const getProjectionTypeInfo = (type) => {
    return projectionTypes.find(pt => pt.id === type) || projectionTypes.find(pt => pt.id === 'custom');
  };

  // Get status for a projection date
  const getProjectionStatus = (dateStr) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const daysUntil = differenceInDays(date, today);

    if (isPast(date) && !isToday(date)) {
      return { status: 'overdue', label: 'Overdue', color: 'error', daysUntil };
    } else if (isToday(date)) {
      return { status: 'today', label: 'Today', color: 'warning', daysUntil: 0 };
    } else if (daysUntil <= 7) {
      return { status: 'upcoming', label: `${daysUntil} days`, color: 'warning', daysUntil };
    } else if (daysUntil <= 30) {
      return { status: 'soon', label: `${daysUntil} days`, color: 'info', daysUntil };
    } else {
      return { status: 'future', label: `${daysUntil} days`, color: 'default', daysUntil };
    }
  };

  // Collect all projections from all projects
  const allProjections = useMemo(() => {
    const projections = [];

    projects.forEach(project => {
      if (project.projections && project.projections.length > 0) {
        project.projections.forEach(proj => {
          const typeInfo = getProjectionTypeInfo(proj.type);
          const statusInfo = getProjectionStatus(proj.date);

          projections.push({
            ...proj,
            projectId: project.id,
            projectName: project.name,
            projectColor: project.color,
            projectStatus: project.status,
            typeInfo,
            statusInfo,
            dateObj: parseISO(proj.date)
          });
        });
      }
    });

    // Sort by date (closest first)
    return projections.sort((a, b) => a.dateObj - b.dateObj);
  }, [projects]);

  // Filter projections based on selected project or get upcoming ones
  const displayProjections = useMemo(() => {
    if (selectedProjectId) {
      return allProjections.filter(p => p.projectId === selectedProjectId);
    }
    // Show upcoming projections (next 90 days) and overdue ones
    const today = new Date();
    const cutoffDate = addDays(today, 90);
    return allProjections.filter(p => {
      return isPast(p.dateObj) || isWithinInterval(p.dateObj, { start: today, end: cutoffDate });
    });
  }, [allProjections, selectedProjectId]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: displayProjections.length,
      overdue: displayProjections.filter(p => isPast(p.dateObj) && !isToday(p.dateObj)).length,
      thisWeek: displayProjections.filter(p => {
        const daysUntil = differenceInDays(p.dateObj, today);
        return daysUntil >= 0 && daysUntil <= 7;
      }).length,
      upcoming: displayProjections.filter(p => isFuture(p.dateObj)).length
    };
  }, [displayProjections]);

  // Get icon component
  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || FlagOutlined;
    return IconComponent;
  };

  return (
    <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'grey.50',
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CalendarOutlined style={{ fontSize: 20, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Project Projections & Milestones
          </Typography>

          {/* Quick Stats Badges */}
          <Stack direction="row" spacing={1}>
            {stats.overdue > 0 && (
              <Chip
                size="small"
                color="error"
                label={`${stats.overdue} Overdue`}
                icon={<WarningOutlined />}
              />
            )}
            {stats.thisWeek > 0 && (
              <Chip
                size="small"
                color="warning"
                label={`${stats.thisWeek} This Week`}
                icon={<ClockCircleOutlined />}
              />
            )}
            <Chip
              size="small"
              variant="outlined"
              label={`${stats.total} Total`}
            />
          </Stack>
        </Stack>

        <IconButton size="small">
          {expanded ? <UpOutlined /> : <DownOutlined />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {displayProjections.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FlagOutlined style={{ fontSize: 48, color: '#bdbdbd' }} />
              <Typography color="textSecondary" sx={{ mt: 1 }}>
                No projections or milestones scheduled
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>Milestone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayProjections.map((projection, index) => {
                    const IconComponent = getIconComponent(projection.typeInfo?.icon);

                    return (
                      <TableRow
                        key={`${projection.projectId}-${projection.id}`}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: onProjectionClick ? 'pointer' : 'default',
                          bgcolor: projection.statusInfo.status === 'overdue' ? 'error.lighter' : 'inherit'
                        }}
                        onClick={() => onProjectionClick && onProjectionClick(projection)}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: projection.typeInfo?.color || '#95a5a6',
                                fontSize: 14
                              }}
                            >
                              <IconComponent style={{ fontSize: 14 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {projection.label}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {projection.typeInfo?.label}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: projection.projectColor
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {projection.projectName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {format(projection.dateObj, 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(projection.dateObj, 'EEEE')}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            color={projection.statusInfo.color}
                            label={projection.statusInfo.label}
                            icon={
                              projection.statusInfo.status === 'overdue' ? <WarningOutlined /> :
                              projection.statusInfo.status === 'today' ? <ClockCircleOutlined /> :
                              <CheckCircleOutlined />
                            }
                            sx={{
                              minWidth: 80,
                              '& .MuiChip-icon': { fontSize: 12 }
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Tooltip title={projection.notes || 'No notes'}>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {projection.notes || '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

ProjectProjections.propTypes = {
  projects: PropTypes.array,
  showExpanded: PropTypes.bool,
  onProjectionClick: PropTypes.func,
  selectedProjectId: PropTypes.string
};

export default ProjectProjections;
