import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { editedModule, modules } = req.body;
    modules.splice(
      modules.findIndex((module) => module.id === editedModule.id),
      1,
      editedModule
    );

    return res.status(200).json({ modules });
  }
});
