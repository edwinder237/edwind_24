/**
 * Dashboard Derived Selectors
 * 
 * Complex selectors for dashboard views that combine multiple data sources
 * to provide comprehensive project insights and metrics.
 */

import { createSelector } from '@reduxjs/toolkit';
import { entitySelectors } from '../entities';
import {
  selectAttendanceSummary,
  selectEventCapacityAnalysis,
  selectParticipantEngagementAnalysis
} from './attendanceSelectors';
import { selectCourseCompletionData } from './courseCompletionSelectors';
import { projectApi } from '../api/projectApi';

// ==============================|| DASHBOARD OVERVIEW ||============================== //

/**
 * Main dashboard metrics combining all key indicators
 */
export const selectDashboardOverview = createSelector(
  [
    // Use existing Redux data for compatibility
    (state) => state.projectAgenda?.participants || [],
    (state) => state.projectAgenda?.events || [],
    (state) => state.projectAgenda?.groups || [],
    selectAttendanceSummary
  ],
  (participants, events, groups, attendanceStats) => ({
    keyMetrics: {
      totalParticipants: Array.isArray(participants) ? participants.length : 0,
      totalEvents: Array.isArray(events) ? events.length : 0,
      totalGroups: Array.isArray(groups) ? groups.length : 0,
      overallAttendanceRate: Math.round(attendanceStats?.attendanceRate || 0)
    },
    trends: {
      attendanceDirection: getAttendanceTrend(attendanceStats),
      participantGrowth: calculateParticipantGrowth(participants),
      eventFrequency: calculateEventFrequency(events),
      groupEfficiency: calculateGroupEfficiency(groups)
    },
    alerts: generateDashboardAlerts(participants, events, groups, attendanceStats),
    quickActions: [
      {
        title: 'View Problem Participants',
        count: attendanceStats?.problemParticipants?.length || 0,
        severity: 'warning',
        action: 'navigate_participants'
      },
      {
        title: 'Underutilized Events',
        count: 0, // Would be filled by capacity analysis
        severity: 'info',
        action: 'navigate_events'
      },
      {
        title: 'At-Risk Groups',
        count: 0, // Would be calculated from group performance
        severity: 'error',
        action: 'navigate_groups'
      }
    ]
  })
);

/**
 * Project progress and completion metrics
 */
export const selectProjectProgress = createSelector(
  [
    entitySelectors.events.selectAllEvents,
    entitySelectors.participants.selectAllParticipants,
    entitySelectors.groups.selectAllGroups
  ],
  (events, participants, groups) => {
    const now = new Date();
    
    // Categorize events by time
    const pastEvents = events.filter(e => new Date(e.end || e.start) < now);
    const currentEvents = events.filter(e => {
      const start = new Date(e.start);
      const end = new Date(e.end || e.start);
      return start <= now && now <= end;
    });
    const futureEvents = events.filter(e => new Date(e.start) > now);
    
    // Calculate completion rates
    const totalPlannedEvents = events.length;
    const completedEvents = pastEvents.length;
    const progressPercentage = totalPlannedEvents > 0 
      ? Math.round((completedEvents / totalPlannedEvents) * 100) 
      : 0;
    
    // Participant completion tracking
    const participantCompletions = participants.map(participant => {
      const assignedEvents = events.filter(e => 
        e.event_attendees?.some(ea => ea.enrollee?.id === participant.id)
      );
      const completedByParticipant = pastEvents.filter(e => 
        e.event_attendees?.some(ea => 
          ea.enrollee?.id === participant.id && 
          (ea.attendance_status === 'present' || ea.attendance_status === 'late')
        )
      );
      
      return {
        participantId: participant.id,
        participantName: `${participant.firstName} ${participant.lastName}`,
        totalAssigned: assignedEvents.length,
        completed: completedByParticipant.length,
        completionRate: assignedEvents.length > 0 
          ? Math.round((completedByParticipant.length / assignedEvents.length) * 100)
          : 0
      };
    });
    
    // Group progress
    const groupProgress = groups.map(group => {
      const groupEvents = events.filter(e => 
        e.groups?.some(eg => eg.id === group.id)
      );
      const completedGroupEvents = pastEvents.filter(e => 
        e.groups?.some(eg => eg.id === group.id)
      );
      
      return {
        groupId: group.id,
        groupName: group.groupName,
        totalEvents: groupEvents.length,
        completedEvents: completedGroupEvents.length,
        progressPercentage: groupEvents.length > 0
          ? Math.round((completedGroupEvents.length / groupEvents.length) * 100)
          : 0,
        participantCount: group.participants?.length || 0
      };
    });
    
    return {
      overview: {
        totalEvents: totalPlannedEvents,
        completedEvents,
        currentEvents: currentEvents.length,
        futureEvents: futureEvents.length,
        overallProgress: progressPercentage
      },
      timeline: {
        pastEvents: pastEvents.length,
        currentEvents: currentEvents.length,
        upcomingEvents: futureEvents.slice(0, 5), // Next 5 events
        criticalDeadlines: getCriticalDeadlines(futureEvents)
      },
      participantProgress: participantCompletions
        .sort((a, b) => b.completionRate - a.completionRate),
      groupProgress: groupProgress
        .sort((a, b) => b.progressPercentage - a.progressPercentage),
      milestones: calculateMilestones(events, now)
    };
  }
);

/**
 * Resource utilization and allocation metrics
 */
export const selectResourceUtilization = createSelector(
  [
    entitySelectors.events.selectAllEvents,
    entitySelectors.participants.selectAllParticipants,
    entitySelectors.groups.selectAllGroups
  ],
  (events, participants, groups) => {
    // Instructor workload analysis
    const instructorWorkload = new Map();

    events.forEach(event => {
      // Handle both event.instructors and event.event_instructors structures
      const eventInstructors = event.instructors ||
        (event.event_instructors?.map(ei => ei.instructor).filter(Boolean)) ||
        [];

      if (eventInstructors.length > 0) {
        eventInstructors.forEach(instructor => {
          if (!instructorWorkload.has(instructor.id)) {
            instructorWorkload.set(instructor.id, {
              instructor,
              totalEvents: 0,
              totalHours: 0,
              utilization: 0,
              upcomingEvents: 0
            });
          }

          const workload = instructorWorkload.get(instructor.id);
          workload.totalEvents++;

          // Calculate hours if end time available
          if (event.end) {
            const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
            workload.totalHours += duration;
          }

          // Count upcoming events
          if (new Date(event.start) > new Date()) {
            workload.upcomingEvents++;
          }
        });
      }
    });
    
    // Room/venue utilization
    const venueUtilization = new Map();
    events.forEach(event => {
      if (event.venue || event.location) {
        const venue = event.venue || event.location;
        if (!venueUtilization.has(venue)) {
          venueUtilization.set(venue, {
            venue,
            totalBookings: 0,
            totalHours: 0,
            utilizationRate: 0
          });
        }
        
        const util = venueUtilization.get(venue);
        util.totalBookings++;
        
        if (event.end) {
          const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
          util.totalHours += duration;
        }
      }
    });
    
    // Group size distribution
    const groupSizeDistribution = {
      small: groups.filter(g => (g.participants?.length || 0) <= 5).length,
      medium: groups.filter(g => {
        const size = g.participants?.length || 0;
        return size > 5 && size <= 15;
      }).length,
      large: groups.filter(g => (g.participants?.length || 0) > 15).length
    };

    const instructorsArray = Array.from(instructorWorkload.values());
    const venuesArray = Array.from(venueUtilization.values());

    return {
      instructors: instructorsArray.sort((a, b) => b.totalEvents - a.totalEvents),
      venues: venuesArray.sort((a, b) => b.totalBookings - a.totalBookings),
      groupDistribution: groupSizeDistribution,
      recommendations: generateResourceRecommendations(
        instructorsArray,
        venuesArray,
        groupSizeDistribution
      )
    };
  }
);

/**
 * Time-based analytics for scheduling optimization
 */
export const selectTimeAnalytics = createSelector(
  [entitySelectors.events.selectAllEvents],
  (events) => {
    const timeAnalysis = {
      busyHours: Array(24).fill(0),
      busyDays: Array(7).fill(0),
      monthlyDistribution: Array(12).fill(0),
      conflicts: [],
      gapAnalysis: [],
      optimalScheduling: {}
    };
    
    // Analyze event distribution
    events.forEach(event => {
      const start = new Date(event.start);
      
      timeAnalysis.busyHours[start.getHours()]++;
      timeAnalysis.busyDays[start.getDay()]++;
      timeAnalysis.monthlyDistribution[start.getMonth()]++;
    });
    
    // Find scheduling conflicts (overlapping events)
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (eventsOverlap(event1, event2)) {
          timeAnalysis.conflicts.push({
            event1: { id: event1.id, title: event1.title, start: event1.start },
            event2: { id: event2.id, title: event2.title, start: event2.start },
            severity: calculateConflictSeverity(event1, event2)
          });
        }
      }
    }
    
    // Identify scheduling gaps and opportunities
    timeAnalysis.gapAnalysis = identifySchedulingGaps(events);
    
    // Generate optimal scheduling recommendations
    timeAnalysis.optimalScheduling = generateSchedulingRecommendations(timeAnalysis);
    
    return timeAnalysis;
  }
);

/**
 * Advanced project health metrics
 */
export const selectProjectHealth = createSelector(
  [
    selectAttendanceSummary,
    selectEventCapacityAnalysis,
    selectParticipantEngagementAnalysis,
    selectProjectProgress,
    selectResourceUtilization
  ],
  (attendance, capacity, engagement, progress, resources) => {
    const healthIndicators = {
      attendance: {
        score: Math.round(attendance.attendanceRate || 0),
        status: getHealthStatus(attendance.attendanceRate, [70, 85]),
        details: `${attendance.problemParticipants?.length || 0} participants need attention`
      },
      engagement: {
        score: calculateEngagementScore(engagement),
        status: getHealthStatus(calculateEngagementScore(engagement), [60, 80]),
        details: `${engagement.engagementLevels?.atRisk?.length || 0} at-risk participants`
      },
      progress: {
        score: progress.overview?.overallProgress || 0,
        status: getHealthStatus(progress.overview?.overallProgress, [50, 75]),
        details: `${progress.overview?.futureEvents || 0} events remaining`
      },
      capacity: {
        score: Math.round(capacity.averageUtilization || 0),
        status: getHealthStatus(capacity.averageUtilization, [70, 90]),
        details: `${capacity.recommendations?.length || 0} capacity issues`
      },
      resources: {
        score: calculateResourceScore(resources),
        status: getHealthStatus(calculateResourceScore(resources), [70, 85]),
        details: generateResourceSummary(resources)
      }
    };
    
    // Overall health score
    const scores = Object.values(healthIndicators).map(h => h.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      overallScore: Math.round(overallScore),
      overallStatus: getHealthStatus(overallScore, [60, 80]),
      indicators: healthIndicators,
      criticalIssues: identifyCriticalIssues(healthIndicators),
      recommendations: generateHealthRecommendations(healthIndicators)
    };
  }
);

// ==============================|| HELPER FUNCTIONS ||============================== //

function getAttendanceTrend(attendanceStats) {
  // Would analyze historical data to determine trend
  // For now, return stable
  return attendanceStats?.attendanceRate > 75 ? 'improving' : 'declining';
}

function calculateParticipantGrowth(participants) {
  // Would compare with historical data
  return 'stable';
}

function calculateEventFrequency(events) {
  // Would analyze event scheduling patterns
  return 'regular';
}

function calculateGroupEfficiency(groups) {
  const avgSize = Array.isArray(groups) && groups.length > 0 
    ? groups.reduce((sum, g) => sum + (g.participants?.length || 0), 0) / groups.length 
    : 0;
  return avgSize > 8 ? 'efficient' : 'could_improve';
}

function generateDashboardAlerts(participants, events, groups, attendanceStats) {
  const alerts = [];
  
  if (attendanceStats?.attendanceRate < 70) {
    alerts.push({
      type: 'warning',
      title: 'Low Attendance Rate',
      message: `Overall attendance is ${Math.round(attendanceStats.attendanceRate)}%, below target of 70%`,
      priority: 'high'
    });
  }
  
  if (attendanceStats?.problemParticipants?.length > 0) {
    alerts.push({
      type: 'info',
      title: 'Participants Need Attention',
      message: `${attendanceStats.problemParticipants.length} participants have low attendance`,
      priority: 'medium'
    });
  }
  
  return alerts;
}

function getCriticalDeadlines(futureEvents) {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return futureEvents
    .filter(event => new Date(event.start) <= nextWeek)
    .map(event => ({
      eventId: event.id,
      title: event.title,
      date: event.start,
      daysUntil: Math.ceil((new Date(event.start) - new Date()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

function calculateMilestones(events, now) {
  const totalEvents = events.length;
  const completedEvents = events.filter(e => new Date(e.end || e.start) < now).length;
  
  return [
    {
      title: '25% Complete',
      achieved: completedEvents >= totalEvents * 0.25,
      targetDate: null,
      description: `${Math.round(totalEvents * 0.25)} events completed`
    },
    {
      title: '50% Complete',
      achieved: completedEvents >= totalEvents * 0.5,
      targetDate: null,
      description: `${Math.round(totalEvents * 0.5)} events completed`
    },
    {
      title: '75% Complete',
      achieved: completedEvents >= totalEvents * 0.75,
      targetDate: null,
      description: `${Math.round(totalEvents * 0.75)} events completed`
    },
    {
      title: 'Project Complete',
      achieved: completedEvents >= totalEvents,
      targetDate: null,
      description: 'All events completed'
    }
  ];
}

function generateResourceRecommendations(instructors, venues, groupDistribution) {
  const recommendations = [];
  
  // Check instructor workload
  const overloadedInstructors = instructors.filter(i => i.totalEvents > 10);
  if (overloadedInstructors.length > 0) {
    recommendations.push({
      type: 'instructor_workload',
      message: `${overloadedInstructors.length} instructors may be overloaded`,
      action: 'Consider redistributing events or hiring additional instructors'
    });
  }
  
  // Check group sizes
  if (groupDistribution.small > groupDistribution.medium + groupDistribution.large) {
    recommendations.push({
      type: 'group_consolidation',
      message: 'Many small groups detected',
      action: 'Consider consolidating smaller groups for better efficiency'
    });
  }
  
  return recommendations;
}

function eventsOverlap(event1, event2) {
  const start1 = new Date(event1.start);
  const end1 = new Date(event1.end || event1.start);
  const start2 = new Date(event2.start);
  const end2 = new Date(event2.end || event2.start);
  
  return start1 < end2 && start2 < end1;
}

function calculateConflictSeverity(event1, event2) {
  // Check if same instructor, venue, or participants
  let severity = 'low';

  // Extract instructors from both event structures
  const event1Instructors = event1.instructors ||
    (event1.event_instructors?.map(ei => ei.instructor).filter(Boolean)) ||
    [];
  const event2Instructors = event2.instructors ||
    (event2.event_instructors?.map(ei => ei.instructor).filter(Boolean)) ||
    [];

  if (event1Instructors.some(i1 => event2Instructors.some(i2 => i1.id === i2.id))) {
    severity = 'high';
  } else if (event1.venue === event2.venue && event1.venue) {
    severity = 'medium';
  }

  return severity;
}

function identifySchedulingGaps(events) {
  // Find periods with no events that could be utilized
  return [];
}

function generateSchedulingRecommendations(timeAnalysis) {
  return {
    recommendedHours: timeAnalysis.busyHours.indexOf(Math.min(...timeAnalysis.busyHours)),
    recommendedDays: ['Tuesday', 'Wednesday', 'Thursday'], // Based on typical patterns
    avoidHours: timeAnalysis.busyHours.indexOf(Math.max(...timeAnalysis.busyHours))
  };
}

function calculateEngagementScore(engagement) {
  const total = Object.values(engagement.engagementLevels || {})
    .reduce((sum, level) => sum + level.length, 0);
  
  if (total === 0) return 0;
  
  const high = engagement.engagementLevels?.high?.length || 0;
  const medium = engagement.engagementLevels?.medium?.length || 0;
  
  return Math.round(((high * 100 + medium * 70) / total) / 100 * 100);
}

function calculateResourceScore(resources) {
  // Calculate based on resource distribution and utilization
  return 75; // Placeholder
}

function getHealthStatus(score, thresholds) {
  if (score >= thresholds[1]) return 'excellent';
  if (score >= thresholds[0]) return 'good';
  return 'needs_attention';
}

function generateResourceSummary(resources) {
  return `${resources.instructors?.length || 0} instructors, ${resources.venues?.length || 0} venues`;
}

function identifyCriticalIssues(indicators) {
  return Object.entries(indicators)
    .filter(([key, indicator]) => indicator.status === 'needs_attention')
    .map(([key, indicator]) => ({
      area: key,
      score: indicator.score,
      details: indicator.details
    }));
}

function generateHealthRecommendations(indicators) {
  const recommendations = [];
  
  Object.entries(indicators).forEach(([key, indicator]) => {
    if (indicator.status === 'needs_attention') {
      switch (key) {
        case 'attendance':
          recommendations.push('Focus on improving attendance rates through engagement initiatives');
          break;
        case 'engagement':
          recommendations.push('Implement strategies to re-engage at-risk participants');
          break;
        case 'progress':
          recommendations.push('Review project timeline and accelerate completion of pending events');
          break;
        case 'capacity':
          recommendations.push('Optimize event capacity to improve utilization');
          break;
        case 'resources':
          recommendations.push('Review resource allocation and distribution');
          break;
      }
    }
  });

  return recommendations;
}

// ==============================|| PROJECT METADATA SELECTORS ||============================== //

/**
 * Select project info from project settings store
 */
export const selectProjectInfo = createSelector(
  [(state) => state.projectSettings?.projectInfo],
  (projectInfo) => projectInfo || null
);

/**
 * Select project dates and duration
 */
export const selectProjectDates = createSelector(
  [
    selectProjectInfo,
    (state) => state.projectSettings?.settings
  ],
  (projectInfo, settings) => {
    if (!projectInfo) return null;

    // Try to get dates from projectInfo first, then fall back to settings
    const startDate = projectInfo.startDate || settings?.startDate;
    const endDate = projectInfo.endDate || settings?.endDate;

    if (!startDate || !endDate) return null;

    // Calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      startDate,
      endDate,
      duration
    };
  }
);

/**
 * Select lead instructor
 */
export const selectLeadInstructor = createSelector(
  [(state) => state.projectSettings?.projectInstructors || []],
  (projectInstructors) => {
    if (!projectInstructors || projectInstructors.length === 0) {
      return null;
    }

    const leadInstructor = projectInstructors.find(
      (pi) => pi.instructorType === 'lead' || pi.instructorType === 'main'
    ) || projectInstructors[0];

    if (!leadInstructor?.instructor) return null;

    return {
      id: leadInstructor.instructor.id,
      firstName: leadInstructor.instructor.firstName,
      lastName: leadInstructor.instructor.lastName,
      email: leadInstructor.instructor.email,
      phone: leadInstructor.instructor.phone,
      instructorType: leadInstructor.instructorType
    };
  }
);

/**
 * Select technical completion (checklist progress)
 * CQRS-compliant: Reads from RTK Query cache instead of legacy Redux state
 */
export const selectTechnicalCompletion = createSelector(
  [
    (state) => {
      // Get the current project ID from the active project
      const projectId = state.projectSettings?.projectInfo?.id;
      if (!projectId) return [];

      // CQRS: Read checklist data from RTK Query cache
      const checklistData = projectApi.endpoints.getProjectChecklist.select(projectId)(state);
      return checklistData?.data || [];
    }
  ],
  (checklistProgress) => {
    const totalItems = checklistProgress.length;
    const completedItems = checklistProgress.filter((item) => item.completed).length;

    const completionPercentage = totalItems > 0
      ? parseFloat(((completedItems / totalItems) * 100).toFixed(1))
      : 0;

    return {
      totalChecklistItems: totalItems,
      completedChecklistItems: completedItems,
      completionPercentage
    };
  }
);

/**
 * Select course completion rate (participant-course completion percentage)
 * CQRS-compliant: Reuses existing courseCompletionSelectors logic
 * Returns the overall completion rate matching Course Completion Tracker display
 */
export const selectCourseCompletionRate = createSelector(
  [selectCourseCompletionData],
  (completionData) => {
    return completionData?.overallCompletionRate ?? 0;
  }
);

/**
 * Comprehensive dashboard data - combines all selectors into one
 * This replaces the need for a separate dashboard API call
 */
export const selectCompleteDashboard = createSelector(
  [
    selectProjectInfo,
    selectProjectDates,
    selectLeadInstructor,
    selectTechnicalCompletion,
    selectDashboardOverview,
    selectProjectProgress,
    selectProjectHealth,
    selectAttendanceSummary
  ],
  (projectInfo, projectDates, leadInstructor, technicalCompletion, overview, progress, health, attendance) => ({
    // Project metadata
    projectInfo: projectInfo ? {
      id: projectInfo.id,
      title: projectInfo.title,
      summary: projectInfo.summary,
      projectStatus: projectInfo.projectStatus,
      projectType: projectInfo.projectType,
      projectCategory: projectInfo.projectCategory,
      language: projectInfo.language,
      location: projectInfo.location,
      trainingRecipientId: projectInfo.trainingRecipientId,
      training_recipient: projectInfo.training_recipient,
      createdAt: projectInfo.createdAt,
      lastUpdated: projectInfo.lastUpdated
    } : null,

    // Metrics
    metrics: {
      // Counts from Redux store
      participantsCount: overview.keyMetrics.totalParticipants,
      sessionsCount: overview.keyMetrics.totalEvents,
      groupsCount: overview.keyMetrics.totalGroups,

      // Dates and duration
      projectDates,

      // Training recipient
      trainingRecipient: projectInfo?.training_recipient || null,

      // Lead instructor
      projectLeadInstructor: leadInstructor,

      // Technical completion
      technicalCompletion,

      // Overall completion
      overallCompletion: {
        isCompleted: projectInfo?.projectStatus === 'completed',
        status: projectInfo?.projectStatus,
        completionPercentage: parseFloat(
          ((30 + technicalCompletion.completionPercentage + attendance.attendanceRate) / 3).toFixed(1)
        ),
        breakdown: {
          learning: 30, // TODO: Calculate from module/activity completion
          technical: technicalCompletion.completionPercentage,
          attendance: Math.round(attendance.attendanceRate)
        }
      },

      // Attendance metrics
      attendanceRate: {
        totalSessions: overview.keyMetrics.totalEvents,
        totalParticipants: overview.keyMetrics.totalParticipants,
        totalPossibleAttendees: overview.keyMetrics.totalEvents * overview.keyMetrics.totalParticipants,
        actualAttendees: attendance.overallStats?.present + attendance.overallStats?.late || 0,
        attendancePercentage: Math.round(attendance.attendanceRate)
      }
    },

    // Dashboard overview
    overview,

    // Progress tracking
    progress,

    // Health indicators
    health,

    // Attendance details
    attendance,

    timestamp: new Date().toISOString(),
    version: '2.0.0' // Updated to indicate computed from selectors
  })
);