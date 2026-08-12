const prisma = require('../config/db');

const getEquipment = async (req, res, next) => {
    try {
        const equipment = await prisma.equipmentType.findMany();
        res.json(equipment);
    } catch (error) { next(error); }
};

const createEquipment = async (req, res, next) => {
    try {
        const { name, category, description } = req.body;
        const eq = await prisma.equipmentType.create({ data: { name, category, description } });
        await prisma.auditLog.create({ data: { userId: req.user.id, action: 'CREATE_EQUIPMENT', details: `Created equipment ${name}` } });
        res.status(201).json(eq);
    } catch (error) { next(error); }
};

module.exports = { getEquipment, createEquipment };
