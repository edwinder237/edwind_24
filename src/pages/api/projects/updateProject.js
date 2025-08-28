import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      title,
      description,
      type,
      tags,
      startDate,
      endDate,
      language,
      location,
      trainingRecipientId,
      curriculumId,
      sharing,
      backgroundImg,
      color,
      projectStatus
    } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Project ID is required' 
      });
    }

    // Check if project exists
    const existingProject = await prisma.projects.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Update the project
    const updatedProject = await prisma.projects.update({
      where: {
        id: parseInt(id)
      },
      data: {
        title: title || existingProject.title,
        summary: description || existingProject.summary, // Use 'summary' instead of 'description'
        projectType: type || existingProject.projectType, // Use 'projectType' instead of 'type'
        tags: tags || existingProject.tags,
        startDate: startDate ? new Date(startDate) : existingProject.startDate,
        endDate: endDate ? new Date(endDate) : existingProject.endDate,
        language: language || existingProject.language,
        location: location || existingProject.location,
        trainingRecipientId: trainingRecipientId || existingProject.trainingRecipientId,
        published: sharing !== undefined ? sharing : existingProject.published, // Use 'published' instead of 'sharing'
        backgroundImg: backgroundImg || existingProject.backgroundImg,
        color: color || existingProject.color,
        projectStatus: projectStatus || existingProject.projectStatus
      },
      include: {
        participants: true,
        groups: true,
        events: true
      }
    });

    // Handle curriculum update
    if (curriculumId !== undefined) {
      // First, remove existing curriculum associations for this project
      await prisma.project_curriculums.deleteMany({
        where: {
          projectId: parseInt(id)
        }
      });

      // If a new curriculum is provided, create the association
      if (curriculumId) {
        await prisma.project_curriculums.create({
          data: {
            projectId: parseInt(id),
            curriculumId: parseInt(curriculumId)
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update project',
      error: error.message 
    });
  }
}