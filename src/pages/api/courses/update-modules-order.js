export default function handler(req, res) {
  const { newModulesOrder } = req.body;
  
  return res.status(200).json({newModulesOrder:newModulesOrder});
}
