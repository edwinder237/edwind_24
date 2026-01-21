/**
 * ============================================
 * GET /api/training-recipients/fetchActivity
 * ============================================
 *
 * Fetches activity timeline for a training recipient.
 * Aggregates activities from multiple sources:
 * - Training recipient creation/updates
 * - Participant enrollments
 * - Project associations
 * - Event attendance
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { id, limit = 50, offset = 0 } = req.query;

  if (!id) {
    throw new ValidationError('Training recipient ID is required');
  }

  const recipientId = parseInt(id);
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const offsetNum = parseInt(offset) || 0;

  // Verify recipient exists and belongs to org
  const recipient = await scopedFindUnique(orgContext, 'training_recipients', {
    where: { id: recipientId }
  });

  if (!recipient) {
    throw new NotFoundError('Training recipient not found');
  }

  const activities = [];

  // 1. Training recipient creation
  activities.push({
    id: `recipient-created-${recipient.id}`,
    type: 'recipient_created',
    title: 'Organization Created',
    description: `${recipient.name} was added as a training recipient`,
    timestamp: recipient.createdAt,
    icon: 'organization',
    color: 'primary',
    metadata: {
      recipientId: recipient.id,
      recipientName: recipient.name
    }
  });

  // 2. Training recipient updates (if updated after creation)
  if (recipient.updatedAt &&
      new Date(recipient.updatedAt).getTime() !== new Date(recipient.createdAt).getTime()) {
    activities.push({
      id: `recipient-updated-${recipient.id}-${recipient.updatedAt}`,
      type: 'recipient_updated',
      title: 'Organization Updated',
      description: `${recipient.name} details were updated`,
      timestamp: recipient.updatedAt,
      icon: 'edit',
      color: 'info',
      metadata: {
        recipientId: recipient.id,
        recipientName: recipient.name,
        updatedBy: recipient.updatedBy
      }
    });
  }

  // 3. Fetch participants linked to this training recipient
  const participants = await prisma.participants.findMany({
    where: {
      trainingRecipientId: recipientId
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      lastUpdated: true,
      participantStatus: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Add participant creation activities
  participants.forEach(participant => {
    activities.push({
      id: `participant-added-${participant.id}`,
      type: 'participant_added',
      title: 'Participant Added',
      description: `${participant.firstName} ${participant.lastName} was added`,
      timestamp: participant.createdAt,
      icon: 'user',
      color: 'success',
      metadata: {
        participantId: participant.id,
        participantName: `${participant.firstName} ${participant.lastName}`,
        participantEmail: participant.email,
        participantStatus: participant.participantStatus
      }
    });
  });

  // 4. Fetch project associations
  const projects = await prisma.projects.findMany({
    where: {
      trainingRecipientId: recipientId,
      sub_organizationId: {
        in: orgContext.subOrganizationIds
      }
    },
    select: {
      id: true,
      title: true,
      projectStatus: true,
      createdAt: true,
      lastUpdated: true,
      startDate: true,
      endDate: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Add project association activities
  projects.forEach(project => {
    activities.push({
      id: `project-linked-${project.id}`,
      type: 'project_linked',
      title: 'Project Linked',
      description: `Project "${project.title}" was associated`,
      timestamp: project.createdAt,
      icon: 'project',
      color: 'secondary',
      metadata: {
        projectId: project.id,
        projectTitle: project.title,
        projectStatus: project.projectStatus,
        startDate: project.startDate,
        endDate: project.endDate
      }
    });

    // Add project status activities if project started
    if (project.startDate && new Date(project.startDate) <= new Date()) {
      activities.push({
        id: `project-started-${project.id}`,
        type: 'project_started',
        title: 'Project Started',
        description: `Training for "${project.title}" began`,
        timestamp: project.startDate,
        icon: 'calendar',
        color: 'warning',
        metadata: {
          projectId: project.id,
          projectTitle: project.title
        }
      });
    }

    // Add project completion if ended
    if (project.endDate && new Date(project.endDate) <= new Date() &&
        (project.projectStatus === 'completed' || project.projectStatus === 'finished')) {
      activities.push({
        id: `project-completed-${project.id}`,
        type: 'project_completed',
        title: 'Project Completed',
        description: `Training for "${project.title}" was completed`,
        timestamp: project.endDate,
        icon: 'check',
        color: 'success',
        metadata: {
          projectId: project.id,
          projectTitle: project.title
        }
      });
    }
  });

  // 5. Fetch enrollment activities (project_participants with trainingRecipientId)
  const enrollments = await prisma.project_participants.findMany({
    where: {
      trainingRecipientId: recipientId
    },
    select: {
      id: true,
      status: true,
      participant: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      project: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Note: project_participants doesn't have createdAt, so we skip individual enrollment activities
  // If you need these, you'd need to add createdAt to the project_participants table

  // 6. Fetch events for these projects
  if (projects.length > 0) {
    const projectIds = projects.map(p => p.id);

    const events = await prisma.events.findMany({
      where: {
        projectId: { in: projectIds }
      },
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        eventType: true,
        eventStatus: true,
        project: {
          select: {
            id: true,
            title: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { start: 'desc' },
      take: 50 // Limit events to avoid too many
    });

    // Add scheduled events
    events.forEach(event => {
      const isPast = new Date(event.end) < new Date();

      activities.push({
        id: `event-${isPast ? 'completed' : 'scheduled'}-${event.id}`,
        type: isPast ? 'event_completed' : 'event_scheduled',
        title: isPast ? 'Training Session Completed' : 'Training Session Scheduled',
        description: `${event.title}${event.course ? ` - ${event.course.title}` : ''}`,
        timestamp: isPast ? event.end : event.start,
        icon: 'calendar',
        color: isPast ? 'success' : 'info',
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.eventType,
          eventStatus: event.eventStatus,
          projectId: event.project?.id,
          projectTitle: event.project?.title,
          courseId: event.course?.id,
          courseTitle: event.course?.title,
          startTime: event.start,
          endTime: event.end
        }
      });
    });
  }

  // Sort all activities by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply pagination
  const totalCount = activities.length;
  const paginatedActivities = activities.slice(offsetNum, offsetNum + limitNum);

  // Group activities by date for better display
  const groupedActivities = {};
  paginatedActivities.forEach(activity => {
    const date = new Date(activity.timestamp).toISOString().split('T')[0];
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  res.status(200).json({
    success: true,
    data: {
      activities: paginatedActivities,
      groupedActivities,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      },
      summary: {
        totalActivities: totalCount,
        participantCount: participants.length,
        projectCount: projects.length
      }
    }
  });
}

export default withOrgScope(asyncHandler(handler));
