const prisma = require('../config/db');

const getMetrics = async (req, res, next) => {
    try {
        let baseFilter = {};
        let tInFilter = {};
        let tOutFilter = {};

        if (req.query.baseId) {
            baseFilter.baseId = parseInt(req.query.baseId);
            tInFilter.destinationBaseId = parseInt(req.query.baseId);
            tOutFilter.sourceBaseId = parseInt(req.query.baseId);
        }
        if (['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)) {
            baseFilter.baseId = req.user.baseId;
            tInFilter.destinationBaseId = req.user.baseId;
            tOutFilter.sourceBaseId = req.user.baseId;
        }

        // Aggregations
        const availableAssets = await prisma.asset.aggregate({ where: { ...baseFilter, status: 'AVAILABLE' }, _sum: { quantity: true } });
        const assignedAssets = await prisma.asset.aggregate({ where: { ...baseFilter, status: 'ASSIGNED' }, _sum: { quantity: true } });

        const purchases = await prisma.purchase.aggregate({ where: { ...baseFilter }, _sum: { quantity: true } });

        // Ensure accurate metrics based on actual destination vs source rules
        const transfersIn = await prisma.transfer.aggregate({
            where: { ...tInFilter, status: 'COMPLETED' }, _sum: { quantity: true }
        });

        const transfersOut = await prisma.transfer.aggregate({
            where: { ...tOutFilter, status: 'COMPLETED' }, _sum: { quantity: true }
        });

        const assignments = await prisma.assignment.aggregate({ where: { ...baseFilter }, _sum: { quantity: true } });
        const expenditures = await prisma.expenditure.aggregate({ where: { ...baseFilter }, _sum: { quantity: true } });

        const p = purchases._sum.quantity || 0;
        const tIn = transfersIn._sum.quantity || 0;
        const tOut = transfersOut._sum.quantity || 0;
        const a = assignments._sum.quantity || 0;
        const e = expenditures._sum.quantity || 0;

        const netMovement = p + tIn - tOut;
        const openingBalance = 0; // Simple starting balance for this dynamic system
        const closingBalance = openingBalance + netMovement - a - e;

        res.json({
            totalAvailable: availableAssets._sum.quantity || 0,
            totalAssigned: assignedAssets._sum.quantity || 0,
            openingBalance, purchases: p, transfersIn: tIn, transfersOut: tOut,
            netMovement, assigned: a, expended: e, closingBalance
        });
    } catch (err) { next(err); }
};

const getDistribution = async (req, res, next) => {
    try {
        const baseFilter = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { baseId: req.user.baseId } : {};

        const assets = await prisma.asset.findMany({
            where: baseFilter, include: { equipmentType: true }
        });

        const distribution = assets.reduce((acc, curr) => {
            const cat = curr.equipmentType.category;
            acc[cat] = (acc[cat] || 0) + curr.quantity;
            return acc;
        }, {});

        res.json(Object.keys(distribution).map(k => ({ name: k, value: distribution[k] })));
    } catch (err) { next(err); }
};

const getAlerts = async (req, res, next) => {
    try {
        const baseFilter = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { baseId: req.user.baseId } : {};

        const assets = await prisma.asset.findMany({
            where: { ...baseFilter, status: 'AVAILABLE' },
            include: { equipmentType: true, base: true }
        });

        // Hardcode thresholds if db rows are missing for demo purposes, or fallback to 10 for critical 50 for min
        const grouped = assets.reduce((acc, asset) => {
            const key = `${asset.baseId}-${asset.equipmentTypeId}`;
            if (!acc[key]) {
                acc[key] = {
                    base: asset.base, equipmentType: asset.equipmentType, quantity: 0,
                    baseId: asset.baseId, equipmentTypeId: asset.equipmentTypeId
                };
            }
            acc[key].quantity += asset.quantity;
            return acc;
        }, {});

        // Fetch thresholds from db... (if they don't exist use fallback)
        const dbThresholds = await prisma.inventoryThreshold.findMany({ where: baseFilter });
        const thresholdDict = dbThresholds.reduce((acc, curr) => {
            acc[`${curr.baseId}-${curr.equipmentTypeId}`] = curr;
            return acc;
        }, {});

        let alerts = [];
        for (let key in grouped) {
            const item = grouped[key];
            // In true system we would define thresholds per equipment.
            // Since seed data probably doesn't have it, we default to 50 minimum, 20 critical if not explicitly in dict
            const t = thresholdDict[key] || { minimumStock: 50, criticalStock: 20 };

            if (item.quantity <= t.criticalStock) {
                alerts.push({ ...item, level: 'CRITICAL', min: t.minimumStock, crit: t.criticalStock });
            } else if (item.quantity <= t.minimumStock) {
                alerts.push({ ...item, level: 'LOW', min: t.minimumStock, crit: t.criticalStock });
            }
        }

        res.json(alerts);
    } catch (err) { next(err); }
}

module.exports = { getMetrics, getDistribution, getAlerts };
