const prisma = require('../config/db');

const getAssets = async (req, res, next) => {
    try {
        const where = (req.user.role === 'BASE_COMMANDER' || req.user.role === 'LOGISTICS_OFFICER')
            ? { baseId: req.user.baseId }
            : {};

        const assets = await prisma.asset.findMany({
            where,
            include: { equipmentType: true, base: true }
        });
        res.json(assets);
    } catch (error) { next(error); }
};

const getAssetTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;
        const timeline = await prisma.assetTimeline.findMany({
            where: { assetId: parseInt(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(timeline);
    } catch (err) { next(err); }
};

module.exports = { getAssets, getAssetTimeline };
