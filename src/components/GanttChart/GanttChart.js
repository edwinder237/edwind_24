import { useRef, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  Typography, 
  Tooltip, 
  Chip,
  Stack,
  Avatar,
  LinearProgress
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
  endOfWeek
} from 'date-fns';

// ==============================|| GANTT CHART COMPONENT ||============================== //

const GanttChart = ({ 
  projects = [], 
  viewMode = 'month', 
  zoomLevel = 100,
  onProjectClick,
  instructors = []
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
          height: Math.max(600, projects.length * 60 + 100)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [projects.length]);

  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    if (projects.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    }

    const allDates = projects.flatMap(p => [
      parseISO(p.startDate),
      parseISO(p.endDate)
    ]);
    
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Add padding to the date range
    const paddingDays = viewMode === 'day' ? 3 : viewMode === 'week' ? 7 : 30;
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

  // Helper function to calculate bar position and width
  const calculateBarPosition = (project) => {
    const projectStart = parseISO(project.startDate);
    const projectEnd = parseISO(project.endDate);
    const { start: chartStart } = dateRange;
    
    const startDays = differenceInDays(projectStart, chartStart);
    const duration = differenceInDays(projectEnd, projectStart) + 1;
    
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

  // Row height
  const rowHeight = 75;
  const headerHeight = 80;
  const projectColumnWidth = 300;

  return (
    <Box ref={containerRef} sx={{ width: '100%', overflow: 'auto', position: 'relative' }}>
      <Paper elevation={0} sx={{ minWidth: chartWidth + projectColumnWidth, bgcolor: 'background.paper' }}>
        {/* Timeline Header */}
        <Box sx={{ 
          display: 'flex', 
          height: headerHeight,
          borderBottom: 2,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper'
        }}>
          {/* Project Name Column Header */}
          <Box sx={{ 
            width: projectColumnWidth, 
            borderRight: 2,
            borderColor: 'divider',
            px: 2,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'grey.50'
          }}>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Projects
            </Typography>
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
                  textAlign: 'center',
                  bgcolor: header.isToday ? 'primary.lighter' : 
                          header.isWeekend ? 'grey.50' : 'transparent'
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
                gap: 1
              }}>
                <Stack spacing={0.75} sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: hoveredProject === project.id ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onClick={() => onProjectClick && onProjectClick(project)}
                  >
                    {project.name}
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {instructor && (
                      <Chip
                        label={instructor.name}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 22, 
                          fontSize: '0.75rem',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    )}
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem',
                        bgcolor: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status),
                        borderColor: getStatusColor(project.status),
                        fontWeight: 500,
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Timeline Grid and Bar */}
              <Box sx={{ position: 'relative', flex: 1 }}>
                {/* Grid Lines */}
                <Box sx={{ display: 'flex', position: 'absolute', height: '100%', width: '100%' }}>
                  {timelineHeaders.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: columnWidth,
                        borderRight: 1,
                        borderColor: 'divider',
                        height: '100%',
                        bgcolor: _.isWeekend ? 'grey.50' : 'transparent'
                      }}
                    />
                  ))}
                </Box>

                {/* Project Bar */}
                <Tooltip
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{project.name}</Typography>
                      <Typography variant="caption">
                        {format(parseISO(project.startDate), 'MMM dd, yyyy')} - {format(parseISO(project.endDate), 'MMM dd, yyyy')}
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
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    onClick={() => onProjectClick && onProjectClick(project)}
                    sx={{
                      position: 'absolute',
                      left: barPosition.left,
                      width: barPosition.width,
                      height: 40,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: project.color || getStatusColor(project.status),
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      opacity: hoveredProject === project.id ? 1 : 0.9,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1.5,
                      overflow: 'hidden',
                      boxShadow: hoveredProject === project.id ? 3 : 1,
                      border: '1px solid',
                      borderColor: 'rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-50%) scale(1.02)',
                        boxShadow: 4
                      }
                    }}
                  >
                    {project.progress !== undefined && project.progress > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          bgcolor: 'rgba(255,255,255,0.3)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'rgba(255,255,255,0.7)'
                          }
                        }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {project.name}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          );
        })}

        {/* Today Line */}
        {viewMode === 'day' && (
          <Box
            sx={{
              position: 'absolute',
              top: headerHeight,
              bottom: 0,
              left: projectColumnWidth + (differenceInDays(new Date(), dateRange.start) * (chartWidth / differenceInDays(dateRange.end, dateRange.start))),
              width: 2,
              bgcolor: 'error.main',
              zIndex: 5,
              '&::before': {
                content: '"Today"',
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'error.main',
                color: 'white',
                px: 1,
                borderRadius: 1,
                fontSize: '0.7rem'
              }
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

GanttChart.propTypes = {
  projects: PropTypes.array,
  viewMode: PropTypes.oneOf(['day', 'week', 'month']),
  zoomLevel: PropTypes.number,
  onProjectClick: PropTypes.func,
  instructors: PropTypes.array
};

export default GanttChart;