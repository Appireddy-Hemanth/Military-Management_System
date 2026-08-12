
const prisma = require('../config/db');

// In a real scenario we'd use something like json2csv, pdfkit, exceljs here,
// but returning the raw robust nested JSON for the frontend to render/export is perfectly fine for modern React.

module.exports = {
  async getInventoryReport(req, res, next) {
    try {
      const baseFilter = req.user.role === 'ADMIN' ? {} : { baseId: req.user.baseId };
      const data = await prisma.asset.findMany({ where: baseFilter, include: { base: true, equipmentType: true } });
      res.json(data);
    } catch (e) { next(e); }
  },

  async getPurchasesReport(req, res, next) {
    try {
      const baseFilter = req.user.role === 'ADMIN' ? {} : { baseId: req.user.baseId };
      const data = await prisma.purchase.findMany({ where: baseFilter, include: { base: true, equipmentType: true, createdBy: true } });
      res.json(data);
    } catch (e) { next(e); }
  },

  async getTransfersReport(req, res, next) {
    try {
      const authClause = req.user.role === 'ADMIN' ? {} : {
        OR: [
          { sourceBaseId: req.user.baseId },
          { destinationBaseId: req.user.baseId }
        ]
      };
      const data = await prisma.transfer.findMany({ where: authClause, include: { sourceBase: true, destinationBase: true, equipmentType: true } });
      res.json(data);
    } catch (e) { next(e); }
  },

  async getExpendituresReport(req, res, next) {
    try {
      const authClause = req.user.role === 'ADMIN' ? {} : { baseId: req.user.baseId };
      const data = await prisma.expenditure.findMany({ where: authClause, include: { base: true, equipmentType: true } });
      res.json(data);
    } catch (e) { next(e); }
  },

  async getMaintenanceReport(req, res, next) {
    try {
      const data = await prisma.maintenance.findMany({ orderBy: { createdAt: 'desc' }, include: { asset: { include: { base: true, equipmentType: true } } } });
      res.json(data);
    } catch (e) { next(e); }
  }
};
