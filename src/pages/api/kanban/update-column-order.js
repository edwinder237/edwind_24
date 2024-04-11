export default function handler(req, res) {
  const { coursesOrder } = req.body;
  return res.status(200).json({updatedCoursesOrder:coursesOrder});
}
