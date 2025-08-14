import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, curriculumId, assignedBy } = req.body;

    // Validate required fields
    if (!groupId || !curriculumId) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'groupId and curriculumId are required'
      });
    }

    // Check if group exists
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      include: { project: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if curriculum exists
    const curriculum = await prisma.curriculums.findUnique({
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    // Check if curriculum is already assigned to this group
    const existingAssignment = await prisma.group_curriculums.findUnique({
      where: {
        groupId_curriculumId: {
          groupId: parseInt(groupId),
          curriculumId: parseInt(curriculumId)
        }
      }
    });

    if (existingAssignment) {
      return res.status(409).json({ 
        error: 'Curriculum already assigned to group',
        details: 'This curriculum is already assigned to the specified group'
      });
    }

    // Create the group-curriculum assignment
    const assignment = await prisma.group_curriculums.create({
      data: {
        groupId: parseInt(groupId),
        curriculumId: parseInt(curriculumId),
        assignedBy: assignedBy || 'system',
        isActive: true
      },
      include: {
        group: {
          select: {
            id: true,
            groupName: true,
            chipColor: true,
            projectId: true
          }
        },
        curriculum: {
          select: {
            id: true,
            title: true,
            description: true,
            curriculum_courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Curriculum successfully assigned to group',
      assignment
    });

  } catch (error) {
    console.error('Error assigning curriculum to group:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Duplicate assignment',
        details: 'This curriculum is already assigned to the group'
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to assign curriculum to group"
    });
  }
}