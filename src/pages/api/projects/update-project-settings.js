import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      projectId,
      startDate,
      endDate,
      startOfDayTime,
      endOfDayTime,
      lunchTime,
      timezone,
      workingDays,
      updatedBy
    } = req.body;

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

    // Prepare update data
    const updateData = {
      updatedBy: updatedBy || 'user'
    };

    // Add optional fields only if provided
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    if (startOfDayTime !== undefined) {
      updateData.startOfDayTime = startOfDayTime;
    }
    if (endOfDayTime !== undefined) {
      updateData.endOfDayTime = endOfDayTime;
    }
    if (lunchTime !== undefined) {
      updateData.lunchTime = lunchTime;
    }
    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }
    if (workingDays !== undefined) {
      updateData.workingDays = Array.isArray(workingDays) ? workingDays : [];
    }

    // Upsert project settings (create if doesn't exist, update if exists)
    const projectSettings = await prisma.project_settings.upsert({
      where: { projectId: parseInt(projectId) },
      update: updateData,
      create: {
        projectId: parseInt(projectId),
        startDate: updateData.startDate || null,
        endDate: updateData.endDate || null,
        startOfDayTime: updateData.startOfDayTime || '09:00',
        endOfDayTime: updateData.endOfDayTime || '17:00',
        lunchTime: updateData.lunchTime || '12:00-13:00',
        timezone: updateData.timezone || 'UTC',
        workingDays: updateData.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: updateData.updatedBy || 'user'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Project settings updated successfully',
      project: {
        id: project.id,
        title: project.title
      },
      settings: projectSettings
    });

  } catch (error) {
    console.error('Error updating project settings:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Duplicate constraint violation',
        details: 'Project settings already exist for this project'
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to update project settings"
    });
  }
}