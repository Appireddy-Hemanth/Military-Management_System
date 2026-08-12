
const prisma = require('../config/db');

module.exports = {
  async getMessages(req, res, next) {
    try {
      const messages = await prisma.internalMessage.findMany({
        where: { recipientId: req.user.id },
        orderBy: { createdAt: 'desc' },
        // include sender info would be ideal, but for now we might not have a direct relation back in schema... Wait I didn't set a relation in schema strictly.
      });
      // manual populate
      const populated = await Promise.all(messages.map(async m => {
        const sender = await prisma.user.findUnique({ where: { id: m.senderId }, select: { username: true, role: true } });
        return { ...m, sender };
      }));
      res.json(populated);
    } catch (e) { next(e); }
  },

  async sendMessage(req, res, next) {
    try {
      const { recipientId, title, message, referenceType, referenceId } = req.body;
      const msg = await prisma.internalMessage.create({
        data: {
          senderId: req.user.id,
          recipientId: parseInt(recipientId),
          title, message, referenceType, referenceId: referenceId ? parseInt(referenceId) : null
        }
      });

      // also create notification
      await prisma.notification.create({
        data: {
          userId: parseInt(recipientId), type: 'SYSTEM',
          title: `New Message: ${title}`, message,
          referenceType: 'MESSAGE', referenceId: msg.id
        }
      });

      res.status(201).json(msg);
    } catch (e) { next(e); }
  },

  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const msg = await prisma.internalMessage.update({
        where: { id: parseInt(id) },
        data: { isRead: true }
      });
      res.json(msg);
    } catch (e) { next(e); }
  }
};
