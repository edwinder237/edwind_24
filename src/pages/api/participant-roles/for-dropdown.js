import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';
import { errorHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method } = req;
  const { orgContext } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Fetch active participant roles scoped to user's accessible sub-organizations
    const participantRoles = await scopedFindMany(orgContext, 'sub_organization_participant_role', {
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        sub_organizationId: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    return res.status(200).json(participantRoles);
  } catch (error) {
    console.error('Error fetching participant roles for dropdown:', error);
    return errorHandler(error, req, res);
  }
}

export default withOrgScope(handler);
