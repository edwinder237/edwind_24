export default function handler(req, res) {
  const { projectCUID, projects } = req.body;

  const updatedProjects = projects.filter(
    (project) => project.id !== projectCUID
  );

  return res.status(200).json(updatedProjects);
}
