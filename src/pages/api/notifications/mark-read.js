import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  PATCH: async (req, res) => {
    const { id, all } = req.body;

    if (all) {
      await req.db.notifications.updateMany({
        where: { isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (id) {
      await req.db.notifications.update({
        where: { id: parseInt(id) },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      return res.status(400).json({ error: 'Provide id or all: true' });
    }

    return res.status(200).json({ success: true });
  },
});
