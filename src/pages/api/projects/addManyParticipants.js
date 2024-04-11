export default function handler(req, res) {
  const { newParticipants, participants } = req.body;

  const data = newParticipants.map(p => ({ participant: p }));

  const result = {
    participants: [...data,...participants]
  };

  return res.status(200).json({ ...result });
}
