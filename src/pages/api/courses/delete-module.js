import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { moduleId, modules } = req.body;

    modules.splice(
      modules.findIndex((module) => module.id === moduleId),
      1
    );

    return res.status(200).json({ modules });
  }
});
