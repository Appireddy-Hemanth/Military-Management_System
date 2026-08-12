
const prisma = require('../config/db');

module.exports = {
  async getAnomalies(req, res, next) {
    try {
      // Very basic rule-based detection dynamically populated for the sake of the feature
      const recentTransfers = await prisma.transfer.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      for (const t of recentTransfers) {
        if (t.quantity > 500) { // arbitrary threshold for demo
          const exists = await prisma.anomaly.findFirst({ where: { referenceId: t.id, type: 'LARGE_TRANSFER' } });
          if (!exists) {
            await prisma.anomaly.create({
              data: {
                type: 'LARGE_TRANSFER',
                severity: t.quantity > 1000 ? 'CRITICAL' : 'HIGH',
                baseId: t.sourceBaseId,
                equipmentTypeId: t.equipmentTypeId,
                referenceId: t.id,
                description: `Unusually large transfer detected: ${t.quantity} units.`,
              }
            });
          }
        }
      }

      const baseFilter = req.user.role === 'ADMIN' ? {} : { baseId: req.user.baseId };
      const anomalies = await prisma.anomaly.findMany({
        where: baseFilter,
        orderBy: { createdAt: 'desc' }
      });

      res.json(anomalies);
    } catch (e) { next(e); }
  },

  async resolve(req, res, next) {
    try {
      const { id } = req.params;
      const status = req.body.status || 'RESOLVED';
      const anomaly = await prisma.anomaly.update({
        where: { id: parseInt(id) },
        data: { status, resolvedAt: new Date(), resolvedById: req.user.id }
      });
      res.json(anomaly);
    } catch (e) { next(e); }
  }
};
