// third-party
import reject from 'lodash/reject';

// ==============================|| CALENDAR - EVENT DELETE ||============================== //

export default async function handler(req, res) {
  try {
    const { eventId,events } = req.body;
    reject(events, { id: eventId });

    res.status(200).json(eventId);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
