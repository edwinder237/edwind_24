import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { projectCUID, projects } = req.body;

    const updatedProjects = projects.filter(
      (project) => project.id !== projectCUID
    );

    return res.status(200).json(updatedProjects);
  }
});
