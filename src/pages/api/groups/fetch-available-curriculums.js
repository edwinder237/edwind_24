import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, projectId } = req.query;

    // Validate required fields
    if (!groupId) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'groupId is required'
      });
    }

    // Check if group exists
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      include: { 
        project: {
          select: {
            id: true,
            title: true,
            project_curriculums: {
              include: {
                curriculum: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get all curriculums already assigned to this group
    const assignedCurriculums = await prisma.group_curriculums.findMany({
      where: {
        groupId: parseInt(groupId),
        isActive: true
      },
      select: {
        curriculumId: true
      }
    });

    const assignedCurriculumIds = assignedCurriculums.map(ac => ac.curriculumId);

    // Get all curriculums that are assigned to the project but not to this specific group
    const projectCurriculums = group.project.project_curriculums || [];
    
    const availableCurriculums = projectCurriculums
      .filter(pc => !assignedCurriculumIds.includes(pc.curriculum.id))
      .map(pc => ({
        id: pc.curriculum.id,
        title: pc.curriculum.title,
        description: pc.curriculum.description,
        assignedToProject: pc.createdAt
      }));

    // Also get additional curriculums that might be available (optional: all curriculums)
    // For now, we'll focus on project-specific curriculums only

    res.status(200).json({
      success: true,
      group: {
        id: group.id,
        groupName: group.groupName,
        project: {
          id: group.project.id,
          title: group.project.title
        }
      },
      availableCurriculums,
      count: availableCurriculums.length,
      assignedCount: assignedCurriculumIds.length
    });

  } catch (error) {
    console.error('Error fetching available curriculums for group:', error);
    
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to fetch available curriculums"
    });
  }
}