export default function handler(req, res) {
  const { modules } = req.body;

  console.log(modules)

  return res.status(200).json({ modules:modules });
}
