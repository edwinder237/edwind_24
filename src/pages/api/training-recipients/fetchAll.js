/**
 * ============================================
 * GET /api/training-recipients/fetchAll
 * ============================================
 *
 * Returns all training recipients for the current organization.
 * Uses org scoping to filter by sub-organization.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  // Fetch training recipients with organization scoping
  const trainingRecipients = await scopedFindMany(orgContext, 'training_recipients', {
    include: {
      sub_organization: {
        select: {
          id: true,
          title: true
        }
      },
      projects: {
        select: {
          id: true,
          title: true
        }
      },
      project_participants: {
        where: {
          status: 'active' // Only count active enrollments
        },
        select: {
          id: true,
          participantId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Add computed fields and parse location JSON
  const enrichedRecipients = trainingRecipients.map(recipient => {
    let parsedLocation = null;
    if (recipient.location) {
      try {
        parsedLocation = typeof recipient.location === 'string'
          ? JSON.parse(recipient.location)
          : recipient.location;
      } catch (error) {
        console.error(`Error parsing location JSON for recipient ${recipient.id}:`, error);
      }
    }

    // Count unique participants from active enrollments
    const uniqueParticipants = new Set(
      recipient.project_participants.map(pp => pp.participantId)
    );

    return {
      ...recipient,
      location: parsedLocation,
      projectCount: recipient.projects.length,
      participantCount: uniqueParticipants.size,
      _count: {
        projects: recipient.projects.length,
        participants: uniqueParticipants.size
      }
    };
  });

  res.status(200).json(enrichedRecipients);
}

export default withOrgScope(asyncHandler(handler));
