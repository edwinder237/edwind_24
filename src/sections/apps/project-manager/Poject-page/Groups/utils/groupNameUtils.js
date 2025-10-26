/**
 * Utility functions for group name generation and management
 */

export const getInitialValues = (customer, isMultipleMode = false) => {
  const defaultColor = '#1976d2'; // Default blue color
  
  return {
    groupName: '',
    participants: '',
    courses: '',
    chipColor: defaultColor,
    // For multiple groups mode
    groupNames: isMultipleMode ? [''] : [],
    bulkChipColor: defaultColor,
    // For sequential groups creation
    useSequentialNaming: false,
    sequentialCount: 3,
    sequentialPrefix: 'Group'
  };
};

export const generateSequentialGroupNames = (prefix, count, existingNames) => {
  const groupNamesToCreate = [];
  let startingNumber = 1;
  
  // Find the next available number for the prefix
  while (existingNames.includes(`${prefix} ${startingNumber}`)) {
    startingNumber++;
  }
  
  // Generate the sequential names
  for (let i = 0; i < count; i++) {
    const groupName = `${prefix} ${startingNumber + i}`;
    // Double-check the name doesn't exist (in case of concurrent operations)
    if (!existingNames.includes(groupName)) {
      groupNamesToCreate.push(groupName);
    }
  }
  
  return groupNamesToCreate;
};

export const processGroupNames = (values, groupsInState) => {
  if (values.useSequentialNaming) {
    // Generate sequential group names
    const existingNames = groupsInState.map(group => group.groupName);
    const prefix = values.sequentialPrefix || 'Group';
    return generateSequentialGroupNames(prefix, values.sequentialCount, existingNames);
  } else {
    // Use manually entered group names
    const validGroupNames = values.groupNames.filter(name => name.trim() !== '');
    // Remove duplicates from the array
    return [...new Set(validGroupNames)];
  }
};

export const createGroupsFromNames = (groupNames, chipColor) => {
  return groupNames.map(groupName => ({
    groupName: groupName.trim(),
    employees: [],
    courses: [],
    chipColor
  }));
};