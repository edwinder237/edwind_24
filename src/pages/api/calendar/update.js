// third-party
import { map, assign } from 'lodash';



// ==============================|| CALENDAR - EVENT EDIT ||============================== //

export default async function handler(req, res) {
  try {
    const { eventId, update,events } = req.body;
    let event = null;
    map(events, (_event) => {
      if (_event.id === eventId) {
        assign(_event, { ...update });
        event = _event;
      }

      return _event;
    });

    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
