// third-party

import { createHandler } from '../../../lib/api/createHandler';

// ==============================|| CALENDAR - EVENT DELETE ||============================== //

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { eventId,events } = req.body;
    const filteredEvents = events.filter(event => event.id !== eventId);

    res.status(200).json(eventId);
  }
});
