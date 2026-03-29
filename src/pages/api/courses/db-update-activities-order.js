import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { newActivitiesOrder, moduleId } = req.body;

    await Promise.all(newActivitiesOrder.map(async (module, index) => {
      await prisma.activities.update({
        where: {
          id: module.id,
          moduleId: parseInt(moduleId),
        },
        data: {
          ActivityOrder: index,
        },
      });
    }));

    res.status(200).json("Activities updated and saved to database");
  }
});
