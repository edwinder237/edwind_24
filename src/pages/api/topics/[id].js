import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import {
  scopedFindUnique,
  scopedFindFirst,
  scopedUpdate
} from '../../../lib/prisma/scopedQueries.js';
import { errorHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  const { orgContext } = req;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid topic ID is required' });
  }

  const topicId = parseInt(id);

  try {
    switch (method) {
      case 'GET':
        return await handleGet(res, topicId, orgContext);
      case 'PUT':
        return await handlePut(req, res, topicId, orgContext);
      case 'DELETE':
        return await handleDelete(res, topicId, orgContext);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorHandler(error, req, res);
  }
}

async function handleGet(res, topicId, orgContext) {
  // Find topic with organization scoping
  const topic = await scopedFindUnique(orgContext, 'topics', {
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
    throw new NotFoundError('Topic not found');
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
    sub_organizationId: topic.sub_organizationId,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    createdBy: topic.createdBy
  };

  return res.status(200).json(topicWithDetails);
}

async function handlePut(req, res, topicId, orgContext) {
  const { title, description, color, icon, isActive } = req.body;

  if (!title || !title.trim()) {
    throw new ValidationError('Topic title is required');
  }

  // Verify topic exists and belongs to user's organization
  const existingTopic = await scopedFindUnique(orgContext, 'topics', {
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
    throw new NotFoundError('Topic not found');
  }

  // Check if another topic with the same title exists in the same organization
  const duplicateTopic = await scopedFindFirst(orgContext, 'topics', {
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

  // Update topic using scoped update
  const updatedTopic = await scopedUpdate(orgContext, 'topics', { id: topicId }, {
    title: title.trim(),
    description: description?.trim() || null,
    color: color || null,
    icon: icon || null,
    isActive: isActive !== undefined ? isActive : existingTopic.isActive,
    updatedBy: orgContext.userId
  });

  // Fetch the updated topic with relations
  const topicWithRelations = await scopedFindUnique(orgContext, 'topics', {
    where: { id: updatedTopic.id },
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return res.status(200).json({
    id: topicWithRelations.id,
    title: topicWithRelations.title,
    description: topicWithRelations.description,
    color: topicWithRelations.color,
    icon: topicWithRelations.icon,
    isActive: topicWithRelations.isActive,
    organization: topicWithRelations.sub_organization.title,
    sub_organizationId: topicWithRelations.sub_organizationId,
    createdAt: topicWithRelations.createdAt,
    updatedAt: topicWithRelations.updatedAt,
    createdBy: topicWithRelations.createdBy,
    updatedBy: topicWithRelations.updatedBy
  });
}

async function handleDelete(res, topicId, orgContext) {
  // Verify topic exists and belongs to user's organization
  const existingTopic = await scopedFindUnique(orgContext, 'topics', {
    where: { id: topicId },
    include: {
      course_topics: true
    }
  });

  if (!existingTopic) {
    throw new NotFoundError('Topic not found');
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
  await scopedUpdate(orgContext, 'topics', { id: topicId }, {
    isActive: false,
    updatedBy: orgContext.userId
  });

  return res.status(200).json({ message: 'Topic deleted successfully' });
}

export default withOrgScope(handler);
