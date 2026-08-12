
const prisma = require('../config/db');

module.exports = {
  async getApprovals(req, res, next) {
    try {
      const authClause = req.user.role === 'ADMIN' ? {} : {
        OR: [
          { status: 'PENDING' },
          { requestedById: req.user.id },
          { reviewedById: req.user.id }
        ]
      };

      const approvals = await prisma.approval.findMany({
        where: authClause,
        orderBy: { createdAt: 'desc' },
      });

      // Let's attach full details for Transfers manually since relation is polymorphic via 'requestId'
      const populated = await Promise.all(approvals.map(async app => {
        let details = null;
        if (app.requestType === 'TRANSFER') {
          details = await prisma.transfer.findUnique({
            where: { id: app.requestId },
            include: { equipmentType: true, sourceBase: true, destinationBase: true, initiatedBy: true }
          });
        }
        if (app.requestType === 'PURCHASE') {
          details = await prisma.purchase.findUnique({
            where: { id: app.requestId },
            include: { equipmentType: true, base: true, createdBy: true }
          });
        }
        return { ...app, details };
      }));

      res.json(populated);
    } catch (err) { next(err); }
  },

  async approve(req, res, next) {
    try {
      if (req.user.role === 'LOGISTICS_OFFICER') {
        return res.status(403).json({ error: 'Only Command / Admin can approve requests.' });
      }

      const { id } = req.params;
      const approval = await prisma.approval.findUnique({ where: { id: parseInt(id) } });

      if (!approval || approval.status !== 'PENDING') {
        return res.status(404).json({ error: 'Approval not found or not pending.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update Approval
        const updatedApproval = await tx.approval.update({
          where: { id: parseInt(id) },
          data: { status: 'APPROVED', reviewedById: req.user.id, reviewedAt: new Date() }
        });

        if (approval.requestType === 'TRANSFER') {
          const transfer = await tx.transfer.findUnique({ where: { id: approval.requestId } });

          const sourceAssets = await tx.asset.findMany({
            where: { baseId: transfer.sourceBaseId, equipmentTypeId: transfer.equipmentTypeId, status: 'AVAILABLE' }
          });
          const totalAvailable = sourceAssets.reduce((sum, a) => sum + a.quantity, 0);

          if (totalAvailable < transfer.quantity) {
            throw new Error('Insufficient inventory at source base to approve transfer');
          }

          let remaining = transfer.quantity;
          const sortedAssets = sourceAssets.sort((a, b) => (a.serialNumber === null ? -1 : 1));

          for (const asset of sortedAssets) {
            if (remaining <= 0) break;

            if (asset.serialNumber) {
              await tx.asset.update({
                where: { id: asset.id },
                data: { status: 'IN_TRANSIT', baseId: transfer.destinationBaseId }
              });
              remaining -= 1;
            } else {
              const deduct = Math.min(asset.quantity, remaining);
              await tx.asset.update({
                where: { id: asset.id },
                data: { quantity: asset.quantity - deduct }
              });

              const inTransitAsset = await tx.asset.findFirst({
                where: { baseId: transfer.destinationBaseId, equipmentTypeId: transfer.equipmentTypeId, status: 'IN_TRANSIT', serialNumber: null }
              });

              if (inTransitAsset) {
                await tx.asset.update({
                  where: { id: inTransitAsset.id },
                  data: { quantity: inTransitAsset.quantity + deduct }
                });
              } else {
                await tx.asset.create({
                  data: { baseId: transfer.destinationBaseId, equipmentTypeId: transfer.equipmentTypeId, quantity: deduct, status: 'IN_TRANSIT' }
                });
              }
              remaining -= deduct;
            }
          }

          await tx.transfer.update({
            where: { id: transfer.id },
            data: { status: 'IN_TRANSIT' }
          });

          await tx.notification.create({
            data: {
              userId: transfer.initiatedById, type: 'APPROVAL',
              title: 'Transfer Approved', message: `Transfer TR-${transfer.id} has been approved.`,
              referenceType: 'TRANSFER', referenceId: transfer.id
            }
          });

          // Timeline logic later...
        } else if (approval.requestType === 'PURCHASE') {
          const purchase = await tx.purchase.findUnique({ where: { id: approval.requestId } });

          const destAsset = await tx.asset.findFirst({
            where: { baseId: purchase.baseId, equipmentTypeId: purchase.equipmentTypeId, status: 'AVAILABLE', serialNumber: null }
          });

          if (destAsset) {
            await tx.asset.update({
              where: { id: destAsset.id },
              data: { quantity: destAsset.quantity + purchase.quantity }
            });
          } else {
            await tx.asset.create({
              data: { baseId: purchase.baseId, equipmentTypeId: purchase.equipmentTypeId, quantity: purchase.quantity, status: 'AVAILABLE' }
            });
          }

          await tx.notification.create({
            data: {
              userId: purchase.createdById, type: 'APPROVAL',
              title: 'Purchase Approved', message: `Purchase request PR-${purchase.id} has been approved.`,
              referenceType: 'PURCHASE', referenceId: purchase.id
            }
          });
        }

        return updatedApproval;
      });

      if (req.io) {
        req.io.emit('approvalUpdate', result);
        if (approval.requestType === 'TRANSFER') {
          const freshTransfer = await prisma.transfer.findUnique({ where: { id: approval.requestId }, include: { equipmentType: true, sourceBase: true, destinationBase: true, initiatedBy: true } });
          req.io.emit('transferUpdate', { type: 'CREATED', data: freshTransfer });
        }
      }

      res.json(result);
    } catch (e) {
      if (e.message.includes('Insufficient inventory')) return res.status(400).json({ error: e.message });
      next(e);
    }
  },

  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const approval = await prisma.approval.findUnique({ where: { id: parseInt(id) } });

      if (!approval || approval.status !== 'PENDING') {
        return res.status(404).json({ error: 'Approval not found or not pending.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedApproval = await tx.approval.update({
          where: { id: parseInt(id) },
          data: { status: 'REJECTED', reviewedById: req.user.id, reviewedAt: new Date(), reason }
        });

        if (approval.requestType === 'TRANSFER') {
          await tx.transfer.update({
            where: { id: approval.requestId },
            data: { status: 'CANCELLED' }
          });
          await tx.notification.create({
            data: {
              userId: approval.requestedById, type: 'APPROVAL',
              title: 'Transfer Rejected', message: `Transfer TR-${approval.requestId} was rejected.`,
              referenceType: 'TRANSFER', referenceId: approval.requestId
            }
          });
        } else if (approval.requestType === 'PURCHASE') {
          // Delete or mark purchase as cancelled. Purchase model doesn't have status, we'll just delete the record for now if rejected, 
          // or maybe we should add a status to purchase... let's just leave it in the history but don't add inventory. 
          // Wait, if it wasn't added to inventory, it's just a log.
          await tx.notification.create({
            data: {
              userId: approval.requestedById, type: 'APPROVAL',
              title: 'Purchase Rejected', message: `Purchase request PR-${approval.requestId} was rejected.`,
              referenceType: 'PURCHASE', referenceId: approval.requestId
            }
          });
        }

        return updatedApproval;
      });

      res.json(result);
    } catch (err) { next(err); }
  }
};
