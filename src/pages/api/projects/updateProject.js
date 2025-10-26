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

    // Build update data object - only include fields that were provided
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.summary = description;
    if (type !== undefined) updateData.projectType = type;
    if (tags !== undefined) updateData.tags = tags;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (language !== undefined) updateData.language = language;
    if (location !== undefined) updateData.location = location;
    if (trainingRecipientId !== undefined) updateData.trainingRecipientId = trainingRecipientId;
    if (sharing !== undefined) updateData.published = sharing;
    if (backgroundImg !== undefined) updateData.backgroundImg = backgroundImg;
    if (color !== undefined) updateData.color = color;
    if (projectStatus !== undefined) updateData.projectStatus = projectStatus;
    
    // Update the project
    const updatedProject = await prisma.projects.update({
      where: {
        id: parseInt(id)
      },
      data: updateData,
      include: {
        participants: true,
        groups: true,
        events: true,
        training_recipient: {
          select: {
            id: true,
            name: true,
            description: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true,
            website: true,
            industry: true,
          }
        }
      }
    });

    // If trainingRecipientId was updated, update all enrollments to match
    if (trainingRecipientId !== undefined && trainingRecipientId !== null) {
      // Update all project_participants enrollments for this project
      const updateResult = await prisma.project_participants.updateMany({
        where: {
          projectId: parseInt(id)
        },
        data: {
          trainingRecipientId: trainingRecipientId
        }
      });

      console.log(`Updated ${updateResult.count} enrollments to trainingRecipientId: ${trainingRecipientId}`);
    }

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