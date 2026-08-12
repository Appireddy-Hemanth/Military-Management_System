const prisma = require('../config/db');

const getAssignments = async (req, res, next) => {
    try {
        const where = ['BASE_COMMANDER', 'LOGISTICS_OFFICER'].includes(req.user.role)
            ? { baseId: req.user.baseId } : {};
        const assignments = await prisma.assignment.findMany({
            where, include: { equipmentType: true, base: true, asset: true }, orderBy: { assignedDate: 'desc' }
        });
        res.json(assignments);
    } catch (err) { next(err); }
};

const createAssignment = async (req, res, next) => {
    const { baseId, equipmentTypeId, quantity, assignedTo, serialNumber } = req.body;
    const q = parseInt(quantity);

    if (!baseId || !equipmentTypeId || !assignedTo || !q || q <= 0) {
        return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            let createdAssetId;
            let usedBulk = false;

            if (serialNumber) {
                // First try to find existing serialized asset
                sourceAsset = await tx.asset.findFirst({
                    where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE', serialNumber: serialNumber }
                });

                if (!sourceAsset) {
                    // It doesn't exist. Let's see if we can draw from bulk inventory and serialize it now.
                    const bulkSource = await tx.asset.findFirst({
                        where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE', serialNumber: null }
                    });

                    if (bulkSource && bulkSource.quantity >= 1) {
                        // Draw from bulk
                        await tx.asset.update({
                            where: { id: bulkSource.id },
                            data: { quantity: bulkSource.quantity - 1 }
                        });

                        // Create newly serialized physical asset tracking record, directly into ASSIGNED status
                        const newSerializedAsset = await tx.asset.create({
                            data: {
                                baseId: parseInt(baseId),
                                equipmentTypeId: parseInt(equipmentTypeId),
                                quantity: 1,
                                status: 'ASSIGNED',
                                serialNumber: serialNumber
                            }
                        });

                        sourceAsset = newSerializedAsset;
                        createdAssetId = newSerializedAsset.id;
                        usedBulk = true;
                    } else {
                        throw new Error(`Asset with serial number ${serialNumber} not found, and no bulk inventory available to serialize from.`);
                    }
                }

                if (q > 1) {
                    throw new Error('Can only assign quantity 1 when using a specific serial number');
                }
            } else {
                // Find generic bulk asset (null serialNumber)
                sourceAsset = await tx.asset.findFirst({
                    where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'AVAILABLE', serialNumber: null }
                });

                if (!sourceAsset || sourceAsset.quantity < q) {
                    throw new Error('Insufficient inventory to assign (ensure bulk assets exist)');
                }
            }

            // Create assignment record
            const assignment = await tx.assignment.create({
                data: {
                    baseId: parseInt(baseId),
                    equipmentTypeId: parseInt(equipmentTypeId),
                    assetId: createdAssetId || sourceAsset.id,
                    quantity: q,
                    assignedTo,
                    assignedDate: new Date(),
                    createdById: req.user.id
                }
            });

            if (serialNumber) {
                if (!usedBulk) {
                    // It was an existing serialized asset, just change status
                    await tx.asset.update({
                        where: { id: sourceAsset.id },
                        data: { status: 'ASSIGNED' }
                    });
                }
                // (if usedBulk, we already created it as ASSIGNED above)
            } else {
                // For pure bulk checkout, reduce available and add to bulk assigned
                await tx.asset.update({
                    where: { id: sourceAsset.id },
                    data: { quantity: sourceAsset.quantity - q }
                });

                const assignAssetBulk = await tx.asset.findFirst({
                    where: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), status: 'ASSIGNED', serialNumber: null }
                });

                if (assignAssetBulk) {
                    await tx.asset.update({ where: { id: assignAssetBulk.id }, data: { quantity: assignAssetBulk.quantity + q } });
                } else {
                    await tx.asset.create({ data: { baseId: parseInt(baseId), equipmentTypeId: parseInt(equipmentTypeId), quantity: q, status: 'ASSIGNED' } });
                }
            }

            await tx.auditLog.create({
                data: { userId: req.user.id, action: 'ASSIGNMENT', details: `Assigned ${q} of eqId ${equipmentTypeId} ${serialNumber ? `(SN: ${serialNumber})` : ''} to ${assignedTo}` }
            });
            return assignment;
        });
        res.status(201).json(result);
    } catch (err) {
        if (err.message.includes('not found') || err.message.includes('Insufficient') || err.message.includes('Can only assign')) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};
module.exports = { getAssignments, createAssignment };
