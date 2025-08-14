import { v4 as uuidv4 } from 'uuid';
export default function handler(req, res) {
  const { participants, newParticipant, groups, index, projectParticipant, projectId } = req.body;

  // Validate input data
  if (!Array.isArray(groups)) {
    return res.status(400).json({
      success: false,
      error: "Groups must be an array"
    });
  }

  if (!newParticipant) {
    return res.status(400).json({
      success: false,
      error: "Participant information is required"
    });
  }

  // Extract group name - handle both string and object formats
  const groupName = typeof newParticipant.group === 'string' 
    ? newParticipant.group 
    : newParticipant.group?.groupName;

  // Check if the group exists in the groups array (only if groupName is provided)
  const existingGroupIndex = groupName && groupName.trim() !== '' 
    ? groups.findIndex(group => group.groupName === groupName)
    : -1;

  const updatedGroups = () => {
    if (existingGroupIndex === -1) {
      // If no group is specified or group doesn't exist
      if (!groupName || groupName.trim() === '') {
        // No group specified - participant added as individual, return groups unchanged
        return groups;
      } else {
        // Group doesn't exist, create a new group and add it to the groups array
        const newGroup = {
          uuid: uuidv4(),
          groupName: groupName,
          employees: [newParticipant],
          courses: [],
          chipColor: "primary"
        };
        return [...groups, newGroup];
      }
    } else {
      // If group exists, add the participant to the existing group
      const existingGroup = groups[existingGroupIndex];
      
      // Handle both 'employees' and 'participants' properties
      const currentMembers = Array.isArray(existingGroup.employees) 
        ? existingGroup.employees 
        : Array.isArray(existingGroup.participants)
          ? existingGroup.participants
          : [];
      
      const updatedGroup = {
        ...existingGroup,
        employees: [...currentMembers, newParticipant],
        // Also update participants if it exists
        ...(existingGroup.participants && {
          participants: [...currentMembers, newParticipant]
        })
      };

      const updatedGroupsArray = [...groups];
      updatedGroupsArray.splice(existingGroupIndex, 1, updatedGroup);

      return updatedGroupsArray;
    }
  };


  try {
    const result = {
      participants: [projectParticipant, ...participants],
      index: index,
      updatedGroups: updatedGroups(), // Update the groups array with the new group
    };
    return res.status(200).json({ 
      success: true,
      ...result 
    });
  } catch (error) {
    console.error('Error in addParticipant:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to add participant to group",
      details: error.message
    });
  }
}