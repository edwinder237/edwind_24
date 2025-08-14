import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

// ==============================|| GANTT CHART UTILITIES ||============================== //

export const getStatusColor = (status) => {
  switch (status) {
    case 'ongoing': return '#4caf50';
    case 'completed': return '#2196f3';
    case 'pending': return '#ff9800';
    case 'cancelled': return '#f44336';
    default: return '#9e9e9e';
  }
};

export const getStatusColorAlpha = (status, alpha = 0.1) => {
  const color = getStatusColor(status);
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const calculateProgress = (project) => {
  if (!project.startDate || !project.endDate) return 0;
  
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const now = new Date();
  
  if (now < start) return 0;
  if (now > end) return project.projectStatus === 'completed' ? 100 : 95;
  
  const totalDays = differenceInDays(end, start);
  const completedDays = differenceInDays(now, start);
  
  return Math.round((completedDays / totalDays) * 100);
};

export const formatDuration = (duration) => {
  if (!duration) return 'Not specified';
  if (duration === 1) return '1 week';
  return `${duration} weeks`;
};

export const getTimelineIntervals = (startDate, endDate, viewMode) => {
  if (!startDate || !endDate) return [];
  
  const intervals = [];
  
  if (viewMode === 'days') {
    return eachDayOfInterval({ start: startDate, end: endDate });
  } else if (viewMode === 'weeks') {
    let current = startOfWeek(startDate);
    while (current <= endDate) {
      intervals.push(current);
      current = addDays(current, 7);
    }
    return intervals;
  } else if (viewMode === 'months') {
    let current = startOfMonth(startDate);
    while (current <= endDate) {
      intervals.push(current);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return intervals;
  }
  return intervals;
};

export const getProjectBarStyle = (project, timelineStart, timelineEnd) => {
  if (!project.startDate || !project.endDate || !timelineStart) return null;
  
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const totalTimelineDays = differenceInDays(timelineEnd, timelineStart);
  const daysFromStart = differenceInDays(start, timelineStart);
  const projectDays = differenceInDays(end, start);
  
  const leftPercent = (daysFromStart / totalTimelineDays) * 100;
  const widthPercent = (projectDays / totalTimelineDays) * 100;
  
  return {
    left: `${Math.max(0, leftPercent)}%`,
    width: `${Math.max(1, widthPercent)}%`,
    backgroundColor: project.color || getStatusColor(project.projectStatus),
    minWidth: '20px'
  };
};

export const getColumnWidth = (viewMode, zoom) => {
  const baseWidth = viewMode === 'days' ? 30 : viewMode === 'weeks' ? 100 : 150;
  return baseWidth * zoom;
};

export const formatTimelineHeader = (interval, viewMode) => {
  if (viewMode === 'days') return format(interval, 'dd MMM');
  if (viewMode === 'weeks') return `Week ${format(interval, 'w')}`;
  if (viewMode === 'months') return format(interval, 'MMM yyyy');
  return '';
};

export const getProjectTypeIcon = (projectType) => {
  switch (projectType?.toLowerCase()) {
    case 'training program':
    case 'bootcamp':
      return '🎓';
    case 'leadership development':
      return '👑';
    case 'workshop series':
      return '🛠️';
    case 'technical training':
      return '💻';
    case 'organizational change':
      return '🔄';
    default:
      return '📋';
  }
};

export const isProjectOverdue = (project) => {
  if (!project.endDate) return false;
  const now = new Date();
  const end = new Date(project.endDate);
  return now > end && project.projectStatus !== 'completed' && project.projectStatus !== 'cancelled';
};

export const getProjectHealthStatus = (project) => {
  const progress = calculateProgress(project);
  const isOverdue = isProjectOverdue(project);
  
  if (isOverdue) return { status: 'critical', color: '#f44336', label: 'Overdue' };
  if (project.projectStatus === 'cancelled') return { status: 'cancelled', color: '#9e9e9e', label: 'Cancelled' };
  if (project.projectStatus === 'completed') return { status: 'completed', color: '#4caf50', label: 'Completed' };
  if (progress > 75) return { status: 'on-track', color: '#4caf50', label: 'On Track' };
  if (progress > 50) return { status: 'at-risk', color: '#ff9800', label: 'At Risk' };
  if (progress > 25) return { status: 'behind', color: '#f44336', label: 'Behind' };
  return { status: 'not-started', color: '#9e9e9e', label: 'Not Started' };
};

export const exportGanttData = (projects) => {
  const exportData = projects.map(project => ({
    title: project.title,
    status: project.projectStatus,
    type: project.projectType,
    category: project.projectCategory,
    startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
    duration: project.duration,
    progress: calculateProgress(project),
    client: project.training_recipient?.name || '',
    tags: project.tags ? (Array.isArray(project.tags) ? project.tags : JSON.parse(project.tags)).map(tag => tag.label || tag).join(', ') : '',
    summary: project.summary
  }));
  
  return exportData;
};

export const groupProjectsByCategory = (projects) => {
  return projects.reduce((groups, project) => {
    const category = project.projectCategory || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(project);
    return groups;
  }, {});
};

export const getCurrentDateLinePosition = (timelineStart, timelineEnd) => {
  if (!timelineStart || !timelineEnd) return null;
  
  const now = new Date();
  const totalTimelineDays = differenceInDays(timelineEnd, timelineStart);
  const daysFromStart = differenceInDays(now, timelineStart);
  
  // Only show the line if current date is within timeline bounds
  if (daysFromStart < 0 || daysFromStart > totalTimelineDays) return null;
  
  const leftPercent = (daysFromStart / totalTimelineDays) * 100;
  return leftPercent;
};

export const getTimelineStats = (projects) => {
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => p.projectStatus === 'ongoing').length;
  const completedProjects = projects.filter(p => p.projectStatus === 'completed').length;
  const pendingProjects = projects.filter(p => p.projectStatus === 'pending').length;
  const cancelledProjects = projects.filter(p => p.projectStatus === 'cancelled').length;
  const overdueProjects = projects.filter(isProjectOverdue).length;
  
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + calculateProgress(p), 0) / projects.length)
    : 0;
  
  return {
    total: totalProjects,
    ongoing: ongoingProjects,
    completed: completedProjects,
    pending: pendingProjects,
    cancelled: cancelledProjects,
    overdue: overdueProjects,
    averageProgress: avgProgress
  };
};