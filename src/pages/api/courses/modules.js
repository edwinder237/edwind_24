
export default function handler(req, res) {

    const {modules} =req.body;

  return res.status(200).json({ modules: modules });
}
