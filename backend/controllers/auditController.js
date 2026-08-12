const prisma = require('../config/db');

const getAuditLogs = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') {
            res.status(403);
            return next(new Error('Not authorized to view global audit logs'));
        }

        // Additional filtering could be added here
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { id: true, username: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json(logs);
    } catch (err) { next(err); }
};

module.exports = { getAuditLogs };
