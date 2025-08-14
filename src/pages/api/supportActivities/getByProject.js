import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: 'Project ID is required' 
      });
    }

    // Get all curriculums for this project
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      select: {
        project_curriculums: {
          select: {
            curriculum: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Get all support activities for all curriculums in this project
    const curriculumIds = project.project_curriculums.map(pc => pc.curriculum.id);
    
    if (curriculumIds.length === 0) {
      return res.status(200).json({
        success: true,
        supportActivities: []
      });
    }

    const supportActivities = await prisma.supportActivities.findMany({
      where: {
        curriculumId: {
          in: curriculumIds
        },
        isActive: true
      },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { activityType: 'asc' },
        { title: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      supportActivities
    });

  } catch (error) {
    console.error('Error fetching support activities for project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch support activities',
      error: error.message 
    });
  }
}