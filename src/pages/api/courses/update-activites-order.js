export default function handler(req, res) {
  const { newActivitiesOrder,moduleIndex } = req.body;
  return res.status(200).json({newActivitiesOrder:newActivitiesOrder,index:moduleIndex});
}
