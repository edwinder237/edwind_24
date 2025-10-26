/**
 * Attendance Derived Selectors
 * 
 * Complex selectors that derive attendance insights from normalized entities.
 * These selectors combine data from events, participants, and groups to provide
 * rich analytics and computed views.
 */

import { createSelector } from '@reduxjs/toolkit';
import { entitySelectors } from '../entities';

// ==============================|| BASE SELECTORS ||============================== //

// Use existing Redux stores for compatibility
const selectAllEvents = (state) => state.projectAgenda?.events || [];
const selectAllParticipants = (state) => state.projectAgenda?.participants || [];
const selectAllGroups = (state) => state.projectAgenda?.groups || [];

// Fallback to normalized entities if available
const selectAllEventsNormalized = entitySelectors.events.selectAllEvents;
const selectAllParticipantsNormalized = entitySelectors.participants.selectAllParticipants;
const selectAllGroupsNormalized = entitySelectors.groups.selectAllGroups;

// ==============================|| ATTENDANCE ANALYTICS ||============================== //

/**
 * Comprehensive attendance summary across all events
 */
export const selectAttendanceSummary = createSelector(
  [selectAllEvents, selectAllParticipants],
  (events, participants) => {
    const summary = {
      totalEvents: events.length,
      totalParticipants: participants.length,
      totalAttendanceRecords: 0,
      overallStats: {
        present: 0,
        absent: 0,
        late: 0,
        scheduled: 0
      },
      attendanceRate: 0,
      trendsLastWeek: [],
      problemParticipants: [],
      perfectAttendees: []
    };

    // Participant attendance tracking
    const participantAttendance = new Map();
    participants.forEach(p => {
      participantAttendance.set(p.id, {
        participant: p,
        totalEvents: 0,
        present: 0,
        absent: 0,
        late: 0,
        scheduled: 0,
        rate: 0
      });
    });

    // Process all events
    events.forEach(event => {
      if (event.event_attendees) {
        event.event_attendees.forEach(ea => {
          const status = ea.attendance_status || 'scheduled';
          summary.overallStats[status]++;
          summary.totalAttendanceRecords++;

          // Track individual participant - use enrollee's participant ID
          const participantId = ea.enrollee?.id; // This is the project_participant ID
          const pStats = participantAttendance.get(participantId);
          if (pStats) {
            pStats.totalEvents++;
            pStats[status]++;
          }
        });
      }
    });

    // Calculate individual attendance rates
    participantAttendance.forEach(stats => {
      if (stats.totalEvents > 0) {
        stats.rate = ((stats.present + stats.late) / stats.totalEvents) * 100;
        
        // Identify problem participants (< 70% attendance)
        if (stats.rate < 70 && stats.totalEvents >= 3) {
          summary.problemParticipants.push(stats);
        }
        
        // Identify perfect attendees (100% attendance, min 3 events)
        if (stats.rate === 100 && stats.totalEvents >= 3) {
          summary.perfectAttendees.push(stats);
        }
      }
    });

    // Overall attendance rate
    const totalAttended = summary.overallStats.present + summary.overallStats.late;
    summary.attendanceRate = summary.totalAttendanceRecords > 0
      ? (totalAttended / summary.totalAttendanceRecords) * 100
      : 0;

    // Sort problem participants by worst attendance
    summary.problemParticipants.sort((a, b) => a.rate - b.rate);
    
    // Sort perfect attendees by most events attended
    summary.perfectAttendees.sort((a, b) => b.totalEvents - a.totalEvents);

    return summary;
  }
);

/**
 * Daily attendance trends for the current month
 */
export const selectDailyAttendanceTrends = createSelector(
  [selectAllEvents],
  (events) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const dailyStats = new Map();
    
    events.forEach(event => {
      const eventDate = new Date(event.start);
      if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
        const dateKey = eventDate.toLocaleDateString();
        
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, {
            date: dateKey,
            events: 0,
            totalParticipants: 0,
            present: 0,
            absent: 0,
            late: 0,
            scheduled: 0,
            rate: 0
          });
        }
        
        const dayStats = dailyStats.get(dateKey);
        dayStats.events++;
        
        if (event.event_attendees) {
          event.event_attendees.forEach(ea => {
            const status = ea.attendance_status || 'scheduled';
            dayStats.totalParticipants++;
            dayStats[status]++;
          });
          
          // Calculate attendance rate for this day
          const attended = dayStats.present + dayStats.late;
          dayStats.rate = dayStats.totalParticipants > 0 
            ? (attended / dayStats.totalParticipants) * 100 
            : 0;
        }
      }
    });
    
    return Array.from(dailyStats.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
);

/**
 * Group-based attendance comparison
 */
export const selectGroupAttendanceComparison = createSelector(
  [selectAllEvents, selectAllGroups],
  (events, groups) => {
    const groupStats = new Map();
    
    // Initialize group stats
    groups.forEach(group => {
      groupStats.set(group.id, {
        group,
        totalEvents: 0,
        totalParticipants: 0,
        present: 0,
        absent: 0,
        late: 0,
        scheduled: 0,
        attendanceRate: 0,
        participantCount: group.participants?.length || 0
      });
    });
    
    // Process events to gather attendance by group
    events.forEach(event => {
      if (event.groups) {
        event.groups.forEach(eventGroup => {
          const groupStat = groupStats.get(eventGroup.id);
          if (groupStat) {
            groupStat.totalEvents++;
            
            // Find participants from this group in this event
            if (event.event_attendees) {
              event.event_attendees.forEach(ea => {
                // Check if participant belongs to this group
                const group = groups.find(g => g.id === eventGroup.id);
                const projectParticipantId = ea.enrollee?.id;
                if (group?.participants?.some(gp => gp.id === projectParticipantId)) {
                  const status = ea.attendance_status || 'scheduled';
                  groupStat.totalParticipants++;
                  groupStat[status]++;
                }
              });
            }
          }
        });
      }
    });
    
    // Calculate attendance rates
    groupStats.forEach(stats => {
      const attended = stats.present + stats.late;
      stats.attendanceRate = stats.totalParticipants > 0 
        ? (attended / stats.totalParticipants) * 100 
        : 0;
    });
    
    return Array.from(groupStats.values())
      .filter(stats => stats.totalEvents > 0)
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }
);

// ==============================|| EVENT ANALYTICS ||============================== //

/**
 * Event capacity and utilization analysis
 */
export const selectEventCapacityAnalysis = createSelector(
  [selectAllEvents],
  (events) => {
    const analysis = {
      totalEvents: events.length,
      averageCapacity: 0,
      averageUtilization: 0,
      underutilizedEvents: [],
      oversubscribedEvents: [],
      capacityTrends: [],
      recommendations: []
    };
    
    let totalCapacity = 0;
    let totalParticipants = 0;
    
    events.forEach(event => {
      const capacity = event.maxParticipants || event.capacity || 0;
      const enrolled = event.event_attendees?.length || 0;
      const utilization = capacity > 0 ? (enrolled / capacity) * 100 : 0;
      
      totalCapacity += capacity;
      totalParticipants += enrolled;
      
      // Track underutilized events (< 60% capacity)
      if (utilization < 60 && capacity > 0) {
        analysis.underutilizedEvents.push({
          event,
          capacity,
          enrolled,
          utilization,
          availableSpots: capacity - enrolled
        });
      }
      
      // Track oversubscribed events (> 100% capacity)
      if (utilization > 100) {
        analysis.oversubscribedEvents.push({
          event,
          capacity,
          enrolled,
          utilization,
          overflow: enrolled - capacity
        });
      }
    });
    
    analysis.averageCapacity = events.length > 0 ? totalCapacity / events.length : 0;
    analysis.averageUtilization = totalCapacity > 0 ? (totalParticipants / totalCapacity) * 100 : 0;
    
    // Sort by most underutilized first
    analysis.underutilizedEvents.sort((a, b) => a.utilization - b.utilization);
    
    // Sort by most oversubscribed first
    analysis.oversubscribedEvents.sort((a, b) => b.utilization - a.utilization);
    
    // Generate recommendations
    if (analysis.underutilizedEvents.length > 0) {
      analysis.recommendations.push({
        type: 'underutilization',
        message: `${analysis.underutilizedEvents.length} events are underutilized. Consider consolidating or promoting these sessions.`,
        priority: 'medium'
      });
    }
    
    if (analysis.oversubscribedEvents.length > 0) {
      analysis.recommendations.push({
        type: 'oversubscription',
        message: `${analysis.oversubscribedEvents.length} events are oversubscribed. Consider adding additional sessions.`,
        priority: 'high'
      });
    }
    
    return analysis;
  }
);

/**
 * Time-based event distribution analysis
 */
export const selectEventTimeDistribution = createSelector(
  [selectAllEvents],
  (events) => {
    const distribution = {
      hourlyDistribution: Array(24).fill(0),
      dailyDistribution: Array(7).fill(0), // 0 = Sunday
      monthlyDistribution: Array(12).fill(0),
      peakHours: [],
      peakDays: [],
      totalDuration: 0,
      averageDuration: 0
    };
    
    events.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      // Hour distribution
      distribution.hourlyDistribution[start.getHours()]++;
      
      // Day distribution (0 = Sunday)
      distribution.dailyDistribution[start.getDay()]++;
      
      // Month distribution
      distribution.monthlyDistribution[start.getMonth()]++;
      
      // Duration calculation
      if (event.end) {
        const duration = end.getTime() - start.getTime();
        distribution.totalDuration += duration;
      }
    });
    
    distribution.averageDuration = events.length > 0 
      ? distribution.totalDuration / events.length 
      : 0;
    
    // Find peak hours
    const maxHourlyEvents = Math.max(...distribution.hourlyDistribution);
    distribution.hourlyDistribution.forEach((count, hour) => {
      if (count === maxHourlyEvents && count > 0) {
        distribution.peakHours.push(hour);
      }
    });
    
    // Find peak days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDailyEvents = Math.max(...distribution.dailyDistribution);
    distribution.dailyDistribution.forEach((count, day) => {
      if (count === maxDailyEvents && count > 0) {
        distribution.peakDays.push(dayNames[day]);
      }
    });
    
    return distribution;
  }
);

// ==============================|| PARTICIPANT INSIGHTS ||============================== //

/**
 * Participant engagement and activity analysis
 */
export const selectParticipantEngagementAnalysis = createSelector(
  [selectAllParticipants, selectAllEvents],
  (participants, events) => {
    const analysis = {
      totalParticipants: participants.length,
      engagementLevels: {
        high: [], // 90%+ attendance
        medium: [], // 70-89% attendance
        low: [], // 50-69% attendance
        atRisk: [] // <50% attendance
      },
      averageEventsPerParticipant: 0,
      mostActiveParticipants: [],
      recentlyInactiveParticipants: [],
      newParticipants: []
    };
    
    const participantEventMap = new Map();
    let totalEventAssignments = 0;
    
    // Build participant event mapping
    events.forEach(event => {
      if (event.event_attendees) {
        event.event_attendees.forEach(ea => {
          const projectParticipantId = ea.enrollee?.id;
          if (!participantEventMap.has(projectParticipantId)) {
            participantEventMap.set(projectParticipantId, {
              participant: participants.find(p => p.id === projectParticipantId),
              events: [],
              totalEvents: 0,
              attended: 0,
              attendanceRate: 0,
              lastActivity: null
            });
          }
          
          const pData = participantEventMap.get(projectParticipantId);
          pData.events.push({
            event,
            status: ea.attendance_status || 'scheduled',
            date: new Date(event.start)
          });
          pData.totalEvents++;
          totalEventAssignments++;
          
          if (ea.attendance_status === 'present' || ea.attendance_status === 'late') {
            pData.attended++;
          }
          
          // Track last activity
          const eventDate = new Date(event.start);
          if (!pData.lastActivity || eventDate > pData.lastActivity) {
            pData.lastActivity = eventDate;
          }
        });
      }
    });
    
    // Calculate engagement levels
    participantEventMap.forEach(pData => {
      pData.attendanceRate = pData.totalEvents > 0 
        ? (pData.attended / pData.totalEvents) * 100 
        : 0;
      
      // Categorize by engagement level
      if (pData.attendanceRate >= 90) {
        analysis.engagementLevels.high.push(pData);
      } else if (pData.attendanceRate >= 70) {
        analysis.engagementLevels.medium.push(pData);
      } else if (pData.attendanceRate >= 50) {
        analysis.engagementLevels.low.push(pData);
      } else {
        analysis.engagementLevels.atRisk.push(pData);
      }
      
      // Check for recently inactive (no activity in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (pData.lastActivity && pData.lastActivity < thirtyDaysAgo) {
        analysis.recentlyInactiveParticipants.push(pData);
      }
      
      // Check for new participants (first event in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const firstEvent = pData.events.sort((a, b) => a.date - b.date)[0];
      if (firstEvent && firstEvent.date > sevenDaysAgo) {
        analysis.newParticipants.push(pData);
      }
    });
    
    analysis.averageEventsPerParticipant = participants.length > 0 
      ? totalEventAssignments / participants.length 
      : 0;
    
    // Most active participants (by total events)
    analysis.mostActiveParticipants = Array.from(participantEventMap.values())
      .sort((a, b) => b.totalEvents - a.totalEvents)
      .slice(0, 10);
    
    return analysis;
  }
);

// ==============================|| PERFORMANCE SELECTORS ||============================== //

/**
 * Overall performance metrics combining all entities
 */
export const selectOverallPerformanceMetrics = createSelector(
  [
    selectAttendanceSummary,
    selectEventCapacityAnalysis,
    selectParticipantEngagementAnalysis
  ],
  (attendance, capacity, engagement) => ({
    attendanceMetrics: {
      overallRate: attendance.attendanceRate,
      totalRecords: attendance.totalAttendanceRecords,
      problemParticipants: attendance.problemParticipants.length,
      perfectAttendees: attendance.perfectAttendees.length
    },
    capacityMetrics: {
      averageUtilization: capacity.averageUtilization,
      underutilizedEvents: capacity.underutilizedEvents.length,
      oversubscribedEvents: capacity.oversubscribedEvents.length,
      recommendations: capacity.recommendations.length
    },
    engagementMetrics: {
      highEngagement: engagement.engagementLevels.high.length,
      atRiskParticipants: engagement.engagementLevels.atRisk.length,
      recentlyInactive: engagement.recentlyInactiveParticipants.length,
      newParticipants: engagement.newParticipants.length
    },
    healthScore: calculateHealthScore(attendance, capacity, engagement)
  })
);

/**
 * Calculate overall system health score
 */
function calculateHealthScore(attendance, capacity, engagement) {
  let score = 0;
  let factors = 0;
  
  // Attendance factor (40% weight)
  if (attendance.attendanceRate >= 85) score += 40;
  else if (attendance.attendanceRate >= 70) score += 30;
  else if (attendance.attendanceRate >= 50) score += 20;
  else score += 10;
  factors += 40;
  
  // Capacity utilization factor (30% weight)
  if (capacity.averageUtilization >= 75 && capacity.averageUtilization <= 95) score += 30;
  else if (capacity.averageUtilization >= 60) score += 20;
  else score += 10;
  factors += 30;
  
  // Engagement factor (30% weight)
  const totalParticipants = Object.values(engagement.engagementLevels)
    .reduce((sum, level) => sum + level.length, 0);
  
  if (totalParticipants > 0) {
    const highEngagementRate = (engagement.engagementLevels.high.length / totalParticipants) * 100;
    if (highEngagementRate >= 70) score += 30;
    else if (highEngagementRate >= 50) score += 20;
    else if (highEngagementRate >= 30) score += 15;
    else score += 10;
  }
  factors += 30;
  
  return Math.round((score / factors) * 100);
}