import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (!projectId || isNaN(parseInt(projectId))) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid project ID is required' 
    });
  }

  const projectIdInt = parseInt(projectId);

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, projectIdInt);
        break;
      case 'POST':
        await handlePost(req, res, projectIdInt);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('Error in project topics API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

async function handleGet(req, res, projectId) {
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

    // Get project-specific topics
    const projectTopics = await prisma.project_topics.findMany({
      where: { projectId },
      include: {
        topic: true
      },
      orderBy: {
        topic: {
          title: 'asc'
        }
      }
    });

    // Transform the data to match the expected format
    const topics = projectTopics.map(pt => ({
      id: pt.topic.id,
      title: pt.topic.title,
      description: pt.topic.description,
      color: pt.topic.color,
      icon: pt.topic.icon,
      projectTopicId: pt.id
    }));

    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching project topics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project topics' 
    });
  }
}

async function handlePost(req, res, projectId) {
  try {
    const { topicId } = req.body;

    if (!topicId || isNaN(parseInt(topicId))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid topic ID is required' 
      });
    }

    const topicIdInt = parseInt(topicId);

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

    // Verify topic exists and belongs to the same sub_organization
    const topic = await prisma.topics.findFirst({
      where: { 
        id: topicIdInt,
        sub_organizationId: project.sub_organizationId
      }
    });

    if (!topic) {
      return res.status(404).json({ 
        success: false, 
        error: 'Topic not found in your organization' 
      });
    }

    // Check if this topic is already associated with the project
    const existingProjectTopic = await prisma.project_topics.findFirst({
      where: {
        projectId,
        topicId: topicIdInt
      }
    });

    if (existingProjectTopic) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic is already added to this project' 
      });
    }

    // Create project-topic association
    await prisma.project_topics.create({
      data: {
        projectId,
        topicId: topicIdInt
      }
    });

    res.status(201).json({
      success: true,
      message: 'Topic added to project successfully',
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        color: topic.color,
        icon: topic.icon
      }
    });
  } catch (error) {
    console.error('Error creating project topic:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add topic to project' 
    });
  }
}