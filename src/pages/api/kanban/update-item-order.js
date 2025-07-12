export default function handler(req, res) {
  const { columns } = req.body;
  console.log(columns);
  return res.status(200).json({ columns });
}
