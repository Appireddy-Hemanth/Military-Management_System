const prisma = require('../config/db');

const getPurchases = async (req, res, next) => {
    try {
        const where = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { baseId: req.user.baseId }
            : {};

        const purchases = await prisma.purchase.findMany({
            where,
            include: { equipmentType: true, base: true, createdBy: true },
            orderBy: { purchaseDate: 'desc' }
        });
        res.json(purchases);
    } catch (err) { next(err); }
};

const createPurchase = async (req, res, next) => {
    const { baseId, equipmentTypeId, quantity, purchaseDate, referenceNumber } = req.body;

    if (!baseId || !equipmentTypeId || !quantity || !referenceNumber) {
        res.status(400); return next(new Error('Missing required fields'));
    }

    if (req.user.role !== 'ADMIN' && req.user.baseId !== parseInt(baseId)) {
        res.status(403); return next(new Error('Not authorized for this base'));
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const needsApproval = req.user.role === 'LOGISTICS_OFFICER';

            const purchase = await tx.purchase.create({
                data: {
                    baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), quantity: parseInt(quantity),
                    purchaseDate: new Date(purchaseDate || Date.now()),
                    referenceNumber, createdById: req.user.id
                }
            });

            if (needsApproval) {
                // Queue approval instead of updating inventory immediately
                await tx.approval.create({
                    data: { requestType: 'PURCHASE', requestId: purchase.id, requestedById: req.user.id }
                });

                // Notify Base Commander / Admin
                const approvers = await tx.user.findMany({
                    where: { OR: [{ role: 'ADMIN' }, { role: 'BASE_COMMANDER', baseId: parseInt(baseId) }] }
                });

                for (const approver of approvers) {
                    if (approver.id !== req.user.id) {
                        await tx.notification.create({
                            data: {
                                userId: approver.id, type: 'APPROVAL',
                                title: 'Purchase Approval Required',
                                message: `Purchase request PR-${purchase.id} requires approval.`,
                                referenceType: 'PURCHASE', referenceId: purchase.id
                            }
                        });
                    }
                }

                await tx.auditLog.create({
                    data: { userId: req.user.id, action: 'PURCHASE_REQUESTED', details: `Requested purchase PR-${purchase.id} of ${quantity} units.` }
                });
            } else {
                // Instantly update inventory (assume bulk inventory)
                const existingAsset = await tx.asset.findFirst({
                    where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE', serialNumber: null }
                });

                if (existingAsset) {
                    await tx.asset.update({
                        where: { id: existingAsset.id },
                        data: { quantity: existingAsset.quantity + parseInt(quantity) }
                    });
                } else {
                    await tx.asset.create({
                        data: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), quantity: parseInt(quantity), status: 'AVAILABLE' }
                    });
                }

                await tx.auditLog.create({
                    data: { userId: req.user.id, action: 'PURCHASE', details: `Purchased ${quantity} of equipment ${equipmentTypeId} for base ${baseId} (Ref: ${referenceNumber})` }
                });
            }

            return { ...purchase, status: needsApproval ? 'PENDING' : 'COMPLETED' };
        });

        res.status(201).json(result);
    } catch (err) { next(err); }
};

module.exports = { getPurchases, createPurchase };
