const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, baseId: true, createdAt: true } });
        res.json(users);
    } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
    try {
        const { username, password, role, baseId } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, passwordHash, role, baseId }
        });
        delete user.passwordHash;
        await prisma.auditLog.create({ data: { userId: req.user.id, action: 'CREATE_USER', details: `Created user ${username}` } });
        res.status(201).json(user);
    } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);
        await prisma.user.delete({ where: { id: userId } });
        await prisma.auditLog.create({ data: { userId: req.user.id, action: 'DELETE_USER', details: `Deleted user ${userId}` } });
        res.json({ message: 'User removed' });
    } catch (error) { next(error); }
};

module.exports = { getUsers, createUser, deleteUser };
