export default function handler(req, res) {
  const { moduleId, modules } = req.body;

  modules.splice(
    modules.findIndex((module) => module.id === moduleId),
    1
  );

  return res.status(200).json({ modules });
}
