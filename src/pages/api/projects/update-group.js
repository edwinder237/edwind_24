import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, updates, projectId } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Check if group exists and belongs to the project
    const existingGroup = await prisma.groups.findFirst({
      where: {
        id: parseInt(groupId),
        projectId: parseInt(projectId)
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found or does not belong to this project' });
    }

    // Check if group name is unique within the project (if name is being updated)
    if (updates.groupName && updates.groupName !== existingGroup.groupName) {
      const existingGroupWithName = await prisma.groups.findFirst({
        where: {
          groupName: updates.groupName,
          projectId: parseInt(projectId),
          NOT: {
            id: parseInt(groupId)
          }
        }
      });

      if (existingGroupWithName) {
        return res.status(400).json({ error: 'Group name already exists in this project' });
      }
    }

    // Update the group
    const updatedGroup = await prisma.groups.update({
      where: { id: parseInt(groupId) },
      data: {
        ...(updates.groupName && { groupName: updates.groupName }),
        ...(updates.chipColor && { chipColor: updates.chipColor })
      },
      include: {
        participants: {
          include: {
            participant: true,
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
      },
    });
    
    const result = {
      updatedGroup,
      allProjectGroups,
      projectId: parseInt(projectId)
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group', details: error.message });
  }
}