import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'auth',
  GET: async (req, res) => {
    const organizations = await prisma.organizations.findMany({
      where: {
        published: true,
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        info: true,
        logo_url: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    res.status(200).json(organizations);
  }
});
