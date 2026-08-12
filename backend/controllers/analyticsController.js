
const prisma = require('../config/db');

module.exports = {
  async getOverview(req, res, next) {
    try {
      const baseFilter = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
        ? { baseId: req.user.baseId } : {};

      // Calculate aggregated metrics
      const totalAssets = await prisma.asset.aggregate({ where: baseFilter, _sum: { quantity: true } });
      const purchases = await prisma.purchase.count({ where: baseFilter });
      const transfers = await prisma.transfer.count({
        where: ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
          ? { OR: [{ sourceBaseId: req.user.baseId }, { destinationBaseId: req.user.baseId }] }
          : {}
      });
      const maintenanceCount = await prisma.maintenance.count({ where: {} });

      res.json({
        totalAssets: totalAssets._sum.quantity || 0,
        totalPurchases: purchases,
        totalTransfers: transfers,
        totalMaintenance: maintenanceCount
      });
    } catch (e) { next(e); }
  },

  async getUtilization(req, res, next) {
    try {
      const baseFilter = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
        ? { baseId: req.user.baseId } : {};

      const statuses = await prisma.asset.groupBy({
        by: ['status'],
        where: baseFilter,
        _sum: { quantity: true }
      });

      const utilization = statuses.map(s => ({
        name: s.status,
        value: s._sum.quantity || 0
      }));

      res.json(utilization);
    } catch (e) { next(e); }
  }
};
