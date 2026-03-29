import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { projectId } = req.body;
    const count = await prisma.project_participants.count({});

    res.status(200).json({
      message: "Participant successfully added to database ",
      count: count,
    });
  }
});
