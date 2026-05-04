import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  GET: async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = unreadOnly === 'true' ? { isRead: false } : {};

    const [notifications, total, unreadCount] = await Promise.all([
      req.db.notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      req.db.notifications.count({ where }),
      req.db.notifications.count({ where: { isRead: false } }),
    ]);

    return res.status(200).json({ notifications, total, unreadCount });
  },
});
