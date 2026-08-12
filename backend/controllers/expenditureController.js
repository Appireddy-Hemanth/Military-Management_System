const prisma = require('../config/db');

const getExpenditures = async (req, res, next) => {
    try {
        const where = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { baseId: req.user.baseId } : {};
        const computations = await prisma.expenditure.findMany({
            where, include: { equipmentType: true, base: true, recordedBy: true }, orderBy: { expenditureDate: 'desc' }
        });
        res.json(computations);
    } catch (err) { next(err); }
};

const createExpenditure = async (req, res, next) => {
    const { baseId, equipmentTypeId, quantity, reason } = req.body;
    const q = parseInt(quantity);

    if (!baseId || !equipmentTypeId || !reason || !q || q <= 0) {
        return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const sourceAsset = await tx.asset.findFirst({
                where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE', serialNumber: null }
            });

            if (!sourceAsset || sourceAsset.quantity < q) {
                throw new Error('Insufficient inventory to expend');
            }

            const expenditure = await tx.expenditure.create({
                data: {
                    baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId),
                    quantity: q, reason, expenditureDate: new Date(), recordedById: req.user.id
                }
            });

            await tx.asset.update({
                where: { id: sourceAsset.id },
                data: { quantity: sourceAsset.quantity - q }
            });

            await tx.auditLog.create({
                data: { userId: req.user.id, action: 'EXPENDITURE', details: `Expended ${q} of eqId ${equipmentTypeId}, reason: ${reason}` }
            });
            return expenditure;
        });
        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'Insufficient inventory to expend') return res.status(400).json({ error: err.message });
        next(err);
    }
};
module.exports = { getExpenditures, createExpenditure };
