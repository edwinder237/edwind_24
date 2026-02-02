import { useRef, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  Chip,
  Grid,
  Stack
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  isToday,
  isWeekend,
  parseISO,
  startOfWeek,
  endOfWeek,
  isPast
} from 'date-fns';
import { GlobalOutlined, AppstoreOutlined, EnvironmentOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { projectionTypes } from 'data/mockData';


// ==============================|| GANTT CHART COMPONENT ||============================== //

const GanttChart = ({
  projects = [],
  viewMode = 'month',
  zoomLevel = 100,
  onProjectClick,
  instructors = [],
  scrollToToday = false,
  showProjections = true
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredProject, setHoveredProject] = useState(null);

  // Calculate chart dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(600, projects.length * 95 + 100)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [projects.length]);

  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    const now = new Date();

    if (projects.length === 0) {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    }

    const allDates = projects.flatMap(p => [
      parseISO(p.startDate),
      parseISO(p.endDate)
    ]);

    // Include today in the date range to ensure it's always visible
    allDates.push(now);

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Add padding to the date range based on view mode
    // More padding for day view to show context
    const paddingDays = viewMode === 'day' ? 14 : viewMode === 'week' ? 21 : 30;
    const start = new Date(minDate);
    start.setDate(start.getDate() - paddingDays);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + paddingDays);

    return { start, end };
  }, [projects, viewMode]);

  // Generate timeline headers based on view mode
  const timelineHeaders = useMemo(() => {
    const { start, end } = dateRange;
    
    switch(viewMode) {
      case 'day':
        return eachDayOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'dd'),
          sublabel: format(date, 'MMM'),
          isWeekend: isWeekend(date),
          isToday: isToday(date)
        }));
      
      case 'week':
        return eachWeekOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'wo'),
          sublabel: format(date, 'MMM'),
          weekStart: startOfWeek(date),
          weekEnd: endOfWeek(date)
        }));
      
      case 'month':
      default:
        return eachMonthOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'MMM'),
          sublabel: format(date, 'yyyy')
        }));
    }
  }, [dateRange, viewMode]);

  // Calculate column width based on zoom level
  const columnWidth = useMemo(() => {
    const baseWidth = viewMode === 'day' ? 40 : viewMode === 'week' ? 80 : 120;
    return (baseWidth * zoomLevel) / 100;
  }, [viewMode, zoomLevel]);

  // Calculate total chart width
  const chartWidth = timelineHeaders.length * columnWidth;

  // Scroll to today's position when requested
  useEffect(() => {
    if (scrollToToday && containerRef.current && projects.length > 0) {
      const today = new Date();
      const { start: chartStart } = dateRange;
      const daysSinceStart = differenceInDays(today, chartStart);
      const pixelsPerDay = chartWidth / differenceInDays(dateRange.end, chartStart);
      const scrollPosition = daysSinceStart * pixelsPerDay - (containerRef.current.offsetWidth / 2) + 150; // 150 is half of projectColumnWidth

      containerRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [scrollToToday, dateRange, chartWidth, projects.length]);

  // Helper function to calculate bar position and width
  const calculateBarPosition = (project) => {
    const projectStart = parseISO(project.startDate);
    const projectEnd = parseISO(project.endDate);
    const { start: chartStart } = dateRange;

    // Check if any projection comes before project start (e.g., hiring deadline)
    let barStart = projectStart;
    if (project.projections && project.projections.length > 0) {
      const sortedProjections = [...project.projections].sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      const firstProjectionDate = parseISO(sortedProjections[0].date);
      if (firstProjectionDate < projectStart) {
        barStart = firstProjectionDate;
      }
    }

    const startDays = differenceInDays(barStart, chartStart);
    const duration = differenceInDays(projectEnd, barStart) + 1;

    const pixelsPerDay = chartWidth / differenceInDays(dateRange.end, chartStart);

    return {
      left: startDays * pixelsPerDay,
      width: duration * pixelsPerDay
    };
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'upcoming': '#ff9800',
      'in-progress': '#2196f3',
      'completed': '#4caf50',
      'cancelled': '#f44336',
      'onhold': '#9e9e9e'
    };
    return colors[status] || '#2196f3';
  };

  // Get projection type info
  const getProjectionTypeInfo = (type) => {
    return projectionTypes.find(pt => pt.id === type) || projectionTypes.find(pt => pt.id === 'custom');
  };


  // Row height
  const rowHeight = 95;
  const headerHeight = 80;
  const projectColumnWidth = 300;

  return (
    <Box ref={containerRef} sx={{ width: '100%', overflow: 'auto', position: 'relative' }}>
      <Paper elevation={0} sx={{ minWidth: chartWidth + projectColumnWidth, bgcolor: 'background.paper', borderRadius: 1 }}>
        {/* Timeline Header */}
        <Box sx={{
          display: 'flex',
          height: headerHeight,
          borderBottom: 2,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'grey.50'
        }}>
          {/* Project Name Column Header */}
          <Box sx={{
            width: projectColumnWidth,
            borderRight: 2,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'sticky',
            left: 0,
            bgcolor: 'grey.50',
            zIndex: 11
          }}>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 0.5 }}>
              Projects
            </Typography>
            {/* Status Legend */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
              {[
                { label: 'Upcoming', color: '#ff9800' },
                { label: 'In Progress', color: '#2196f3' },
                { label: 'Completed', color: '#4caf50' },
                { label: 'Cancelled', color: '#f44336' }
              ].map((status) => (
                <Stack key={status.label} direction="row" spacing={0.5} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: status.color
                    }}
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                    {status.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Timeline Columns Headers */}
          <Box sx={{ display: 'flex', position: 'relative' }}>
            {timelineHeaders.map((header, index) => (
              <Box
                key={index}
                sx={{
                  width: columnWidth,
                  borderRight: 1,
                  borderColor: 'divider',
                  p: 1,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {header.label}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {header.sublabel}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Project Rows */}
        {projects.map((project, projectIndex) => {
          const barPosition = calculateBarPosition(project);
          const instructor = instructors.find(i => i.id === project.instructorId);
          const instructor2 = project.instructor2Id ? instructors.find(i => i.id === project.instructor2Id) : null;

          return (
            <Box
              key={project.id}
              sx={{ 
                display: 'flex',
                height: rowHeight,
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {/* Project Name Cell */}
              <Box sx={{
                width: projectColumnWidth,
                borderRight: 2,
                borderColor: 'divider',
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                zIndex: 5
              }}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  {/* Project Name with Status Dot */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(project.status),
                        flexShrink: 0
                      }}
                    />
                    <Typography
                      component="div"
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        lineHeight: 1.3,
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                      onClick={() => onProjectClick && onProjectClick(project)}
                    >
                      {project.name}
                    </Typography>
                  </Stack>

                  {/* Date & Location Row */}
                  <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.7rem', color: 'text.secondary' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {format(parseISO(project.startDate), 'MMM dd')} - {format(parseISO(project.endDate), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">•</Typography>
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                      {(() => {
                        // Parse location if it's JSON, otherwise use as string
                        if (!project.location) return 'No location';
                        try {
                          const loc = JSON.parse(project.location);
                          // Check if remote
                          const desc = loc.description || '';
                          if (desc.toLowerCase() === 'remote' || desc.toLowerCase().includes('remote')) {
                            return (
                              <>
                                <GlobalOutlined style={{ fontSize: 11, color: '#1976d2' }} />
                                <span>Remote</span>
                              </>
                            );
                          }
                          // In-person - show room if available
                          if (loc.room) {
                            return (
                              <>
                                <AppstoreOutlined style={{ fontSize: 11, color: '#2e7d32' }} />
                                <span>{loc.room}</span>
                              </>
                            );
                          }
                          return (
                            <>
                              <EnvironmentOutlined style={{ fontSize: 11, color: '#ed6c02' }} />
                              <span>{loc.description || loc.address || 'In Person'}</span>
                            </>
                          );
                        } catch {
                          // Not JSON, check if it's "Remote" or a room/location name
                          const locStr = project.location.toLowerCase();
                          if (locStr === 'remote' || locStr.includes('remote')) {
                            return (
                              <>
                                <GlobalOutlined style={{ fontSize: 11, color: '#1976d2' }} />
                                <span>Remote</span>
                              </>
                            );
                          }
                          return (
                            <>
                              <EnvironmentOutlined style={{ fontSize: 11, color: '#ed6c02' }} />
                              <span>{project.location}</span>
                            </>
                          );
                        }
                      })()}
                    </Box>
                  </Box>
                  {/* Instructor Row */}
                  {(instructor || instructor2) && (
                    <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                      <UserOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {instructor?.name}{instructor && instructor2 && ', '}{instructor2?.name}
                      </Typography>
                    </Box>
                  )}
                  {/* Recipient Row */}
                  {project.recipient && (
                    <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                      <TeamOutlined style={{ fontSize: 11, color: '#1976d2' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {project.recipient}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Timeline Grid and Bar */}
              <Box sx={{ position: 'relative', flex: 1 }}>
                {/* Grid Lines */}
                <Box sx={{ display: 'flex', position: 'absolute', height: '100%', width: '100%' }}>
                  {timelineHeaders.map((header, index) => (
                    <Box
                      key={`grid-${index}`}
                      sx={{
                        width: columnWidth,
                        borderRight: 1,
                        borderColor: 'divider',
                        height: '100%',
                        bgcolor: header.isWeekend ? 'grey.50' : 'transparent'
                      }}
                    />
                  ))}
                </Box>

                {/* Project Bar - Segmented by Milestones */}
                {(() => {
                  const projectStart = parseISO(project.startDate);
                  const projectEnd = parseISO(project.endDate);
                  // Training color is yellow (locked to project dates)
                  const trainingColor = '#f1c40f';

                  // Build segments from projections
                  const segments = [];

                  if (showProjections && project.projections && project.projections.length > 0) {
                    // Sort projections by date (exclude any manually added training_start - it's auto-generated)
                    const sortedProjections = [...project.projections]
                      .filter(p => p.type !== 'training_start')
                      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

                    // Separate projections into before project start (e.g., hiring) and during/after
                    const beforeProjectStart = sortedProjections.filter(p => parseISO(p.date) < projectStart);
                    const duringProject = sortedProjections.filter(p => {
                      const pDate = parseISO(p.date);
                      return pDate >= projectStart && pDate <= projectEnd;
                    });

                    // Add pre-project milestones (e.g., hiring) with gaps
                    let lastEndDate = null;
                    for (let i = 0; i < beforeProjectStart.length; i++) {
                      const currentProjection = beforeProjectStart[i];
                      const currentDate = parseISO(currentProjection.date);

                      // Use milestone's endDate if set, otherwise end at next milestone or project start
                      const milestoneEnd = currentProjection.endDate
                        ? parseISO(currentProjection.endDate)
                        : (i < beforeProjectStart.length - 1
                            ? parseISO(beforeProjectStart[i + 1].date)
                            : projectStart);

                      const typeInfo = getProjectionTypeInfo(currentProjection.type);
                      const isOverdue = isPast(currentDate) && !isToday(currentDate) && project.status !== 'completed';

                      segments.push({
                        start: currentDate,
                        end: milestoneEnd,
                        color: typeInfo?.color || '#95a5a6',
                        label: currentProjection.label,
                        projection: currentProjection,
                        typeInfo,
                        isOverdue
                      });

                      lastEndDate = milestoneEnd;
                    }

                    // Add transparent gap segment between last pre-project milestone and project start if needed
                    if (lastEndDate && lastEndDate < projectStart) {
                      segments.push({
                        start: lastEndDate,
                        end: projectStart,
                        color: 'transparent',
                        label: '',
                        isGap: true
                      });
                    }

                    // Auto-generate training segment (project dates)
                    // Find first milestone during project to determine training end
                    const firstDuringMilestone = duringProject.length > 0 ? parseISO(duringProject[0].date) : null;
                    const trainingEnd = firstDuringMilestone || projectEnd;

                    segments.push({
                      start: projectStart,
                      end: trainingEnd,
                      color: trainingColor,
                      label: project.name,
                      isTrainingSegment: true,
                      isBase: true
                    });

                    // Add milestones during the project
                    for (let i = 0; i < duringProject.length; i++) {
                      const currentProjection = duringProject[i];
                      const currentDate = parseISO(currentProjection.date);
                      // Use milestone's endDate if set, otherwise fall back to next milestone or project end
                      const nextDate = currentProjection.endDate
                        ? parseISO(currentProjection.endDate)
                        : (i < duringProject.length - 1
                            ? parseISO(duringProject[i + 1].date)
                            : projectEnd);

                      const typeInfo = getProjectionTypeInfo(currentProjection.type);
                      const isOverdue = isPast(currentDate) && !isToday(currentDate) && project.status !== 'completed';

                      segments.push({
                        start: currentDate,
                        end: nextDate,
                        color: typeInfo?.color || '#95a5a6',
                        label: currentProjection.label,
                        projection: currentProjection,
                        typeInfo,
                        isOverdue
                      });
                    }
                  } else {
                    // No projections or hidden - single yellow segment (training = project dates)
                    segments.push({
                      start: projectStart,
                      end: projectEnd,
                      color: trainingColor,
                      label: project.name,
                      isTrainingSegment: true,
                      isBase: true
                    });
                  }

                  const { start: chartStart } = dateRange;
                  const pixelsPerDay = chartWidth / differenceInDays(dateRange.end, chartStart);

                  return (
                    <Box
                      onClick={() => onProjectClick && onProjectClick(project)}
                      sx={{
                        position: 'absolute',
                        left: barPosition.left,
                        width: barPosition.width,
                        height: rowHeight - 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        cursor: 'pointer',
                        borderRadius: 0,
                        overflow: 'hidden',
                        boxShadow: hoveredProject === project.id ? 3 : 1,
                        border: '1px solid',
                        borderColor: 'rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-50%) scale(1.02)',
                          boxShadow: 4
                        }
                      }}
                    >
                      {segments.map((segment, segIndex) => {
                        const segmentDuration = differenceInDays(segment.end, segment.start) + (segIndex === segments.length - 1 ? 1 : 0);
                        const segmentWidth = segmentDuration * pixelsPerDay;

                        const tooltipContent = segment.projection ? (
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {segment.projection.label}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {segment.typeInfo?.label}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {format(parseISO(segment.projection.date), 'MMM dd, yyyy')}
                              {segment.projection.endDate && ` - ${format(parseISO(segment.projection.endDate), 'MMM dd, yyyy')}`}
                            </Typography>
                            {segment.projection.notes && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                {segment.projection.notes}
                              </Typography>
                            )}
                            {segment.isOverdue && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#ff6b6b', fontWeight: 600 }}>
                                OVERDUE
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ p: 1 }}>
                            <Typography variant="body2" fontWeight="bold">{project.name}</Typography>
                            <Typography variant="caption">
                              {format(projectStart, 'MMM dd, yyyy')} - {format(projectEnd, 'MMM dd, yyyy')}
                            </Typography>
                            <br />
                            <Typography variant="caption">Status: {project.status}</Typography>
                            <br />
                            <Typography variant="caption">Instructor: {instructor?.name || 'Unassigned'}</Typography>
                            {project.progress !== undefined && (
                              <>
                                <br />
                                <Typography variant="caption">Progress: {project.progress}%</Typography>
                              </>
                            )}
                          </Box>
                        );

                        // Gap segments - just empty space, no tooltip
                        if (segment.isGap) {
                          return (
                            <Box
                              key={segIndex}
                              sx={{
                                width: segmentWidth,
                                height: '100%',
                                bgcolor: 'transparent'
                              }}
                            />
                          );
                        }

                        return (
                          <Tooltip
                            key={segIndex}
                            title={tooltipContent}
                            arrow
                            placement="top"
                          >
                            <Box
                              sx={{
                                width: segmentWidth,
                                height: '100%',
                                bgcolor: segment.color,
                                opacity: hoveredProject === project.id ? 1 : 0.9,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                borderRight: segIndex < segments.length - 1 && !segments[segIndex + 1]?.isGap ? '2px solid rgba(255,255,255,0.5)' : 'none',
                                overflow: 'hidden',
                                '&:hover': {
                                  opacity: 1,
                                  filter: 'brightness(1.1)'
                                }
                              }}
                            >
                              {/* Always show label - truncate if needed */}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: segmentWidth > 80 ? '0.7rem' : '0.6rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  px: 0.5,
                                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                  maxWidth: '100%'
                                }}
                              >
                                {segment.isBase ? project.name : segment.label}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  );
                })()}
              </Box>
            </Box>
          );
        })}

        {/* Today Line */}
        <Box
          sx={{
            position: 'absolute',
            top: headerHeight,
            bottom: 0,
            left: projectColumnWidth + (differenceInDays(new Date(), dateRange.start) * (chartWidth / differenceInDays(dateRange.end, dateRange.start))),
            width: 2,
            bgcolor: 'error.main',
            zIndex: 5,
            pointerEvents: 'none'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'error.main',
              color: 'white',
              px: 1,
              borderRadius: 1,
              fontSize: '0.7rem',
              whiteSpace: 'nowrap'
            }}
          >
            Today
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

GanttChart.propTypes = {
  projects: PropTypes.array,
  viewMode: PropTypes.oneOf(['day', 'week', 'month']),
  zoomLevel: PropTypes.number,
  onProjectClick: PropTypes.func,
  instructors: PropTypes.array,
  scrollToToday: PropTypes.bool,
  showProjections: PropTypes.bool
};

export default GanttChart;