const prisma = require('../config/db');

const getBases = async (req, res, next) => {
    try {
        const bases = await prisma.base.findMany();
        res.json(bases);
    } catch (error) {
        next(error);
    }
};

const getBaseById = async (req, res, next) => {
    try {
        const baseId = parseInt(req.params.id);
        if (req.user.role === 'BASE_COMMANDER' && req.user.baseId !== baseId) {
            res.status(403);
            throw new Error('Not authorized to access this base data');
        }

        const base = await prisma.base.findUnique({ where: { id: baseId } });
        if (base) {
            res.json(base);
        } else {
            res.status(404);
            throw new Error('Base not found');
        }
    } catch (error) {
        next(error);
    }
};

const createBase = async (req, res, next) => {
    try {
        const { name, location } = req.body;
        const base = await prisma.base.create({ data: { name, location } });
        await prisma.auditLog.create({
            data: { userId: req.user.id, action: 'CREATE_BASE', details: `Created base ${name}` }
        });
        res.status(201).json(base);
    } catch (error) {
        next(error);
    }
};

const updateBase = async (req, res, next) => {
    try {
        const baseId = parseInt(req.params.id);
        const { name, location } = req.body;
        const base = await prisma.base.update({
            where: { id: baseId },
            data: { name, location }
        });
        await prisma.auditLog.create({
            data: { userId: req.user.id, action: 'UPDATE_BASE', details: `Updated base ${name}` }
        });
        res.json(base);
    } catch (error) {
        next(error);
    }
};

const deleteBase = async (req, res, next) => {
    try {
        const baseId = parseInt(req.params.id);
        await prisma.base.delete({ where: { id: baseId } });
        await prisma.auditLog.create({
            data: { userId: req.user.id, action: 'DELETE_BASE', details: `Deleted base ${baseId}` }
        });
        res.json({ message: 'Base removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getBases, getBaseById, createBase, updateBase, deleteBase };
