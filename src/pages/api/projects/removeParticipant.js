export default function handler(req, res) {
  try {
    const { remainingParticipants } = req.body;

    const result = {
      remainingParticipants: remainingParticipants,
    };

    return res.status(200).json({ ...result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
