import prisma from "../../../../../lib/prisma";
import { createHandler } from '../../../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',

  PUT: async (req, res) => {
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
      const { title, description, color, icon } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Topic title is required'
        });
      }

      // Verify project exists
      const project = await prisma.projects.findUnique({
        where: { id: projectIdInt }
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
          projectId: projectIdInt,
          topicId: topicIdInt
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
          id: { not: topicIdInt }
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
        where: { id: topicIdInt },
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
  },

  DELETE: async (req, res) => {
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
      // Verify project exists
      const project = await prisma.projects.findUnique({
        where: { id: projectIdInt }
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
          projectId: projectIdInt,
          topicId: topicIdInt
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
});
