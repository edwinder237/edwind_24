import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;

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
  }
});
