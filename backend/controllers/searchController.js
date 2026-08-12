
const prisma = require('../config/db');

module.exports = {
  async globalSearch(req, res, next) {
    try {
      const q = req.query.q || '';
      if (!q || q.length < 2) return res.json({ assets: [], bases: [], users: [], transfers: [] });

      const baseFilter = req.user.role === 'ADMIN' ? undefined : req.user.baseId;

      const [assets, bases, users, transfers] = await Promise.all([
        prisma.asset.findMany({
          where: {
            AND: [
              baseFilter ? { baseId: baseFilter } : {},
              {
                OR: [
                  { serialNumber: { contains: q, mode: 'insensitive' } },
                  { equipmentType: { name: { contains: q, mode: 'insensitive' } } }
                ]
              }
            ]
          },
          include: { equipmentType: true, base: true },
          take: 5
        }),
        prisma.base.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          take: 3
        }),
        req.user.role === 'ADMIN' ? prisma.user.findMany({
          where: { username: { contains: q, mode: 'insensitive' } },
          take: 3
        }) : [],
        prisma.transfer.findMany({
          where: {
            AND: [
              baseFilter ? { OR: [{ sourceBaseId: baseFilter }, { destinationBaseId: baseFilter }] } : {},
              {
                OR: [
                  { id: parseInt(q) || -1 },
                  { equipmentType: { name: { contains: q, mode: 'insensitive' } } }
                ]
              }
            ]
          },
          include: { equipmentType: true, sourceBase: true, destinationBase: true },
          take: 5
        })
      ]);

      res.json({
        assets,
        bases,
        users,
        transfers
      });
    } catch (e) { next(e); }
  }
};
