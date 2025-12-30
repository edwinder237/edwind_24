/**
 * ============================================
 * POST /api/projects/updateParticipant
 * ============================================
 *
 * Legacy client-side optimistic update endpoint for updating participant groups.
 * NOTE: This is a mock endpoint that returns client-provided data without persistence.
 * The actual participant updates happen via participants/updateParticipant.js.
 * FIXED: Added org scope middleware for consistency.
 */

import { v4 as uuidv4 } from 'uuid';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
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

  return res.status(200).json({ ...result });
}

export default withOrgScope(asyncHandler(handler));
