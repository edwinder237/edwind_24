import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res) {
  try {
    const { sub_organizationId } = req.query;
    
    // Build where clause
    const where = {
      isActive: true
    };
    
    // Filter by sub_organizationId if provided
    if (sub_organizationId && !isNaN(parseInt(sub_organizationId))) {
      where.sub_organizationId = parseInt(sub_organizationId);
    }
    
    // Fetch topics with usage count
    const topics = await prisma.topics.findMany({
      include: {
        course_topics: {
          select: {
            id: true
          }
        },
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      },
      where,
      orderBy: {
        title: 'asc'
      }
    });

    // Transform data to include usage count
    const topicsWithUsage = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      color: topic.color,
      icon: topic.icon,
      isActive: topic.isActive,
      usageCount: topic.course_topics.length,
      organization: topic.sub_organization.title,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      createdBy: topic.createdBy
    }));

    res.status(200).json(topicsWithUsage);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
}

async function handlePost(req, res) {
  try {
    const { title, description, color, icon } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    // For now, we'll use a default sub_organizationId. In a real app, 
    // you'd get this from the authenticated user's session
    const defaultSubOrgId = 1; // You should replace this with actual user's organization
    const defaultCreatedBy = 'system'; // You should replace this with actual user ID

    // Check if topic already exists in this organization
    const existingTopic = await prisma.topics.findFirst({
      where: {
        title: title.trim(),
        sub_organizationId: defaultSubOrgId,
        isActive: true
      }
    });

    if (existingTopic) {
      return res.status(409).json({ error: 'Topic with this title already exists in your organization' });
    }

    // Create new topic
    const newTopic = await prisma.topics.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || null,
        icon: icon || null,
        sub_organizationId: defaultSubOrgId,
        createdBy: defaultCreatedBy
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

    res.status(201).json({
      id: newTopic.id,
      title: newTopic.title,
      description: newTopic.description,
      color: newTopic.color,
      icon: newTopic.icon,
      isActive: newTopic.isActive,
      usageCount: 0,
      organization: newTopic.sub_organization.title,
      createdAt: newTopic.createdAt,
      updatedAt: newTopic.updatedAt,
      createdBy: newTopic.createdBy
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('unique_topic_per_organization')) {
      return res.status(409).json({ error: 'Topic with this title already exists in your organization' });
    }
    
    res.status(500).json({ error: 'Failed to create topic' });
  }
}