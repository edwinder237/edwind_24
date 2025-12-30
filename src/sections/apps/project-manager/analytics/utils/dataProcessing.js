// Apply sorting to training records (filtering is handled by API)
export const applySorting = (trainingRecords, sortBy, sortOrder) => {
  if (!trainingRecords || trainingRecords.length === 0) {
    return [];
  }

  const results = [...trainingRecords];
  
  // Apply sorting
  results.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'completionDate') {
      aVal = aVal ? new Date(aVal) : new Date(0);
      bVal = bVal ? new Date(bVal) : new Date(0);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return results;
};

// Helper function to format display value (show actual data if 1 item, count if multiple)
const formatDisplayValue = (set, singularLabel, pluralLabel) => {
  if (set.size === 1) {
    return Array.from(set)[0];
  } else if (set.size > 1) {
    return `${set.size} ${pluralLabel}`;
  }
  return `0 ${pluralLabel}`;
};

// Group results for display
export const getGroupedResults = (filteredResults, groupBy) => {
  if (groupBy === 'none') {
    return filteredResults;
  }

  let groupKey = '';
  switch (groupBy) {
    case 'instructors':
      groupKey = 'instructorName';
      break;
    case 'companies':
      groupKey = 'participantCompany';
      break;
    case 'participants':
      groupKey = 'participantName';
      break;
    case 'courses':
      groupKey = 'courseName';
      break;
    case 'status':
      groupKey = 'status';
      break;
    case 'roles':
      groupKey = 'participantRole';
      break;
    case 'trainingRecipients':
      groupKey = 'participantTrainingRecipient';
      break;
    case 'projects':
      groupKey = 'projectName';
      break;
    default:
      groupKey = 'participantName';
  }

  // Group the results and create summary rows
  const groups = {};
  filteredResults.forEach(record => {
    const groupValue = record[groupKey] || 'Unknown';
    if (!groups[groupValue]) {
      groups[groupValue] = {
        [groupKey]: groupValue,
        records: [],
        companies: new Set(),
        participants: new Set(),
        courses: new Set(),
        instructors: new Set(),
        roles: new Set(),
        trainingRecipients: new Set(),
        projects: new Set(),
        statuses: new Set(),
        totalDuration: 0,
        scores: [],
        completionDates: []
      };
    }
    
    const group = groups[groupValue];
    group.records.push(record);
    group.companies.add(record.participantCompany);
    group.participants.add(record.participantName);
    group.courses.add(record.courseName);
    group.instructors.add(record.instructorName);
    group.roles.add(record.participantRole);
    group.trainingRecipients.add(record.participantTrainingRecipient);
    group.projects.add(record.projectName);
    group.statuses.add(record.status);
    group.totalDuration += record.duration || 0;
    if (record.score) group.scores.push(record.score);
    group.completionDates.push(record.completionDate);
  });

  // Convert to summary records with grouped column first
  return Object.values(groups).map(group => {
    const baseRecord = {
      id: `group-${group[groupKey]}`,
      duration: group.totalDuration,
      completionDate: groupBy === 'none' ? group.completionDates[0] : `${group.records.length} Records`,
      score: group.scores.length > 0 ? Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length) : null,
      isGroupRow: true,
      recordCount: group.records.length
    };

    // Set the grouped column as the primary value and others as counts
    switch (groupBy) {
      case 'participants':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: group[groupKey],
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'companies':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: group[groupKey],
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'instructors':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: group[groupKey],
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'courses':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: group[groupKey],
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'roles':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: group[groupKey],
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'trainingRecipients':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: group[groupKey],
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'projects':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: group[groupKey],
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
      case 'status':
        return {
          ...baseRecord,
          primaryValue: group[groupKey],
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: group[groupKey]
        };
      default:
        return {
          ...baseRecord,
          participantName: formatDisplayValue(group.participants, 'Participant', 'Participants'),
          participantCompany: formatDisplayValue(group.companies, 'Company', 'Companies'),
          participantRole: formatDisplayValue(group.roles, 'Role', 'Roles'),
          participantTrainingRecipient: formatDisplayValue(group.trainingRecipients, 'Recipient', 'Recipients'),
          projectName: formatDisplayValue(group.projects, 'Project', 'Projects'),
          courseName: formatDisplayValue(group.courses, 'Course', 'Courses'),
          instructorName: formatDisplayValue(group.instructors, 'Instructor', 'Instructors'),
          status: formatDisplayValue(group.statuses, 'Status', 'Statuses')
        };
    }
  }).sort((a, b) => {
    const aVal = a.primaryValue || a.participantName;
    const bVal = b.primaryValue || b.participantName;
    return aVal.localeCompare(bVal);
  });
};

// Get column order based on grouping
export const getColumnOrder = (groupBy) => {
  const allColumns = [
    { key: 'participantName', label: 'Participant', sortKey: 'participantName' },
    { key: 'participantCompany', label: 'Company', sortKey: 'participantCompany' },
    { key: 'participantRole', label: 'Role', sortKey: 'participantRole' },
    { key: 'participantTrainingRecipient', label: 'Training Recipient', sortKey: 'participantTrainingRecipient' },
    { key: 'projectName', label: 'Project', sortKey: 'projectName' },
    { key: 'courseName', label: 'Course', sortKey: 'courseName' },
    { key: 'duration', label: 'Duration (min)', sortKey: 'duration' },
    { key: 'instructorName', label: 'Instructor', sortKey: 'instructorName' },
    { key: 'completionDate', label: 'Completion Date', sortKey: 'completionDate' },
    { key: 'status', label: 'Status', sortKey: 'status' },
    { key: 'score', label: 'Score', sortKey: 'score' },
    { key: 'assessmentAttempts', label: 'Attempts', sortKey: 'assessmentAttempts' },
    { key: 'assessmentDate', label: 'Assessment Date', sortKey: 'assessmentDate' }
  ];

  if (groupBy === 'none') return allColumns;

  // Find the grouped column and move it to first position
  const groupedColumnKey = {
    'participants': 'participantName',
    'companies': 'participantCompany',
    'roles': 'participantRole',
    'trainingRecipients': 'participantTrainingRecipient',
    'projects': 'projectName',
    'courses': 'courseName',
    'instructors': 'instructorName',
    'status': 'status'
  }[groupBy];

  const groupedColumn = allColumns.find(col => col.key === groupedColumnKey);
  const otherColumns = allColumns.filter(col => col.key !== groupedColumnKey);

  return [groupedColumn, ...otherColumns];
};

// Calculate summary statistics
export const getSummaryStats = (filteredResults) => {
  const totalRecords = filteredResults.length;
  const completedRecords = filteredResults.filter(r => r.status === 'Completed').length;
  const inProgressRecords = filteredResults.filter(r => r.status === 'Scheduled').length;
  const notCompletedRecords = filteredResults.filter(r => r.status === 'Not Completed').length;
  const totalDuration = filteredResults.reduce((sum, r) => sum + (r.duration || 0), 0);
  const averageScore = filteredResults.filter(r => r.score).length > 0 
    ? Math.round(filteredResults.filter(r => r.score).reduce((sum, r) => sum + r.score, 0) / filteredResults.filter(r => r.score).length)
    : 0;
  const uniqueParticipants = new Set(filteredResults.map(r => r.participantId)).size;
  const uniqueCourses = new Set(filteredResults.map(r => r.courseId)).size;
  const uniqueCompanies = new Set(filteredResults.map(r => r.participantCompany)).size;

  return {
    totalRecords,
    completedRecords,
    inProgressRecords,
    notCompletedRecords,
    totalDuration,
    averageScore,
    uniqueParticipants,
    uniqueCourses,
    uniqueCompanies
  };
};

// Generate sign-off sheet data
export const generateSignOffSheetData = (filteredResults, courseId) => {
  const courseResults = filteredResults.filter(r => r.courseId === courseId);
  
  if (courseResults.length === 0) {
    return null;
  }

  const firstRecord = courseResults[0];

  return {
    courseName: firstRecord.courseName,
    duration: firstRecord.duration,
    instructor: firstRecord.instructorName,
    completionDate: firstRecord.completionDate,
    participants: courseResults.map(r => ({
      name: r.participantName,
      department: r.participantDepartment,
      company: r.participantCompany,
      role: r.participantRole,
      trainingRecipient: r.participantTrainingRecipient,
      score: r.score,
      status: r.status
    }))
  };
};

// Export data to CSV
export const exportToCSV = (data, filename = 'training-report') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Define column headers based on the data structure
  const headers = [
    'PARTICIPANT',
    'COMPANY',
    'ROLE',
    'TRAINING RECIPIENT',
    'PROJECT',
    'COURSE',
    'DURATION (MIN)',
    'INSTRUCTOR',
    'COMPLETION DATE',
    'STATUS',
    'SCORE',
    'ATTEMPTS',
    'ASSESSMENT DATE'
  ];

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      const values = [
        row.participantName || '',
        row.participantCompany || '',
        row.participantRole || '',
        row.participantTrainingRecipient || '',
        row.projectName || '',
        row.courseName || '',
        row.duration || '0',
        row.instructorName || 'No Instructor',
        row.completionDate ? new Date(row.completionDate).toLocaleDateString() : '',
        row.status || '',
        row.score !== undefined && row.score !== null ? row.score : '',
        row.assessmentAttempts || '',
        row.assessmentDate || ''
      ];
      
      // Escape values that contain commas or quotes
      const escapedValues = values.map(val => {
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      });
      
      return escapedValues.join(',');
    })
  ].join('\n');

  // Create a blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};