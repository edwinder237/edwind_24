/**
 * Derived Selectors Index
 * 
 * Centralized access to all derived selectors that compute complex views
 * from normalized entity data. These selectors provide the foundation
 * for rich dashboard and analytics components.
 */

// Import all selector modules
import * as attendanceSelectors from './attendanceSelectors';
import * as dashboardSelectors from './dashboardSelectors';

// Re-export all selectors organized by domain
export const derivedSelectors = {
  // Attendance and participation analytics
  attendance: {
    // Summary metrics
    selectAttendanceSummary: attendanceSelectors.selectAttendanceSummary,
    selectDailyAttendanceTrends: attendanceSelectors.selectDailyAttendanceTrends,
    selectGroupAttendanceComparison: attendanceSelectors.selectGroupAttendanceComparison,
    
    // Event analytics
    selectEventCapacityAnalysis: attendanceSelectors.selectEventCapacityAnalysis,
    selectEventTimeDistribution: attendanceSelectors.selectEventTimeDistribution,
    
    // Participant insights
    selectParticipantEngagementAnalysis: attendanceSelectors.selectParticipantEngagementAnalysis,
    
    // Performance metrics
    selectOverallPerformanceMetrics: attendanceSelectors.selectOverallPerformanceMetrics
  },
  
  // Dashboard and overview analytics
  dashboard: {
    // Main dashboard views
    selectDashboardOverview: dashboardSelectors.selectDashboardOverview,
    selectProjectProgress: dashboardSelectors.selectProjectProgress,
    selectProjectHealth: dashboardSelectors.selectProjectHealth,

    // Comprehensive dashboard (replaces API call)
    selectCompleteDashboard: dashboardSelectors.selectCompleteDashboard,

    // Project metadata
    selectProjectInfo: dashboardSelectors.selectProjectInfo,
    selectProjectDates: dashboardSelectors.selectProjectDates,
    selectLeadInstructor: dashboardSelectors.selectLeadInstructor,
    selectTechnicalCompletion: dashboardSelectors.selectTechnicalCompletion,

    // Resource management
    selectResourceUtilization: dashboardSelectors.selectResourceUtilization,
    selectTimeAnalytics: dashboardSelectors.selectTimeAnalytics
  }
};

// Convenience exports for common selectors
export const {
  // Most commonly used selectors
  selectAttendanceSummary,
  selectDashboardOverview,
  selectProjectProgress,
  selectProjectHealth,
  selectCompleteDashboard,
  selectProjectInfo,
  selectProjectDates,
  selectLeadInstructor,
  selectTechnicalCompletion,
  selectParticipantEngagementAnalysis,
  selectEventCapacityAnalysis
} = {
  ...attendanceSelectors,
  ...dashboardSelectors
};

// Selector categories for dynamic UI generation
export const selectorCategories = [
  {
    name: 'attendance',
    title: 'Attendance & Participation',
    description: 'Track attendance patterns, engagement levels, and participation metrics',
    selectors: [
      'selectAttendanceSummary',
      'selectDailyAttendanceTrends',
      'selectGroupAttendanceComparison',
      'selectParticipantEngagementAnalysis'
    ]
  },
  {
    name: 'events',
    title: 'Event Management',
    description: 'Analyze event capacity, distribution, and scheduling optimization',
    selectors: [
      'selectEventCapacityAnalysis',
      'selectEventTimeDistribution',
      'selectTimeAnalytics'
    ]
  },
  {
    name: 'dashboard',
    title: 'Project Overview',
    description: 'High-level metrics and health indicators for project management',
    selectors: [
      'selectDashboardOverview',
      'selectProjectProgress',
      'selectProjectHealth',
      'selectCompleteDashboard',
      'selectProjectInfo',
      'selectProjectDates',
      'selectLeadInstructor',
      'selectTechnicalCompletion'
    ]
  },
  {
    name: 'resources',
    title: 'Resource Management',
    description: 'Track instructor workload, venue utilization, and resource allocation',
    selectors: [
      'selectResourceUtilization'
    ]
  },
  {
    name: 'performance',
    title: 'Performance Analytics',
    description: 'Overall system performance and optimization recommendations',
    selectors: [
      'selectOverallPerformanceMetrics'
    ]
  }
];

/**
 * Helper function to get all selectors by category
 */
export const getSelectorsByCategory = (category) => {
  const categoryConfig = selectorCategories.find(c => c.name === category);
  if (!categoryConfig) return {};
  
  const selectors = {};
  categoryConfig.selectors.forEach(selectorName => {
    if (attendanceSelectors[selectorName]) {
      selectors[selectorName] = attendanceSelectors[selectorName];
    } else if (dashboardSelectors[selectorName]) {
      selectors[selectorName] = dashboardSelectors[selectorName];
    }
  });
  
  return selectors;
};

/**
 * Meta-selector that provides information about all available derived selectors
 */
export const selectAvailableAnalytics = () => ({
  categories: selectorCategories.map(category => ({
    ...category,
    selectorCount: category.selectors.length
  })),
  totalSelectors: selectorCategories.reduce((sum, cat) => sum + cat.selectors.length, 0),
  lastUpdated: new Date().toISOString()
});

/**
 * Selector execution helper for dynamic analysis
 */
export const executeSelectorByName = (selectorName, state) => {
  const selector = attendanceSelectors[selectorName] || dashboardSelectors[selectorName];
  if (!selector) {
    throw new Error(`Selector "${selectorName}" not found`);
  }
  
  try {
    return {
      success: true,
      data: selector(state),
      selectorName,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      selectorName,
      executedAt: new Date().toISOString()
    };
  }
};

/**
 * Batch selector execution for dashboard loading
 */
export const executeBatchSelectors = (selectorNames, state) => {
  const results = {};
  const errors = [];
  
  selectorNames.forEach(selectorName => {
    try {
      const result = executeSelectorByName(selectorName, state);
      if (result.success) {
        results[selectorName] = result.data;
      } else {
        errors.push({ selectorName, error: result.error });
      }
    } catch (error) {
      errors.push({ selectorName, error: error.message });
    }
  });
  
  return {
    results,
    errors,
    successCount: Object.keys(results).length,
    errorCount: errors.length,
    executedAt: new Date().toISOString()
  };
};

/**
 * Performance monitoring for selector execution
 */
export const measureSelectorPerformance = (selectorName, state, iterations = 1) => {
  const selector = attendanceSelectors[selectorName] || dashboardSelectors[selectorName];
  if (!selector) {
    throw new Error(`Selector "${selectorName}" not found`);
  }
  
  const times = [];
  let result = null;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = selector(state);
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    selectorName,
    iterations,
    times,
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    lastResult: result,
    measuredAt: new Date().toISOString()
  };
};

/**
 * Selector dependency analysis
 */
export const analyzeSelectorDependencies = () => {
  return {
    attendance: {
      dependencies: ['participants', 'events', 'groups'],
      computesFor: ['dashboard', 'reports', 'analytics'],
      complexity: 'high'
    },
    dashboard: {
      dependencies: ['attendance', 'participants', 'events', 'groups', 'projectSettings'],
      computesFor: ['overview', 'health', 'progress', 'completeDashboard'],
      complexity: 'medium',
      note: 'selectCompleteDashboard replaces API call, computed from Redux store only'
    }
  };
};

// Default export with everything organized
export default {
  selectors: derivedSelectors,
  categories: selectorCategories,
  helpers: {
    getSelectorsByCategory,
    executeSelectorByName,
    executeBatchSelectors,
    measureSelectorPerformance,
    analyzeSelectorDependencies
  },
  meta: {
    selectAvailableAnalytics
  }
};