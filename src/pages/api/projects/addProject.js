export default function handler(req, res) {

    const { newProject,Projects } = req.body;

    const result = {
      Projects: [newProject,...Projects]

    }
    return res.status(200).json({ ...result });
  }