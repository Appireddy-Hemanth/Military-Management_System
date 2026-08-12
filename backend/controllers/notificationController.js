
const prisma = require('../config/db');

module.exports = {
  async getNotifications(req, res, next) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });
      res.json(notifications);
    } catch (e) { next(e); }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
      });
      res.json({ count });
    } catch (e) { next(e); }
  },

  async markAsRead(req, res, next) {
    try {
      const notification = await prisma.notification.updateMany({
        where: { id: parseInt(req.params.id), userId: req.user.id },
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (e) { next(e); }
  },

  async markAllAsRead(req, res, next) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (e) { next(e); }
  }
};
