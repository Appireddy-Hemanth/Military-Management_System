
const prisma = require('../config/db');

module.exports = {
  async getMaintenanceRecord(req, res, next) {
    try {
      const records = await prisma.maintenance.findMany({
        orderBy: { createdAt: 'desc' } // Expand with baseFilter using asset.baseId if strict RBAC applied
      });
      res.json(records);
    } catch (e) { next(e); }
  },

  async createMaintenance(req, res, next) {
    try {
      const { assetId, type, description, priority, scheduledDate } = req.body;

      const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
      if (!asset) return res.status(404).json({ error: 'Asset not found' });

      const m = await prisma.$transaction(async (tx) => {
        const record = await tx.maintenance.create({
          data: {
            assetId: parseInt(assetId), type, description, priority,
            scheduledDate: new Date(scheduledDate || Date.now())
          }
        });

        await tx.auditLog.create({
          data: { userId: req.user.id, action: 'MAINTENANCE_SCHEDULED', details: `Maintenance scheduled for Asset ID: ${assetId}` }
        });

        return record;
      });

      res.status(201).json(m);
    } catch (e) { next(e); }
  },

  async updateMaintenance(req, res, next) {
    try {
      const { id } = req.params;
      const { status, completedDate, cost, notes, performedBy } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const m = await tx.maintenance.update({
          where: { id: parseInt(id) },
          data: {
            status, cost: cost ? parseFloat(cost) : undefined,
            notes, performedBy,
            completedDate: completedDate ? new Date(completedDate) : undefined
          }
        });

        // Log
        await tx.auditLog.create({
          data: { userId: req.user.id, action: 'MAINTENANCE_UPDATED', details: `Updated maintenance ID ${id} to ${status}` }
        });

        return m;
      });

      res.json(result);
    } catch (e) { next(e); }
  }
};
