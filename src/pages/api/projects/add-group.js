import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { newGroup, groups, index } = req.body;
    
    if (!newGroup || !newGroup.groupName) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Get the project ID from the Redux state index (this needs to be passed)
    // For now, we need to get the project ID somehow
    const projectId = req.body.projectId; // This should be passed from frontend
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Create the group in the database
    const createdGroup = await prisma.groups.create({
      data: {
        groupName: newGroup.groupName,
        chipColor: newGroup.chipColor || '#1976d2',
        projectId: parseInt(projectId),
      }
    });

    // Add participants to the group if any were selected
    if (newGroup.employees && newGroup.employees.length > 0) {
      const groupParticipants = newGroup.employees.map(employee => ({
        groupId: createdGroup.id,
        participantId: employee.id,
      }));

      await prisma.group_participants.createMany({
        data: groupParticipants,
        skipDuplicates: true, // Avoid conflicts if participant already in group
      });
    }

    // Automatically assign all project curriculums to the new group
    const projectCurriculums = await prisma.project_curriculums.findMany({
      where: { projectId: parseInt(projectId) },
      select: { curriculumId: true }
    });

    if (projectCurriculums.length > 0) {
      const groupCurriculums = projectCurriculums.map(pc => ({
        groupId: createdGroup.id,
        curriculumId: pc.curriculumId,
        isActive: true,
        assignedAt: new Date(),
        assignedBy: 'system'
      }));

      await prisma.group_curriculums.createMany({
        data: groupCurriculums,
        skipDuplicates: true
      });
    }

    // Fetch the complete group with participants and curriculums
    const groupWithParticipants = await prisma.groups.findUnique({
      where: { id: createdGroup.id },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        group_curriculums: {
          include: {
            curriculum: true,
          },
        },
      },
    });

    // Fetch all groups for this project to return complete list
    const allProjectGroups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        group_curriculums: {
          include: {
            curriculum: true,
          },
        },
      },
    });
    
    const result = {
      newGroupsArray: allProjectGroups,
      projectIndex: index,
      createdGroup: groupWithParticipants,
      projectId: parseInt(projectId)
    };

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group', details: error.message });
  }
}