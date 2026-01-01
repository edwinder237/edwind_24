import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import {
  scopedFindMany,
  scopedFindFirst,
  scopedCreate
} from '../../../lib/prisma/scopedQueries.js';
import { errorHandler, ValidationError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method } = req;
  const { orgContext } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, orgContext);
      case 'POST':
        return await handlePost(req, res, orgContext);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorHandler(error, req, res);
  }
}

async function handleGet(req, res, orgContext) {
  // Fetch topics scoped to user's accessible sub-organizations
  const topics = await scopedFindMany(orgContext, 'topics', {
    where: {
      isActive: true
    },
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
    sub_organizationId: topic.sub_organizationId,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    createdBy: topic.createdBy
  }));

  return res.status(200).json(topicsWithUsage);
}

async function handlePost(req, res, orgContext) {
  const { title, description, color, icon, sub_organizationId } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Topic title is required');
  }

  // Use provided sub_organizationId or default to first accessible sub-org
  const targetSubOrgId = sub_organizationId
    ? parseInt(sub_organizationId)
    : orgContext.subOrganizationIds[0];

  // Validate the sub_organizationId belongs to user's organization
  if (!orgContext.subOrganizationIds.includes(targetSubOrgId)) {
    throw new ValidationError('Invalid sub-organization');
  }

  // Check if topic already exists in this organization
  const existingTopic = await scopedFindFirst(orgContext, 'topics', {
    where: {
      title: title.trim(),
      sub_organizationId: targetSubOrgId,
      isActive: true
    }
  });

  if (existingTopic) {
    return res.status(409).json({ error: 'Topic with this title already exists in your organization' });
  }

  // Create new topic with proper organization scoping
  const newTopic = await scopedCreate(orgContext, 'topics', {
    title: title.trim(),
    description: description?.trim() || null,
    color: color || null,
    icon: icon || null,
    sub_organizationId: targetSubOrgId,
    createdBy: orgContext.userId
  });

  // Fetch the complete topic with relations
  const topicWithRelations = await scopedFindFirst(orgContext, 'topics', {
    where: { id: newTopic.id },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return res.status(201).json({
    id: topicWithRelations.id,
    title: topicWithRelations.title,
    description: topicWithRelations.description,
    color: topicWithRelations.color,
    icon: topicWithRelations.icon,
    isActive: topicWithRelations.isActive,
    usageCount: 0,
    organization: topicWithRelations.sub_organization.title,
    sub_organizationId: topicWithRelations.sub_organizationId,
    createdAt: topicWithRelations.createdAt,
    updatedAt: topicWithRelations.updatedAt,
    createdBy: topicWithRelations.createdBy
  });
}

export default withOrgScope(handler);
