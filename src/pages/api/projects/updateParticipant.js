import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  const { index, id, value, participants, groups } = req.body;

  const updatedParticipants = participants.map((person) => {
    if (person.uuid === id) {
      return { ...person, group: value };
    }
    return person;
  });

  function filterGroupsFromParticipants() {
    const uniqueGroupsKeys = Array.from(new Set(updatedParticipants.map(employee => employee.group)));
    return uniqueGroupsKeys.map(groupName => {
      return {
        uuid: uuidv4(),
        groupName: groupName,
        employees: updatedParticipants.filter(employee => employee.group === groupName),
        courses: []
      };
    });
  }

  const allGroups = filterGroupsFromParticipants();

  const updatedProjectsArray = participants.map((Project, i) => {
    if (i === index) {
      return { ...Project, groups: allGroups.find(group => group.groupName === value) };
    }
    return Project;
  });

  const result = {
    participant: id,
    projectIndex: index,
    value: value,
    participantsArray: updatedParticipants,
    groups: allGroups
  };

  //console.log(allGroups);
  return res.status(200).json({ ...result });
}
