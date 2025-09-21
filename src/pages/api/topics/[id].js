import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid topic ID is required' });
  }

  const topicId = parseInt(id);

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, topicId);
        break;
      case 'PUT':
        await handlePut(req, res, topicId);
        break;
      case 'DELETE':
        await handleDelete(req, res, topicId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, topicId) {
  try {
    const topic = await prisma.topics.findUnique({
      where: { id: topicId },
      include: {
        course_topics: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                title: true,
                courseStatus: true
              }
            }
          }
        },
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topicWithDetails = {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      color: topic.color,
      icon: topic.icon,
      isActive: topic.isActive,
      usageCount: topic.course_topics.length,
      courses: topic.course_topics.map(ct => ct.course),
      organization: topic.sub_organization.title,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      createdBy: topic.createdBy
    };

    res.status(200).json(topicWithDetails);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
}

async function handlePut(req, res, topicId) {
  try {
    const { title, description, color, icon, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    // Check if topic exists
    const existingTopic = await prisma.topics.findUnique({
      where: { id: topicId },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check if another topic with the same title exists in the same organization
    const duplicateTopic = await prisma.topics.findFirst({
      where: {
        title: title.trim(),
        sub_organizationId: existingTopic.sub_organizationId,
        isActive: true,
        NOT: {
          id: topicId
        }
      }
    });

    if (duplicateTopic) {
      return res.status(409).json({ error: 'Topic with this title already exists in your organization' });
    }

    const defaultUpdatedBy = 'system'; // You should replace this with actual user ID

    // Update topic
    const updatedTopic = await prisma.topics.update({
      where: { id: topicId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || null,
        icon: icon || null,
        isActive: isActive !== undefined ? isActive : existingTopic.isActive,
        updatedBy: defaultUpdatedBy
      },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(200).json({
      id: updatedTopic.id,
      title: updatedTopic.title,
      description: updatedTopic.description,
      color: updatedTopic.color,
      icon: updatedTopic.icon,
      isActive: updatedTopic.isActive,
      organization: updatedTopic.sub_organization.title,
      createdAt: updatedTopic.createdAt,
      updatedAt: updatedTopic.updatedAt,
      createdBy: updatedTopic.createdBy,
      updatedBy: updatedTopic.updatedBy
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('unique_topic_per_organization')) {
      return res.status(409).json({ error: 'Topic with this title already exists in your organization' });
    }
    
    res.status(500).json({ error: 'Failed to update topic' });
  }
}

async function handleDelete(req, res, topicId) {
  try {
    // Check if topic exists
    const existingTopic = await prisma.topics.findUnique({
      where: { id: topicId },
      include: {
        course_topics: true
      }
    });

    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check if topic is being used by courses
    const usageCount = existingTopic.course_topics.length;
    if (usageCount > 0) {
      return res.status(409).json({ 
        error: `Cannot delete topic. It is currently used by ${usageCount} course(s).`,
        usageCount: usageCount
      });
    }

    // Soft delete - set isActive to false instead of hard delete
    await prisma.topics.update({
      where: { id: topicId },
      data: {
        isActive: false,
        updatedBy: 'system' // You should replace this with actual user ID
      }
    });

    res.status(200).json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
}