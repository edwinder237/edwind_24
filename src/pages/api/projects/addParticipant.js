import { v4 as uuidv4 } from 'uuid';
export default function handler(req, res) {
  const { participants, newParticipant, groups, index,projectParticipant,projectId } = req.body;

  // Check if newParticipant.group.groupName is present in the groups array
  const existingGroupIndex = groups.findIndex(group => group.groupName === newParticipant.group.groupName);

  const updatedGroups =()=>{
    if (existingGroupIndex === -1) {
      // If groupName is not present, create a new group and add it to the groups array
      const newGroup = {
        uuid: uuidv4(),
        groupName: newParticipant?.group?.groupName,
        employees: [newParticipant],
        courses:[],
        chipColor: "primary"
      };
      return  [...groups, newGroup];
    }else {
      // If groupName is present, return the groups array updated with newParticipant at the groups index from existingGroupIndex
         
      const updatedGroup = {
        ...groups[existingGroupIndex],
        employees: [...groups[existingGroupIndex].employees, newParticipant],
      };

      const updatedGroupsArray = [...groups];
      updatedGroupsArray.splice(existingGroupIndex, 1, updatedGroup);

      return updatedGroupsArray;
    }
  };


  
    const result = {
      participants: [projectParticipant, ...participants],
      index: index,
      updatedGroups: updatedGroups(), // Update the groups array with the new group
    };
  return res.status(200).json({ ...result });

}