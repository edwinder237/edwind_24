import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'projectId is required'
      });
    }

    // Check if project exists
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      select: { id: true, title: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch project settings
    let projectSettings = await prisma.project_settings.findUnique({
      where: { projectId: parseInt(projectId) }
    });

    // If no settings exist, create default ones
    if (!projectSettings) {
      projectSettings = await prisma.project_settings.create({
        data: {
          projectId: parseInt(projectId),
          startOfDayTime: '09:00',
          endOfDayTime: '17:00',
          lunchTime: '12:00-13:00',
          timezone: 'UTC',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          createdBy: 'system'
        }
      });
    }

    res.status(200).json({
      success: true,
      project: {
        id: project.id,
        title: project.title
      },
      settings: projectSettings
    });

  } catch (error) {
    console.error('Error fetching project settings:', error);
    
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to fetch project settings"
    });
  }
}