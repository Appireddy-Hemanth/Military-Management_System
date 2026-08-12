const prisma = require('../config/db');

const getTransfers = async (req, res, next) => {
    try {
        const where = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { OR: [{ sourceBaseId: req.user.baseId }, { destinationBaseId: req.user.baseId }] }
            : {};

        const transfers = await prisma.transfer.findMany({
            where,
            include: { equipmentType: true, sourceBase: true, destinationBase: true, initiatedBy: true },
            orderBy: { timestamp: 'desc' }
        });
        res.json(transfers);
    } catch (err) { next(err); }
};

const createTransfer = async (req, res, next) => {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } = req.body;
    const q = parseInt(quantity);

    if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !q) {
        res.status(400); return next(new Error('Missing required fields'));
    }
    if (q <= 0) {
        res.status(400); return next(new Error('Quantity must be > 0'));
    }
    if (sourceBaseId === destinationBaseId) {
        res.status(400); return next(new Error('Source and destination bases cannot be identical'));
    }

    if (req.user.role !== 'ADMIN' && req.user.baseId !== parseInt(sourceBaseId)) {
        res.status(403); return next(new Error('Not authorized to initiate transfer from this base'));
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check available stock at source (both bulk and serialized)
            const sourceAssets = await tx.asset.findMany({
                where: { baseId: parseInt(sourceBaseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE' }
            });
            const totalAvailable = sourceAssets.reduce((sum, a) => sum + a.quantity, 0);

            if (totalAvailable < q) {
                throw new Error('Insufficient inventory at source base');
            }

            // Create transfer record (status PENDING initially for everyone, or we can auto-approve ADMIN)
            const needsApproval = req.user.role !== 'ADMIN';

            const transfer = await tx.transfer.create({
                data: {
                    sourceBaseId: parseInt(sourceBaseId), destinationBaseId: parseInt(destinationBaseId),
                    equipmentTypeId: parseInt(equipmentTypeId), quantity: q,
                    status: needsApproval ? 'PENDING' : 'IN_TRANSIT', initiatedById: req.user.id
                },
                include: { equipmentType: true, sourceBase: true, destinationBase: true, initiatedBy: true }
            });

            if (needsApproval) {
                // Create Approval record
                await tx.approval.create({
                    data: {
                        requestType: 'TRANSFER', requestId: transfer.id, requestedById: req.user.id
                    }
                });

                // Find users who can approve (Base commander of that base or Admin)
                const approvers = await tx.user.findMany({
                    where: { OR: [{ role: 'ADMIN' }, { role: 'BASE_COMMANDER', baseId: parseInt(sourceBaseId) }] }
                });

                for (const approver of approvers) {
                    if (approver.id !== req.user.id) {
                        await tx.notification.create({
                            data: {
                                userId: approver.id, type: 'APPROVAL',
                                title: 'Transfer Approval Required',
                                message: `Transfer TR-${transfer.id} requires approval.`,
                                referenceType: 'TRANSFER', referenceId: transfer.id
                            }
                        });
                    }
                }

                await tx.auditLog.create({
                    data: { userId: req.user.id, action: 'TRANSFER_REQUESTED', details: `Requested transfer TR-${transfer.id} (${q} units)` }
                });

            } else {
                let remaining = q;
                const sortedAssets = sourceAssets.sort((a, b) => (a.serialNumber === null ? -1 : 1));

                for (const asset of sortedAssets) {
                    if (remaining <= 0) break;

                    if (asset.serialNumber) {
                        // Fully move serialized asset to IN_TRANSIT at destination base
                        await tx.asset.update({
                            where: { id: asset.id },
                            data: { status: 'IN_TRANSIT', baseId: parseInt(destinationBaseId) }
                        });
                        remaining -= 1;
                    } else {
                        // Bulk logic
                        const deduct = Math.min(asset.quantity, remaining);
                        await tx.asset.update({
                            where: { id: asset.id },
                            data: { quantity: asset.quantity - deduct }
                        });

                        const inTransitAsset = await tx.asset.findFirst({
                            where: { baseId: parseInt(destinationBaseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'IN_TRANSIT', serialNumber: null }
                        });

                        if (inTransitAsset) {
                            await tx.asset.update({
                                where: { id: inTransitAsset.id },
                                data: { quantity: inTransitAsset.quantity + deduct }
                            });
                        } else {
                            await tx.asset.create({
                                data: { baseId: parseInt(destinationBaseId), equipmentTypeId: parseInt(equipmentTypeId), quantity: deduct, status: 'IN_TRANSIT' }
                            });
                        }
                        remaining -= deduct;
                    }
                }

                await tx.auditLog.create({
                    data: { userId: req.user.id, action: 'TRANSFER_INITIATED', details: `Initiated transfer TR-${transfer.id}` }
                });
            }

            return transfer;
        });

        if (req.io) {
            req.io.emit('transferUpdate', { type: 'CREATED', data: result });
            if (result.status === 'PENDING') {
                req.io.emit('approvalUpdate', result);
            }
        }

        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'Insufficient inventory at source base') {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

const completeTransfer = async (req, res, next) => {
    const { id } = req.params;

    try {
        const transfer = await prisma.transfer.findUnique({
            where: { id: parseInt(id) }
        });

        if (!transfer || transfer.status !== 'IN_TRANSIT') {
            res.status(404); return next(new Error('Transfer not found or not in transit'));
        }

        if (req.user.role !== 'ADMIN' && req.user.baseId !== transfer.destinationBaseId) {
            res.status(403); return next(new Error('Not authorized to complete transfer to this base'));
        }

        const result = await prisma.$transaction(async (tx) => {
            // Update transfer status
            const updatedTransfer = await tx.transfer.update({
                where: { id: parseInt(id) },
                data: { status: 'COMPLETED' },
                include: { equipmentType: true, sourceBase: true, destinationBase: true, initiatedBy: true }
            });

            // Find all IN_TRANSIT assets for this destination and equipment type
            const inTransitAssets = await tx.asset.findMany({
                where: { baseId: transfer.destinationBaseId, equipmentTypeId: transfer.equipmentTypeId, status: 'IN_TRANSIT' }
            });

            // Sort to process bulk first if possible, though for completion it doesn't matter too much
            let remainingToComplete = transfer.quantity;
            for (const asset of inTransitAssets) {
                if (remainingToComplete <= 0) break;

                if (asset.serialNumber) {
                    await tx.asset.update({
                        where: { id: asset.id },
                        data: { status: 'AVAILABLE' }
                    });
                    remainingToComplete -= 1;
                } else {
                    const completeQty = Math.min(asset.quantity, remainingToComplete);
                    // Deduct from bulk IN_TRANSIT
                    await tx.asset.update({
                        where: { id: asset.id },
                        data: { quantity: Math.max(0, asset.quantity - completeQty) }
                    });

                    // Add to AVAILABLE bulk asset
                    const destAsset = await tx.asset.findFirst({
                        where: { baseId: transfer.destinationBaseId, equipmentTypeId: transfer.equipmentTypeId, status: 'AVAILABLE', serialNumber: null }
                    });

                    if (destAsset) {
                        await tx.asset.update({
                            where: { id: destAsset.id },
                            data: { quantity: destAsset.quantity + completeQty }
                        });
                    } else {
                        await tx.asset.create({
                            data: { baseId: transfer.destinationBaseId, equipmentTypeId: transfer.equipmentTypeId, quantity: completeQty, status: 'AVAILABLE' }
                        });
                    }
                    remainingToComplete -= completeQty;
                }
            }

            await tx.auditLog.create({
                data: { userId: req.user.id, action: 'TRANSFER_COMPLETED', details: `Completed transfer ID ${id} of ${transfer.quantity} units to Base ${transfer.destinationBaseId}` }
            });

            return updatedTransfer;
        });

        if (req.io) {
            req.io.emit('transferUpdate', { type: 'COMPLETED', data: result });
        }

        res.json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = { getTransfers, createTransfer, completeTransfer };
