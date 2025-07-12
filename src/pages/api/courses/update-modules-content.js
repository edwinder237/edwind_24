export default function handler(req, res) {
  const { updatedJSONContent } = req.body;
  
  return res.status(200).json({content:updatedJSONContent});
}
