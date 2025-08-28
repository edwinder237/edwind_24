import prisma from "../../../../../lib/prisma";

export default async function handler(req, res) {
  const { projectId, topicId } = req.query;

  if (!projectId || isNaN(parseInt(projectId))) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid project ID is required' 
    });
  }

  if (!topicId || isNaN(parseInt(topicId))) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid topic ID is required' 
    });
  }

  const projectIdInt = parseInt(projectId);
  const topicIdInt = parseInt(topicId);

  try {
    switch (req.method) {
      case 'PUT':
        await handlePut(req, res, projectIdInt, topicIdInt);
        break;
      case 'DELETE':
        await handleDelete(req, res, projectIdInt, topicIdInt);
        break;
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('Error in project topic API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

async function handlePut(req, res, projectId, topicId) {
  try {
    const { title, description, color, icon } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic title is required' 
      });
    }

    // Verify project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Verify topic exists and is associated with the project
    const projectTopic = await prisma.project_topics.findFirst({
      where: {
        projectId,
        topicId
      },
      include: {
        topic: true
      }
    });

    if (!projectTopic) {
      return res.status(404).json({ 
        success: false, 
        error: 'Topic not found in this project' 
      });
    }

    // Check if another topic with the same title exists (excluding current topic)
    const existingTopic = await prisma.topics.findFirst({
      where: {
        title: title.trim().toUpperCase(),
        id: { not: topicId }
      }
    });

    if (existingTopic) {
      return res.status(400).json({ 
        success: false, 
        error: 'A topic with this title already exists' 
      });
    }

    // Update the topic
    const updatedTopic = await prisma.topics.update({
      where: { id: topicId },
      data: {
        title: title.trim().toUpperCase(),
        description: description?.trim() || null,
        color: color?.trim() || '#1976d2',
        icon: icon?.trim() || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      topic: {
        id: updatedTopic.id,
        title: updatedTopic.title,
        description: updatedTopic.description,
        color: updatedTopic.color,
        icon: updatedTopic.icon
      }
    });
  } catch (error) {
    console.error('Error updating project topic:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update topic' 
    });
  }
}

async function handleDelete(req, res, projectId, topicId) {
  try {
    // Verify project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Find and verify the project-topic association
    const projectTopic = await prisma.project_topics.findFirst({
      where: {
        projectId,
        topicId
      }
    });

    if (!projectTopic) {
      return res.status(404).json({ 
        success: false, 
        error: 'Topic not found in this project' 
      });
    }

    // Remove the topic from the project (delete the association)
    await prisma.project_topics.delete({
      where: { id: projectTopic.id }
    });

    res.status(200).json({
      success: true,
      message: 'Topic removed from project successfully'
    });
  } catch (error) {
    console.error('Error deleting project topic:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove topic from project' 
    });
  }
}