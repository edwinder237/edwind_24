import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, curriculumId } = req.body;

    // Validate required fields
    if (!groupId || !curriculumId) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'groupId and curriculumId are required'
      });
    }

    // Check if the assignment exists
    const existingAssignment = await prisma.group_curriculums.findUnique({
      where: {
        groupId_curriculumId: {
          groupId: parseInt(groupId),
          curriculumId: parseInt(curriculumId)
        }
      },
      include: {
        group: {
          select: {
            id: true,
            groupName: true,
            projectId: true
          }
        },
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!existingAssignment) {
      return res.status(404).json({ 
        error: 'Assignment not found',
        details: 'This curriculum is not assigned to the specified group'
      });
    }

    // Remove the assignment
    await prisma.group_curriculums.delete({
      where: {
        groupId_curriculumId: {
          groupId: parseInt(groupId),
          curriculumId: parseInt(curriculumId)
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum successfully removed from group',
      removedAssignment: {
        groupId: existingAssignment.group.id,
        groupName: existingAssignment.group.groupName,
        curriculumId: existingAssignment.curriculum.id,
        curriculumTitle: existingAssignment.curriculum.title
      }
    });

  } catch (error) {
    console.error('Error removing curriculum from group:', error);
    
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to remove curriculum from group"
    });
  }
}