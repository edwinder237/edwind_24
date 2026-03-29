import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { editedJSON, selectedModuleId } = req.body;

    await prisma.modules.update({
      where: {
        id: selectedModuleId,
      },
      data: {
        JSONContent: editedJSON,
      },
    });

    res.status(200).json("JSON Content updated and saved to database");
  }
});
